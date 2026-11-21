import { spawnSync } from 'node:child_process';
import type { Loader, LoaderContext } from 'astro/loaders';

const OWNER = 'urmzd';
const API = 'https://api.github.com';
const SHOWCASE_TOPIC = 'showcase';
const RESEARCH_TOPIC = 'research';
const SHOWCASE_FILE = 'SHOWCASE.md';
const SHOWCASE_DIR = 'showcase';
/** Repos that are not portfolio entries: the profile README and the docs index. */
const EXCLUDED = new Set([OWNER, 'docs.urmzd.com']);
/** Opt-out topic for a public repo that should stay off the site. */
const HIDDEN_TOPIC = 'unlisted';
/** Topics that route or flag an entry; they are not shown as tags. */
const META_TOPICS = new Set([SHOWCASE_TOPIC, RESEARCH_TOPIC, HIDDEN_TOPIC]);
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

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

interface DirEntry {
  name: string;
  type: string;
}

async function listDir(repo: string, path: string, token: string | undefined): Promise<string[]> {
  try {
    const entries = await gh<DirEntry[]>(`/repos/${OWNER}/${repo}/contents/${path}`, token);
    return Array.isArray(entries)
      ? entries.filter((e) => e.type === 'file').map((e) => e.name)
      : [];
  } catch {
    return [];
  }
}

const BADGE = /shields\.io|badge|codecov|\/actions\/workflows\/|\/workflows\/.*\.svg/i;

/** First non-badge image referenced by a Markdown or HTML body. */
function firstImage(body: string): string | undefined {
  const re = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)|<img\b[^>]*?\bsrc=["']([^"']+)["']/gi;
  for (const m of body.matchAll(re)) {
    const src = m[1] ?? m[2];
    if (src && !BADGE.test(src)) return src;
  }
  return undefined;
}

function isRelative(url: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
}

function rawUrl(repo: Repo, path: string): string {
  const clean = path.replace(/^\.?\//, '');
  return `https://raw.githubusercontent.com/${OWNER}/${repo.name}/${repo.default_branch}/${clean}`;
}

function blobUrl(repo: Repo, path: string): string {
  const clean = path.replace(/^\.?\//, '');
  return `${repo.html_url}/blob/${repo.default_branch}/${clean}`;
}

/**
 * Point repo-relative links and images at GitHub so they resolve on urmzd.com.
 * Images load from raw.githubusercontent.com; other links open on github.com.
 */
function absolutizeBody(body: string, repo: Repo): string {
  // Root-relative paths ("/docs/x.png") are repo-root paths on GitHub, so they are
  // rewritten too; rawUrl and blobUrl strip the leading slash.
  const fix = (url: string, image: boolean) => {
    if (!isRelative(url)) return url;
    return image || IMAGE_EXT.test(url.split(/[?#]/)[0]) ? rawUrl(repo, url) : blobUrl(repo, url);
  };
  // srcset holds "url descriptor, url descriptor"; rewrite each URL on its own.
  const fixSrcset = (value: string) =>
    value
      .split(',')
      .map((part) => part.trim().replace(/^(\S+)/, (u) => fix(u, true)))
      .join(', ');

  // Leave fenced code blocks alone: they are examples, not links.
  return body
    .split(/(^```[\s\S]*?^```)/m)
    .map((chunk, i) => {
      if (i % 2 === 1) return chunk;
      return (
        chunk
          // Images first, so a linked image's outer [..](target) is visible to the link pass.
          .replace(
            /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g,
            (_, alt, url, title) => {
              return `![${alt}](${fix(url, true)}${title})`;
            },
          )
          .replace(
            /(^|[^!])\[((?:[^[\]]|!\[[^\]]*\]\([^)]*\))*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g,
            (_, lead, text, url, title) => `${lead}[${text}](${fix(url, false)}${title})`,
          )
          // Reference-style definitions: [label]: ./path
          .replace(/^(\s{0,3}\[[^\]]+\]:\s*)(\S+)/gm, (_, pre, url) => `${pre}${fix(url, false)}`)
          .replace(/(<(?:img|source)\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi, (_, pre, url, post) => {
            return `${pre}${fix(url, true)}${post}`;
          })
          .replace(
            /(<(?:img|source)\b[^>]*?\bsrcset=["'])([^"']+)(["'])/gi,
            (_, pre, value, post) => {
              return `${pre}${fixSrcset(value)}${post}`;
            },
          )
          .replace(/(<a\b[^>]*?\bhref=["'])([^"']+)(["'])/gi, (_, pre, url, post) => {
            return `${pre}${fix(url, false)}${post}`;
          })
      );
    })
    .join('');
}

/** Absolute http(s) URL for an image reference, or undefined when it cannot be one. */
function absoluteImage(url: string): string | undefined {
  try {
    const u = new URL(url, 'https://github.com');
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Card image for a repo: SHOWCASE.md `image`, else the first image in the body,
 * else the first file in showcase/. A GIF is swapped for a same-named PNG when one
 * exists, so the listing page loads stills instead of animations. Never throws and
 * never returns a value the content schema would reject.
 */
async function resolveImage(
  repo: Repo,
  explicit: string | undefined,
  body: string,
  token: string | undefined,
): Promise<string | undefined> {
  const candidate = explicit ?? firstImage(body);

  if (candidate) {
    if (!isRelative(candidate)) return absoluteImage(candidate);
    const path = candidate.replace(/^\.?\//, '');
    if (/\.gif$/i.test(path) && path.startsWith(`${SHOWCASE_DIR}/`)) {
      const png = path.slice(SHOWCASE_DIR.length + 1).replace(/\.gif$/i, '.png');
      const files = await listDir(repo.name, SHOWCASE_DIR, token);
      if (files.includes(png)) return absoluteImage(rawUrl(repo, `${SHOWCASE_DIR}/${png}`));
    }
    return absoluteImage(rawUrl(repo, path));
  }

  const images = (await listDir(repo.name, SHOWCASE_DIR, token)).filter((f) => IMAGE_EXT.test(f));
  const pick =
    images.find((f) => /^demo\.(png|webp|jpe?g)$/i.test(f)) ??
    images.find((f) => /\.(png|webp|jpe?g)$/i.test(f) && !/light/i.test(f)) ??
    images.find((f) => /\.(png|webp|jpe?g)$/i.test(f)) ??
    images[0];
  return pick ? absoluteImage(rawUrl(repo, `${SHOWCASE_DIR}/${pick}`)) : undefined;
}

/** GitHub stores the homepage as typed; add a scheme and drop anything unparsable. */
function normalizeUrl(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`).toString();
  } catch {
    return undefined;
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
      // Every public, non-fork repo is listed so new work appears without tagging.
      // The `unlisted` topic opts a public repo out.
      const eligible = repos.filter((r) => {
        if (r.private || r.fork || EXCLUDED.has(r.name)) return false;
        return !(r.topics ?? []).includes(HIDDEN_TOPIC);
      });
      logger.info(`Found ${eligible.length} public repos (of ${repos.length} total)`);

      for (const repo of eligible) {
        const showcase = await fetchFile(repo.name, SHOWCASE_FILE, token);
        const { fields, body: showcaseBody } = showcase
          ? parseFrontmatter(showcase)
          : { fields: {}, body: '' };

        const rawBody = showcaseBody || (await fetchReadme(repo.name, token));
        const topics = repo.topics ?? [];
        const isResearch = topics.includes(RESEARCH_TOPIC);
        const image = isResearch
          ? undefined
          : await resolveImage(repo, asString(fields.image), rawBody, token);
        const body = absolutizeBody(rawBody, repo);

        const data = await parseData({
          id: repo.name,
          data: {
            kind: isResearch ? 'research' : 'project',
            title: asString(fields.title) ?? repo.name,
            description: asString(fields.description) ?? repo.description ?? '',
            tags: (asStringArray(fields.tags) ?? topics).filter((t) => !META_TOPICS.has(t)),
            topics,
            category: asString(fields.category),
            image,
            status: repo.archived ? 'archived' : 'active',
            githubUrl: repo.html_url,
            homepageUrl: normalizeUrl(repo.homepage),
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
