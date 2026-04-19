import { spawnSync } from 'node:child_process';
import type { Loader, LoaderContext } from 'astro/loaders';

const OWNER = 'urmzd';
const API = 'https://api.github.com';
const SHOWCASE_TOPIC = 'showcase';
const RESEARCH_TOPIC = 'research';
const SHOWCASE_FILE = 'SHOWCASE.md';

interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
  private: boolean;
  default_branch: string;
}

function resolveToken(logger: LoaderContext['logger']): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const res = spawnSync('gh', ['auth', 'token'], { encoding: 'utf-8' });
  if (res.status === 0 && res.stdout.trim()) {
    logger.info('Using token from gh CLI');
    return res.stdout.trim();
  }
  logger.warn('No GITHUB_TOKEN or gh auth — anonymous rate limit (60 req/hr)');
  return undefined;
}

async function gh<T>(path: string, token: string | undefined): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function listRepos(token: string | undefined): Promise<Repo[]> {
  const repos: Repo[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await gh<Repo[]>(
      `/users/${OWNER}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      token,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

async function fetchFile(
  repo: string,
  path: string,
  token: string | undefined,
): Promise<string | null> {
  try {
    const data = await gh<{ content: string; encoding: string }>(
      `/repos/${OWNER}/${repo}/contents/${path}`,
      token,
    );
    if (data.encoding !== 'base64') return null;
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

async function fetchReadme(repo: string, token: string | undefined): Promise<string> {
  try {
    const data = await gh<{ content: string; encoding: string }>(
      `/repos/${OWNER}/${repo}/readme`,
      token,
    );
    if (data.encoding !== 'base64') return '';
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function parseFrontmatter(raw: string): {
  fields: Record<string, string | string[]>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fields: {}, body: raw };

  const fields: Record<string, string | string[]> = {};
  const lines = match[1].split(/\r?\n/);
  let key = '';
  let listValues: string[] | null = null;

  const flush = (buffered: string | null) => {
    if (!key) return;
    if (listValues !== null) fields[key] = listValues;
    else if (buffered !== null) fields[key] = unquote(buffered.trim());
  };

  let buffered: string | null = null;
  for (const line of lines) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      flush(buffered);
      key = kv[1];
      const v = kv[2].trim();
      buffered = null;
      listValues = null;
      if (v.startsWith('[') && v.endsWith(']')) {
        listValues = v
          .slice(1, -1)
          .split(',')
          .map((s) => unquote(s.trim()))
          .filter(Boolean);
      } else {
        buffered = v;
      }
    } else if (key && /^\s*-\s+/.test(line)) {
      if (listValues === null) listValues = [];
      listValues.push(unquote(line.replace(/^\s*-\s+/, '').trim()));
    }
  }
  flush(buffered);

  return { fields, body: raw.slice(match[0].length) };
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function asString(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asStringArray(v: string | string[] | undefined): string[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

export function githubLoader(): Loader {
  return {
    name: 'github-repos',
    load: async (ctx: LoaderContext) => {
      const { store, parseData, generateDigest, renderMarkdown, logger } = ctx;
      store.clear();

      const token = resolveToken(logger);
      const repos = await listRepos(token);
      const eligible = repos.filter((r) => {
        if (r.private || r.fork) return false;
        const topics = r.topics ?? [];
        return topics.includes(SHOWCASE_TOPIC) || topics.includes(RESEARCH_TOPIC);
      });
      logger.info(`Found ${eligible.length} showcase/research repos (of ${repos.length} total)`);

      for (const repo of eligible) {
        const showcase = await fetchFile(repo.name, SHOWCASE_FILE, token);
        const { fields, body: showcaseBody } = showcase
          ? parseFrontmatter(showcase)
          : { fields: {}, body: '' };

        const body = showcaseBody || (await fetchReadme(repo.name, token));
        const isResearch = (repo.topics ?? []).includes(RESEARCH_TOPIC);

        const data = await parseData({
          id: repo.name,
          data: {
            kind: isResearch ? 'research' : 'project',
            title: asString(fields.title) ?? repo.name,
            description: asString(fields.description) ?? repo.description ?? '',
            tags: asStringArray(fields.tags) ?? repo.topics ?? [],
            status: repo.archived ? 'archived' : 'active',
            githubUrl: repo.html_url,
            homepageUrl: repo.homepage || undefined,
            language: repo.language ?? undefined,
            stars: repo.stargazers_count,
            pushedAt: repo.pushed_at,
            year: asString(fields.year),
            venue: asString(fields.venue),
            paperUrl: asString(fields.paperUrl),
          },
        });

        store.set({
          id: repo.name,
          data,
          body,
          digest: generateDigest(body + JSON.stringify(data)),
          rendered: body ? await renderMarkdown(body) : undefined,
        });
      }

      logger.info(`Loaded ${eligible.length} projects`);
    },
  };
}
