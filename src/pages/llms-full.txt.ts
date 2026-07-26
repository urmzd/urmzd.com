import type { APIContext } from 'astro';
import {
  getBlog,
  getProjects,
  getResearch,
  getWriting,
  projectToMarkdown,
  SITE,
} from '@/lib/llmsContent';
import { mdxToMarkdown } from '@/lib/mdxToMarkdown';

/**
 * The full text of the site in one file: every published blog post and writing
 * piece rendered as clean Markdown, plus every project and research entry.
 * Convention companion to /llms.txt for single-fetch ingestion by LLMs.
 */
export async function GET(_context: APIContext) {
  const [blog, writing, projects, research] = await Promise.all([
    getBlog(),
    getWriting(),
    getProjects(),
    getResearch(),
  ]);

  const parts: string[] = [];

  parts.push('# urmzd.com — Full Content');
  parts.push('');
  parts.push(
    '> Complete text of urmzd.com. Sections: Blog, Writing, Projects, Research. Source index at https://urmzd.com/llms.txt.',
  );

  const section = (title: string) => {
    parts.push('');
    parts.push('---');
    parts.push('');
    parts.push(`# ${title}`);
  };

  const doc = (url: string, markdown: string) => {
    parts.push('');
    parts.push(`<!-- source: ${url} -->`);
    parts.push('');
    parts.push(markdown.trim());
  };

  if (blog.length > 0) {
    section('Blog');
    for (const post of blog) {
      doc(
        `${SITE}/blog/${post.id}`,
        mdxToMarkdown(post.body ?? '', {
          title: post.data.title,
          description: post.data.description,
          pubDate: post.data.pubDate.toISOString().split('T')[0],
          updatedDate: post.data.updatedDate?.toISOString().split('T')[0],
          heroImage: post.data.heroImage,
          tags: post.data.tags,
        }),
      );
    }
  }

  if (writing.length > 0) {
    section('Writing');
    for (const story of writing) {
      doc(
        `${SITE}/writing/${story.id}`,
        mdxToMarkdown(story.body ?? '', {
          title: story.data.title,
          description: story.data.description,
          pubDate: story.data.pubDate.toISOString().split('T')[0],
          updatedDate: story.data.updatedDate?.toISOString().split('T')[0],
          tags: story.data.tags,
        }),
      );
    }
  }

  if (projects.length > 0) {
    section('Projects');
    for (const p of projects) {
      doc(`${SITE}/projects/${p.id}`, projectToMarkdown(p));
    }
  }

  if (research.length > 0) {
    section('Research');
    for (const r of research) {
      doc(`${SITE}/research/${r.id}`, projectToMarkdown(r));
    }
  }

  return new Response(`${parts.join('\n').trim()}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
