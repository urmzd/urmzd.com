import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Loader, LoaderContext } from 'astro/loaders';

type Kind = 'skill' | 'agent';

interface Source {
  repo: string;
  localPath?: string;
  cachePath: string;
  sourceRepo: string;
  branch: string;
  entries: Array<
    { kind: 'skill'; dir: string; defaultCategory: string } | { kind: 'agent'; dir: string }
  >;
}

const HOME = process.env.HOME ?? '';
const CACHE_ROOT = resolve(process.cwd(), '.cache/skills-src');

const SOURCES: Source[] = [
  {
    repo: 'https://github.com/urmzd/dotfiles.git',
    localPath: HOME ? join(HOME, 'github/dotfiles') : undefined,
    cachePath: join(CACHE_ROOT, 'dotfiles'),
    sourceRepo: 'urmzd/dotfiles',
    branch: 'main',
    entries: [
      { kind: 'skill', dir: 'dot_agents/skills', defaultCategory: 'general' },
      { kind: 'agent', dir: 'dot_agents/agents' },
    ],
  },
];

function isGitRepo(path: string): boolean {
  return existsSync(join(path, '.git'));
}

function syncRemote(source: Source, logger: LoaderContext['logger']): string {
  if (source.localPath && isGitRepo(source.localPath)) {
    logger.info(`Using local checkout at ${source.localPath}`);
    return source.localPath;
  }

  if (!existsSync(source.cachePath)) {
    logger.info(`Cloning ${source.repo} → ${source.cachePath}`);
    const res = spawnSync(
      'git',
      ['clone', '--depth', '1', '--branch', source.branch, source.repo, source.cachePath],
      { encoding: 'utf-8' },
    );
    if (res.status !== 0) {
      throw new Error(`git clone failed for ${source.repo}: ${res.stderr}`);
    }
  } else {
    logger.info(`Refreshing ${source.repo}`);
    const fetch = spawnSync(
      'git',
      ['-C', source.cachePath, 'fetch', '--depth', '1', 'origin', source.branch],
      { encoding: 'utf-8' },
    );
    if (fetch.status !== 0) {
      throw new Error(`git fetch failed for ${source.repo}: ${fetch.stderr}`);
    }
    spawnSync('git', ['-C', source.cachePath, 'reset', '--hard', 'FETCH_HEAD'], {
      encoding: 'utf-8',
    });
  }

  return source.cachePath;
}

function parseFrontmatter(content: string): { fields: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { fields: {}, body: content };

  const fields: Record<string, string> = {};
  let key = '';
  let value = '';
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      if (key) fields[key] = value.trim();
      key = kv[1];
      const raw = kv[2];
      value = raw === '|' || raw === '>' ? '' : raw;
    } else if (key && /^\s+/.test(line)) {
      value += (value ? ' ' : '') + line.trim();
    }
  }
  if (key) fields[key] = value.trim();

  return { fields, body: content.slice(match[0].length) };
}

function firstParagraph(body: string): string {
  const trimmed = body.replace(/^#.*\n+/, '').trim();
  const para = trimmed.split(/\n\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}

function unquote(value: string): string {
  const s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

interface ParsedEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  type: Kind;
  body: string;
  sourceRepo: string;
  sourcePath: string;
  rawPath: string;
}

function readEntries(source: Source, rootPath: string): ParsedEntry[] {
  const out: ParsedEntry[] = [];

  for (const spec of source.entries) {
    const abs = join(rootPath, spec.dir);
    if (!existsSync(abs)) continue;

    if (spec.kind === 'skill') {
      for (const dirent of readdirSync(abs)) {
        const skillDir = join(abs, dirent);
        const skillFile = join(skillDir, 'SKILL.md');
        if (!statSync(skillDir).isDirectory() || !existsSync(skillFile)) continue;

        const raw = readFileSync(skillFile, 'utf-8');
        const { fields, body } = parseFrontmatter(raw);
        const title = unquote(fields.name ?? dirent);
        const description = unquote(fields.description ?? firstParagraph(body));

        out.push({
          id: dirent,
          title,
          description,
          category: unquote(fields.category ?? spec.defaultCategory),
          type: 'skill',
          body,
          sourceRepo: source.sourceRepo,
          sourcePath: `${spec.dir}/${dirent}`,
          rawPath: `${spec.dir}/${dirent}/SKILL.md`,
        });
      }
    } else {
      for (const file of readdirSync(abs)) {
        if (!file.endsWith('.md')) continue;
        const raw = readFileSync(join(abs, file), 'utf-8');
        const { fields, body } = parseFrontmatter(raw);
        const slug = file.replace(/\.md$/, '');
        const title = unquote(fields.name ?? slug);
        const description = unquote(fields.description ?? firstParagraph(body));

        out.push({
          id: slug,
          title,
          description,
          category: 'agent',
          type: 'agent',
          body,
          sourceRepo: source.sourceRepo,
          sourcePath: `${spec.dir}/${file}`,
          rawPath: `${spec.dir}/${file}`,
        });
      }
    }
  }

  return out;
}

export function skillsLoader(): Loader {
  return {
    name: 'skills-remote',
    load: async (ctx: LoaderContext) => {
      const { store, parseData, generateDigest, renderMarkdown, logger } = ctx;
      store.clear();

      const seen = new Set<string>();
      for (const source of SOURCES) {
        const rootPath = syncRemote(source, logger);
        for (const entry of readEntries(source, rootPath)) {
          if (seen.has(entry.id)) {
            logger.warn(`Duplicate skill id "${entry.id}" from ${source.sourceRepo} — skipping`);
            continue;
          }
          seen.add(entry.id);

          const data = await parseData({
            id: entry.id,
            data: {
              title: entry.title,
              description: entry.description,
              category: entry.category,
              type: entry.type,
              sourceRepo: entry.sourceRepo,
              sourcePath: entry.sourcePath,
              rawPath: entry.rawPath,
            },
          });

          store.set({
            id: entry.id,
            data,
            body: entry.body,
            digest: generateDigest(entry.body + JSON.stringify(data)),
            rendered: await renderMarkdown(entry.body),
          });
        }
      }

      logger.info(`Loaded ${seen.size} skills/agents`);
    },
  };
}
