/**
 * Shared core for repost generation: blog post loading, markdown
 * preprocessing, block scanning, and headless image rendering.
 *
 * Consumed by:
 *   scripts/generate-reposts.ts   — HTML drafts for manual paste
 *   scripts/publish-x-article.ts  — X Articles API draft creation
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import type { PostFrontmatter } from '../../src/lib/mdxToHtml.js';

export const SITE = 'https://urmzd.com';

export interface LoadedPost {
  frontmatter: PostFrontmatter;
  body: string;
  blogUrl: string;
}

export function loadPost(root: string, slug: string): LoadedPost {
  const mdxPath = join(root, 'src', 'blog', `${slug}.mdx`);
  const mdPath = join(root, 'src', 'blog', `${slug}.md`);
  let raw: string;
  try {
    raw = readFileSync(mdxPath, 'utf-8');
  } catch {
    try {
      raw = readFileSync(mdPath, 'utf-8');
    } catch {
      throw new Error(`Blog post not found: src/blog/${slug}.mdx or src/blog/${slug}.md`);
    }
  }

  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Could not parse frontmatter');
  }

  const frontmatterRaw = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  const extractField = (field: string): string => {
    const match = frontmatterRaw.match(new RegExp(`^${field}:\\s*"(.+)"`, 'm'));
    return match ? match[1] : '';
  };

  const tagsMatch = frontmatterRaw.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch ? [...tagsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

  return {
    frontmatter: {
      title: extractField('title'),
      description: extractField('description'),
      pubDate:
        extractField('pubDate') || frontmatterRaw.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim() || '',
      shareText: extractField('shareText'),
      tags,
    },
    body,
    blogUrl: `${SITE}/blog/${slug}`,
  };
}

/**
 * Normalize the post body for repost rendering: replace the Snippet of the
 * Week with a teaser link, unwrap <details>, flatten #### headings, and
 * convert GitHub-style callouts to <blockquote> blocks.
 */
export function preprocessBody(body: string, blogUrl: string): string {
  // Strip trailing --- (section divider before References) to avoid double <hr>
  let cleanBody = body.replace(/\n---\s*$/, '');

  // The Snippet of the Week is a collapsible bonus on the blog; inlining it
  // here would dump equations and code after the post's closing line, so the
  // reposts end with a teaser that links back to it instead.
  cleanBody = cleanBody.replace(
    /^## Snippet of the Week\s*\n[\s\S]*?(?=^## |(?![\s\S]))/m,
    (section) => {
      const summary = section.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim();
      const teaser = summary ? `**${summary}**` : 'a bonus snippet';
      return `## Snippet of the Week

This post ends with a bonus: ${teaser}. [Read it on the original post →](${blogUrl}#snippet-of-the-week)
`;
    },
  );

  // Unwrap <details>/<summary>: platform editors strip the tags, so flatten
  // the summary into bold text and keep the content inline.
  cleanBody = cleanBody
    .replace(/<summary>([\s\S]*?)<\/summary>/g, '**$1**')
    .replace(/<\/?details>\s*/g, '');

  // #### headings fall through mdxToHtml untouched; flatten to bold.
  cleanBody = cleanBody.replace(/^####\s+(.+)$/gm, '**$1**');

  // GitHub-style callouts (> [!note] Title \n > body) aren't handled by
  // mdxToHtml; flatten to a <blockquote> block, which passes through.
  cleanBody = cleanBody.replace(
    /^> \[!\w+\] (.+)\n((?:^> .*\n?)+)/gm,
    (_match, title: string, bodyLines: string) => {
      const bodyText = bodyLines
        .split('\n')
        .map((l) => l.replace(/^> ?/, ''))
        .join(' ')
        .trim();
      return `<blockquote><p><strong>${title.trim()}</strong><br>${bodyText}</p></blockquote>\n`;
    },
  );

  return cleanBody;
}

// rehype-slug (github-slugger) approximation, for deep links into the post.
export function headingAnchor(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

export interface Rendered {
  kind: 'mermaid' | 'math' | 'table' | 'code';
  source: string;
  anchor: string;
  file: string; // basename of the PNG under the image dir
  alt: string;
  lang?: string; // code blocks only
}

export interface CodeFence {
  anchor: string;
  lang: string;
  source: string;
}

export interface ScannedBlocks {
  rendered: Rendered[];
  codeFences: CodeFence[];
}

/**
 * Scan for blocks the platforms can't render: mermaid, display math, GFM
 * tables. Records the nearest preceding heading for every block so each can
 * link back to its section in the original post.
 */
export function scanBlocks(cleanBody: string): ScannedBlocks {
  const rendered: Rendered[] = [];
  const codeFences: CodeFence[] = [];

  const scanner =
    /^##\s+(.+)$|^```(\w*)\n([\s\S]*?)^```$|^\$\$\s*\n([\s\S]*?)\n\$\$\s*$|^((?:\|.*\|\s*\n){2,})/gm;
  let anchor = '';
  let mermaidN = 0;
  let mathN = 0;
  let tableN = 0;
  for (const m of cleanBody.matchAll(scanner)) {
    if (m[1] !== undefined) {
      anchor = headingAnchor(m[1]);
    } else if (m[2] !== undefined) {
      if (m[2] === 'mermaid') {
        mermaidN += 1;
        rendered.push({
          kind: 'mermaid',
          source: m[3].trim(),
          anchor,
          file: `mermaid-${mermaidN}.png`,
          alt: `Diagram — view the interactive version on ${SITE.replace('https://', '')}`,
        });
      } else {
        codeFences.push({ anchor, lang: m[2], source: m[3].trimEnd() });
      }
    } else if (m[4] !== undefined) {
      mathN += 1;
      rendered.push({
        kind: 'math',
        source: m[4].trim(),
        anchor,
        file: `math-${mathN}.png`,
        alt: 'Equation — view on the original post',
      });
    } else if (m[5] !== undefined) {
      tableN += 1;
      rendered.push({
        kind: 'table',
        source: m[5].trim(),
        anchor,
        file: `table-${tableN}.png`,
        alt: 'Table — view on the original post',
      });
    }
  }

  return { rendered, codeFences };
}

function inlineMd(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
}

function tableToHtml(md: string): string {
  const rows = md
    .trim()
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map((c) => inlineMd(c.trim())),
    );
  const header = rows[0];
  const bodyRows = rows.filter((r, i) => i > 0 && !r.every((c) => /^:?-+:?$/.test(c)));
  const cell = (tag: string, cells: string[]) =>
    `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
  return `<table><thead>${cell('th', header)}</thead><tbody>${bodyRows
    .map((r) => cell('td', r))
    .join('')}</tbody></table>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render mermaid/math/table/code blocks to HiDPI PNGs via headless
 * chromium, using the same mermaid + katex builds the site ships. Mermaid
 * sources also get an SVG alongside the PNG.
 */
export async function renderImages(
  targets: Rendered[],
  root: string,
  imageDir: string,
  logPrefix: string,
): Promise<void> {
  if (targets.length === 0) return;
  mkdirSync(imageDir, { recursive: true });

  const stagePath = join(tmpdir(), `repost-render-${Date.now()}.html`);
  const katexCss = pathToFileURL(join(root, 'node_modules/katex/dist/katex.min.css')).href;
  const katexJs = pathToFileURL(join(root, 'node_modules/katex/dist/katex.min.js')).href;
  const mermaidJs = pathToFileURL(join(root, 'node_modules/mermaid/dist/mermaid.min.js')).href;
  writeFileSync(
    stagePath,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="${katexCss}">
  <script src="${mermaidJs}"></script>
  <script src="${katexJs}"></script>
  <style>
    body { background: #fff; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #stage { display: inline-block; padding: 24px; }
    table { border-collapse: collapse; font-size: 15px; }
    th, td { border: 1px solid #d0d0d0; padding: 8px 14px; text-align: left; }
    th { background: #f5f5f5; }
    pre.code-stage { background: #16181d; color: #e6e6e6; padding: 20px 24px; border-radius: 8px; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 13px; line-height: 1.6; margin: 0; max-width: 860px; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body><div id="stage"></div></body>
</html>`,
  );

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 2600, height: 1600 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(stagePath).href);

  // X crops article images taller than ~4:5, so repost diagrams render in
  // landscape: flowcharts flip TD/TB → LR, state diagrams get direction LR.
  // The blog's own rendering keeps the original orientation.
  const toLandscape = (src: string): string => {
    if (/^(flowchart|graph)\s+(TD|TB)\b/m.test(src)) {
      return src.replace(/^(flowchart|graph)\s+(?:TD|TB)\b/m, '$1 LR');
    }
    if (/^stateDiagram/m.test(src) && !/^\s*direction\s/m.test(src)) {
      return src.replace(/^(stateDiagram(?:-v2)?)\s*$/m, '$1\n    direction LR');
    }
    return src;
  };

  for (const target of targets) {
    if (target.kind === 'mermaid') {
      const svg = await page.evaluate(async (source) => {
        // @ts-expect-error mermaid is a page global
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          // Natural-size renders: without this, mermaid shrinks the SVG to
          // the container and the exported PNG text becomes unreadable.
          flowchart: { useMaxWidth: false },
          state: { useMaxWidth: false },
          sequence: { useMaxWidth: false },
        });
        // @ts-expect-error mermaid is a page global
        const { svg } = await mermaid.render(`d${Date.now() % 1e6}`, source);
        const stage = document.getElementById('stage') as HTMLElement;
        stage.innerHTML = svg;
        return svg as string;
      }, toLandscape(target.source));
      writeFileSync(join(imageDir, target.file.replace(/\.png$/, '.svg')), svg);
    } else if (target.kind === 'math') {
      await page.evaluate((tex) => {
        const stage = document.getElementById('stage') as HTMLElement;
        // @ts-expect-error katex is a page global
        katex.render(tex, stage, { displayMode: true, throwOnError: false });
      }, target.source);
    } else if (target.kind === 'code') {
      await page.evaluate((html) => {
        (document.getElementById('stage') as HTMLElement).innerHTML = html;
      }, `<pre class="code-stage">${escapeHtml(target.source)}</pre>`);
    } else {
      await page.evaluate((html) => {
        (document.getElementById('stage') as HTMLElement).innerHTML = html;
      }, tableToHtml(target.source));
    }
    await page.locator('#stage').screenshot({ path: join(imageDir, target.file) });
    console.log(`✓ ${logPrefix}/${target.file}`);
  }

  await browser.close();
}
