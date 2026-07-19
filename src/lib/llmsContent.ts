import { getCollection } from 'astro:content';
import { mdxBodyToMarkdown } from './mdxToMarkdown';

export const SITE = 'https://urmzd.com';

export interface LinkedEntry {
  title: string;
  description: string;
  /** Canonical page URL (absolute). */
  url: string;
  /** Plain-Markdown URL (absolute). */
  mdUrl: string;
}

function iso(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Published blog posts, newest first. */
export async function getBlog() {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Published short-form "writing" pieces (stories collection), newest first. */
export async function getWriting() {
  const stories = await getCollection('stories', ({ data }) => data.draft !== true);
  return stories.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Projects (kind=project), most recently pushed first. */
export async function getProjects() {
  const entries = await getCollection('projects', ({ data }) => data.kind === 'project');
  return entries.sort((a, b) => b.data.pushedAt.valueOf() - a.data.pushedAt.valueOf());
}

/** Research entries (kind=research), newest first. */
export async function getResearch() {
  const entries = await getCollection('projects', ({ data }) => data.kind === 'research');
  return entries.sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
}

/** Agent skills, alphabetical by title. */
export async function getSkills() {
  const entries = await getCollection('skills');
  return entries.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export function blogLink(id: string): LinkedEntry['url'] {
  return `${SITE}/blog/${id}`;
}

/**
 * Serialize a project/research collection entry to a portable Markdown
 * document: frontmatter, a heading, source links, then the unwrapped body (or
 * the description when the repo has no SHOWCASE.md body).
 */
export function projectToMarkdown(entry: {
  body?: string;
  data: {
    kind: 'project' | 'research';
    title: string;
    description: string;
    tags: string[];
    status: string;
    githubUrl: string;
    homepageUrl?: string;
    language?: string;
    stars: number;
    pushedAt: Date;
    year?: number;
    venue?: string;
    paperUrl?: string;
  };
}): string {
  const d = entry.data;
  const yaml = [
    '---',
    `title: ${JSON.stringify(d.title)}`,
    `description: ${JSON.stringify(d.description)}`,
    `kind: ${d.kind}`,
    `status: ${d.status}`,
    d.language ? `language: ${JSON.stringify(d.language)}` : null,
    `stars: ${d.stars}`,
    d.year ? `year: ${d.year}` : null,
    d.venue ? `venue: ${JSON.stringify(d.venue)}` : null,
    `githubUrl: ${d.githubUrl}`,
    d.homepageUrl ? `homepageUrl: ${d.homepageUrl}` : null,
    d.paperUrl ? `paperUrl: ${d.paperUrl}` : null,
    `pushedAt: ${iso(d.pushedAt)}`,
    d.tags.length > 0 ? `tags: [${d.tags.map((t) => JSON.stringify(t)).join(', ')}]` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  const links = [
    `- GitHub: ${d.githubUrl}`,
    d.homepageUrl ? `- Homepage: ${d.homepageUrl}` : null,
    d.paperUrl ? `- Paper: ${d.paperUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const rawBody = (entry.body ?? '').trim();
  const body = rawBody ? mdxBodyToMarkdown(rawBody).trim() : d.description;

  return `${yaml}\n\n# ${d.title}\n\n${d.description}\n\n${links}\n\n${body}\n`;
}
