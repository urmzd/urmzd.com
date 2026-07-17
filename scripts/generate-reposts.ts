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
 * HiDPI PNGs, embedded in the HTML as data: URIs so a copy-paste carries the
 * pixels into the editor, and each deep-links back to its section in the
 * original post. Code blocks stay as <pre><code> — both editors have native
 * code blocks, so no extra context links are added.
 *
 * Open the HTML in a browser, Cmd+A, Cmd+C, paste into the platform editor.
 * For X, prefer the API route: scripts/publish-x-article.ts creates the
 * draft programmatically.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mdxToHtml } from '../src/lib/mdxToHtml.js';
import {
  loadPost,
  preprocessBody,
  renderImages,
  scanBlocks,
  type Rendered,
} from './lib/repost-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Parse args ---
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npx tsx scripts/generate-reposts.ts <slug>');
  console.error('Example: npx tsx scripts/generate-reposts.ts people-not-ai');
  process.exit(1);
}

const { frontmatter, body, blogUrl } = loadPost(ROOT, slug);
const imageDir = join(ROOT, 'public', 'images', 'reposts', slug);

const cleanBody = preprocessBody(body, blogUrl);
const { rendered, codeFences } = scanBlocks(cleanBody);

await renderImages(rendered, ROOT, imageDir, `public/images/reposts/${slug}`);

// --- Replace unrenderable blocks. Both editors drop pasted image URLs
// (neither fetches them client-side), so rendered images are embedded as
// data: URIs — the pixels travel inside the copied HTML and the editor
// uploads them on paste. Code stays as <pre><code> with a context link.
// mdxToHtml passes blocks that start with <a ...> or <p ...> through
// untouched.

function anchorHref(anchor: string): string {
  return anchor ? `${blogUrl}#${anchor}` : blogUrl;
}

function imageBlock(r: Rendered): string {
  const b64 = readFileSync(join(imageDir, r.file)).toString('base64');
  return `<a href="${anchorHref(r.anchor)}"><img src="data:image/png;base64,${b64}" alt="${r.alt}" style="max-width:100%"></a>`;
}

function buildVariant(): string {
  const byKind = { mermaid: 0, math: 0, table: 0, code: 0 };
  const next = (kind: Rendered['kind']) => {
    const r = rendered.filter((x) => x.kind === kind)[byKind[kind]];
    byKind[kind] += 1;
    return imageBlock(r);
  };
  return cleanBody
    .replace(/^```mermaid\n[\s\S]*?^```$/gm, () => next('mermaid'))
    .replace(/^\$\$\s*\n[\s\S]*?\n\$\$\s*$/gm, () => next('math'))
    .replace(/^(?:\|.*\|\s*\n){2,}/gm, () => `${next('table')}\n\n`);
}

// --- Generate HTML for both platforms ---
const twitterBody = mdxToHtml(buildVariant(), { headingLevel: 2 });
const linkedinBody = mdxToHtml(buildVariant(), { headingLevel: 3 });

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

${articleHtml}

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Plain-text feed posts ---

const TAG_CASING: Record<string, string> = {
  ai: 'AI',
  rag: 'RAG',
  llm: 'LLM',
  llms: 'LLMs',
  hyde: 'HyDE',
  mcp: 'MCP',
};

function hashtags(tags: string[]): string {
  return tags
    .map(
      (t) =>
        `#${t
          .split('-')
          .map((w) => TAG_CASING[w] ?? w[0].toUpperCase() + w.slice(1))
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
