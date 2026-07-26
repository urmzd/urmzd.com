import type { APIContext } from 'astro';
import { getBlog, getProjects, getResearch, getSkills, getWriting, SITE } from '@/lib/llmsContent';

/**
 * Spec: https://llmstxt.org. Regenerated on every build from the same content
 * collections that render the site, so it never drifts from what's published.
 */
export async function GET(_context: APIContext) {
  const [blog, writing, projects, research, skills] = await Promise.all([
    getBlog(),
    getWriting(),
    getProjects(),
    getResearch(),
    getSkills(),
  ]);

  const lines: string[] = [];

  lines.push('# urmzd.com');
  lines.push('');
  lines.push(
    '> Personal website of Urmzd Mukhammadnaim — software engineer and researcher building streaming AI agent systems, developer tooling, and memory infrastructure in Rust and Go. This site hosts open-source projects, published research, and long-form writing on engineering, critical thinking, and philosophy.',
  );
  lines.push('');
  lines.push(
    'Every article, project, and research page is available as clean Markdown: append `.md` to its URL (for example `https://urmzd.com/blog/welcome.md`). The full text of the site is available in one file at https://urmzd.com/llms-full.txt.',
  );
  lines.push('');

  lines.push('## About');
  lines.push('');
  lines.push(
    'Urmzd Mukhammadnaim is a software engineer with a research background in evolutionary computation and machine learning from Dalhousie University.',
  );
  lines.push('');
  lines.push('- [GitHub](https://github.com/urmzd): Open-source projects and source code');
  lines.push('- [LinkedIn](https://linkedin.com/in/urmzd): Professional profile');
  lines.push('- [X](https://x.com/urmzd_): Short-form updates');
  lines.push('- [Email](mailto:hello@urmzd.com): hello@urmzd.com');
  lines.push(
    '- [arXiv](https://arxiv.org/search/cs?searchtype=author&query=Mukhammadnaim,+U): Published papers',
  );
  lines.push('');

  if (blog.length > 0) {
    lines.push('## Blog');
    lines.push('');
    for (const post of blog) {
      lines.push(`- [${post.data.title}](${SITE}/blog/${post.id}): ${post.data.description}`);
    }
    lines.push('');
  }

  if (writing.length > 0) {
    lines.push('## Writing');
    lines.push('');
    for (const story of writing) {
      lines.push(`- [${story.data.title}](${SITE}/writing/${story.id}): ${story.data.description}`);
    }
    lines.push('');
  }

  if (projects.length > 0) {
    lines.push('## Projects');
    lines.push('');
    for (const p of projects) {
      lines.push(`- [${p.data.title}](${SITE}/projects/${p.id}): ${p.data.description}`);
    }
    lines.push('');
  }

  if (research.length > 0) {
    lines.push('## Research');
    lines.push('');
    for (const r of research) {
      const paper = r.data.paperUrl ? ` [Paper](${r.data.paperUrl})` : '';
      lines.push(`- [${r.data.title}](${SITE}/research/${r.id}): ${r.data.description}${paper}`);
    }
    lines.push('');
  }

  if (skills.length > 0) {
    lines.push('## GenAI Skills');
    lines.push('');
    for (const s of skills) {
      lines.push(`- [${s.data.title}](${SITE}/genai/${s.id}): ${s.data.description}`);
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Full text](${SITE}/llms-full.txt): Entire site content in one Markdown file`);
  lines.push(`- [RSS feed](${SITE}/rss.xml): Blog updates`);
  lines.push(`- [Sitemap](${SITE}/sitemap-index.xml): All indexed URLs`);
  lines.push('');

  return new Response(`${lines.join('\n').trim()}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
