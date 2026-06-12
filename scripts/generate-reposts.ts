#!/usr/bin/env npx tsx

/**
 * Generate platform-optimized reposts from a blog MDX file.
 *
 * Usage:
 *   npx tsx scripts/generate-reposts.ts <slug>
 *   npx tsx scripts/generate-reposts.ts people-not-ai
 *
 * Outputs:
 *   reposts/<slug>/twitter.html       — paste into the X Articles editor
 *   reposts/<slug>/linkedin.html      — paste into the LinkedIn article editor
 *   reposts/<slug>/x-post.txt         — short post announcing the article
 *   reposts/<slug>/linkedin-post.txt  — feed post (plain text, 3000-char cap)
 *   public/images/reposts/<slug>/     — pre-rendered mermaid/math/table images
 *
 * Neither platform renders mermaid, LaTeX, or markdown tables, so those are
 * rendered headlessly (playwright + the same mermaid/katex the site uses) to
 * HiDPI PNGs hosted under /images/reposts/, and the HTML references them as
 * images that deep-link back to their section in the original post. Code
 * blocks stay as <pre><code> (both editors have native code blocks) with a
 * view-in-context link to the section anchor.
 *
 * Open the HTML in a browser, Cmd+A, Cmd+C, paste into the platform editor.
 * Images referenced by absolute URL resolve once the site deploy is live; if
 * the editor drops them on paste, insert them manually from public/images/.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { mdxToHtml, type PostFrontmatter } from '../src/lib/mdxToHtml.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE = 'https://urmzd.com';

// --- Parse args ---
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npx tsx scripts/generate-reposts.ts <slug>');
  console.error('Example: npx tsx scripts/generate-reposts.ts people-not-ai');
  process.exit(1);
}

const mdxPath = join(ROOT, 'src', 'blog', `${slug}.mdx`);
const mdPath = join(ROOT, 'src', 'blog', `${slug}.md`);
let raw: string;
try {
  raw = readFileSync(mdxPath, 'utf-8');
} catch {
  try {
    raw = readFileSync(mdPath, 'utf-8');
  } catch {
    console.error(`Blog post not found: src/blog/${slug}.mdx or src/blog/${slug}.md`);
    process.exit(1);
  }
}

// --- Parse frontmatter ---
const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!frontmatterMatch) {
  console.error('Could not parse frontmatter');
  process.exit(1);
}

const frontmatterRaw = frontmatterMatch[1];
const body = frontmatterMatch[2];

function extractField(src: string, field: string): string {
  const match = src.match(new RegExp(`^${field}:\\s*"(.+)"`, 'm'));
  return match ? match[1] : '';
}

function extractTags(src: string): string[] {
  const match = src.match(/^tags:\s*\[(.+)\]$/m);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const frontmatter: PostFrontmatter = {
  title: extractField(frontmatterRaw, 'title'),
  description: extractField(frontmatterRaw, 'description'),
  pubDate:
    extractField(frontmatterRaw, 'pubDate') ||
    frontmatterRaw.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim() ||
    '',
  shareText: extractField(frontmatterRaw, 'shareText'),
  tags: extractTags(frontmatterRaw),
};

const blogUrl = `${SITE}/blog/${slug}`;
const imageDir = join(ROOT, 'public', 'images', 'reposts', slug);
const imageUrlBase = `${SITE}/images/reposts/${slug}`;

// --- Preprocess body ---

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

// rehype-slug (github-slugger) approximation, for deep links into the post.
function headingAnchor(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

// --- Scan for blocks the platforms can't render: mermaid, display math,
// GFM tables. Also record the nearest preceding heading for every code
// fence so each block can link back to its section in the original post.

interface Rendered {
  kind: 'mermaid' | 'math' | 'table';
  source: string;
  anchor: string;
  file: string; // basename of the PNG under imageDir
  alt: string;
}

const rendered: Rendered[] = [];
const codeFences: { anchor: string; lang: string; source: string }[] = [];

{
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
}

// --- Render mermaid/math/tables to HiDPI PNGs via headless chromium,
// using the same mermaid + katex builds the site ships.

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

async function renderImages(targets: Rendered[]): Promise<void> {
  if (targets.length === 0) return;
  mkdirSync(imageDir, { recursive: true });

  const stagePath = join(tmpdir(), `repost-render-${slug}.html`);
  const katexCss = pathToFileURL(join(ROOT, 'node_modules/katex/dist/katex.min.css')).href;
  const katexJs = pathToFileURL(join(ROOT, 'node_modules/katex/dist/katex.min.js')).href;
  const mermaidJs = pathToFileURL(join(ROOT, 'node_modules/mermaid/dist/mermaid.min.js')).href;
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
  </style>
</head>
<body><div id="stage"></div></body>
</html>`,
  );

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(stagePath).href);

  for (const target of targets) {
    if (target.kind === 'mermaid') {
      const svg = await page.evaluate(async (source) => {
        // @ts-expect-error mermaid is a page global
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
        // @ts-expect-error mermaid is a page global
        const { svg } = await mermaid.render(`d${Date.now() % 1e6}`, source);
        const stage = document.getElementById('stage') as HTMLElement;
        stage.innerHTML = svg;
        return svg as string;
      }, target.source);
      writeFileSync(join(imageDir, target.file.replace(/\.png$/, '.svg')), svg);
    } else if (target.kind === 'math') {
      await page.evaluate((tex) => {
        const stage = document.getElementById('stage') as HTMLElement;
        // @ts-expect-error katex is a page global
        katex.render(tex, stage, { displayMode: true, throwOnError: false });
      }, target.source);
    } else {
      await page.evaluate((html) => {
        (document.getElementById('stage') as HTMLElement).innerHTML = html;
      }, tableToHtml(target.source));
    }
    await page.locator('#stage').screenshot({ path: join(imageDir, target.file) });
    console.log(`✓ public/images/reposts/${slug}/${target.file}`);
  }

  await browser.close();
}

await renderImages(rendered);

// --- Replace unrenderable blocks, per platform. LinkedIn keeps images
// (insertable/upload-friendly) and <pre> code with a context link; X's
// editor neither fetches pasted image URLs nor maps <pre>, so everything
// becomes a reference link to its section on the original post. mdxToHtml
// passes blocks that start with <a ...> or <p ...> through untouched.

function anchorHref(anchor: string): string {
  return anchor ? `${blogUrl}#${anchor}` : blogUrl;
}

function imageBlock(r: Rendered): string {
  return `<a href="${anchorHref(r.anchor)}"><img src="${imageUrlBase}/${r.file}" alt="${r.alt}" style="max-width:100%"></a>`;
}

function refBlock(label: string, anchor: string): string {
  return `<p><em><a href="${anchorHref(anchor)}">${label} →</a></em></p>`;
}

const REF_LABELS: Record<Rendered['kind'], string> = {
  mermaid: 'View the diagram on the original post',
  math: 'View the equation on the original post',
  table: 'View the table on the original post',
};

function buildVariant(platform: 'twitter' | 'linkedin'): string {
  const byKind = { mermaid: 0, math: 0, table: 0 };
  const next = (kind: Rendered['kind']) => {
    const r = rendered.filter((x) => x.kind === kind)[byKind[kind]];
    byKind[kind] += 1;
    return platform === 'twitter' ? refBlock(REF_LABELS[kind], r.anchor) : imageBlock(r);
  };
  let variant = cleanBody
    .replace(/^```mermaid\n[\s\S]*?^```$/gm, () => next('mermaid'))
    .replace(/^\$\$\s*\n[\s\S]*?\n\$\$\s*$/gm, () => next('math'))
    .replace(/^(?:\|.*\|\s*\n){2,}/gm, () => `${next('table')}\n\n`);

  if (platform === 'twitter') {
    let i = 0;
    variant = variant.replace(/^```\w*\n[\s\S]*?^```$/gm, () => {
      const fence = codeFences[i];
      i += 1;
      const langName = fence.lang ? `${fence.lang[0].toUpperCase()}${fence.lang.slice(1)} ` : '';
      return refBlock(`View the ${langName}code on the original post`, fence.anchor);
    });
  }
  return variant;
}

// --- Generate HTML for both platforms ---
const twitterBody = mdxToHtml(buildVariant('twitter'), { headingLevel: 2 });
const linkedinBody = mdxToHtml(buildVariant('linkedin'), { headingLevel: 3 });

// Code blocks survive paste as plain preformatted text at best; link each
// one back to its section so readers can see the highlighted original.
function addCodeContextLinks(html: string): string {
  let i = 0;
  return html.replace(/<\/pre>/g, () => {
    const fence = codeFences[i];
    i += 1;
    return `</pre>\n<p><em><a href="${anchorHref(fence?.anchor ?? '')}">View this code with highlighting →</a></em></p>`;
  });
}

function wrap(articleHtml: string, platform: 'twitter' | 'linkedin'): string {
  const font =
    platform === 'twitter'
      ? 'Georgia, serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const linkColor = platform === 'twitter' ? '#1a73e8' : '#0a66c2';
  const headingCss =
    platform === 'twitter'
      ? 'h2 { font-size: 1.4rem; margin-top: 2rem; }'
      : 'h3 { font-size: 1.2rem; margin-top: 2rem; }';
  const platformName = platform === 'twitter' ? 'X Article' : 'LinkedIn Article';
  const emoji = platform === 'twitter' ? '𝕏' : 'in';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>[${platformName}] ${escapeHtml(frontmatter.title)}</title>
  <meta name="repost-platform" content="${platform}">
  <meta name="repost-slug" content="${slug}">
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='${platform === 'twitter' ? '#000' : '#0a66c2'}'/><text x='16' y='22' font-size='16' font-family='sans-serif' font-weight='bold' fill='#fff' text-anchor='middle'>${emoji}</text></svg>`,
  )}">
  <style>
    body { font-family: ${font}; max-width: 680px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
    ${headingCss}
    hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
    a { color: ${linkColor}; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
    blockquote { border-left: 3px solid #ccc; margin: 1.5rem 0; padding: 0.5rem 1rem; color: #444; }
    pre { background: #f6f6f6; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
  </style>
</head>
<body>

<p><em>For the full experience with interactive visuals and citations, read the original at <a href="${blogUrl}">${blogUrl}</a></em></p>

<hr>

${platform === 'linkedin' ? addCodeContextLinks(articleHtml) : articleHtml}

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Plain-text feed posts ---

function hashtags(tags: string[]): string {
  return tags
    .map(
      (t) =>
        `#${t
          .split('-')
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join('')}`,
    )
    .join(' ');
}

const xPost = `${frontmatter.shareText}\n\n${blogUrl}`;
// X counts any URL as 23 characters.
const xPostLength = xPost.replace(blogUrl, 'x'.repeat(23)).length;

const linkedinPost = `${frontmatter.shareText}

${frontmatter.description}

Read the full post: ${blogUrl}

${hashtags(frontmatter.tags)}`;

// --- Write output ---
const outDir = join(ROOT, 'reposts', slug);
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'twitter.html'), wrap(twitterBody, 'twitter'));
writeFileSync(join(outDir, 'linkedin.html'), wrap(linkedinBody, 'linkedin'));
writeFileSync(join(outDir, 'x-post.txt'), xPost);
writeFileSync(join(outDir, 'linkedin-post.txt'), linkedinPost);

// Each code fence as a standalone file, ready to copy into the platform's
// native code-block dialog (X: Insert → code; LinkedIn: Ctrl/Cmd+Alt+6).
codeFences.forEach((fence, n) => {
  const name = `code-${n + 1}${fence.lang ? `.${fence.lang}` : '.txt'}`;
  writeFileSync(join(outDir, name), `${fence.source}\n`);
  console.log(`✓ reposts/${slug}/${name} (for the native code-block dialog)`);
});

// Cover image: reuse the build's satori OG card as the article thumbnail.
const ogPath = join(ROOT, 'dist', 'og', `${slug}.png`);
try {
  copyFileSync(ogPath, join(outDir, 'cover.png'));
  console.log(`✓ reposts/${slug}/cover.png (article thumbnail, from OG card)`);
} catch {
  console.log(`! No cover image — run \`npm run build\` first to generate dist/og/${slug}.png`);
}

console.log(`✓ reposts/${slug}/twitter.html (X Articles editor)`);
console.log(`✓ reposts/${slug}/linkedin.html (LinkedIn article editor)`);
console.log(
  `✓ reposts/${slug}/x-post.txt (${xPostLength}/280${xPostLength > 280 ? ' — OVER LIMIT' : ''})`,
);
console.log(
  `✓ reposts/${slug}/linkedin-post.txt (${linkedinPost.length}/3000${linkedinPost.length > 3000 ? ' — OVER LIMIT' : ''})`,
);
