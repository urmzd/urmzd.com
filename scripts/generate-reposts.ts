#!/usr/bin/env npx tsx

/**
 * Generate platform-optimized HTML reposts from a blog MDX file.
 *
 * Usage:
 *   npx tsx scripts/generate-reposts.ts <slug>
 *   npx tsx scripts/generate-reposts.ts people-not-ai
 *
 * Outputs:
 *   reposts/twitter/<slug>.html
 *   reposts/linkedin/<slug>.html
 *
 * Open in a browser, Cmd+A, Cmd+C, paste into the platform editor.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const frontmatter: PostFrontmatter = {
  title: extractField(frontmatterRaw, 'title'),
  description: extractField(frontmatterRaw, 'description'),
  pubDate:
    extractField(frontmatterRaw, 'pubDate') ||
    frontmatterRaw.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim() ||
    '',
  shareText: extractField(frontmatterRaw, 'shareText'),
  tags: [],
};

// --- Strip trailing --- (section divider before References) to avoid double <hr> ---
const cleanBody = body.replace(/\n---\s*$/, '');

// --- Generate HTML for both platforms ---
const twitterBody = mdxToHtml(cleanBody, { headingLevel: 2 });
const linkedinBody = mdxToHtml(cleanBody, { headingLevel: 3 });

const blogUrl = `${SITE}/blog/${slug}`;

function wrapTwitter(articleHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(frontmatter.title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 680px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
    h2 { font-size: 1.4rem; margin-top: 2rem; }
    hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
    a { color: #1a73e8; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
    blockquote { border-left: 3px solid #ccc; margin: 1.5rem 0; padding: 0.5rem 1rem; color: #444; }
  </style>
</head>
<body>

<p><em>For the full experience with interactive visuals and citations, read the original at <a href="${blogUrl}">${blogUrl}</a></em></p>

<hr>

${articleHtml}

</body>
</html>`;
}

function wrapLinkedin(articleHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(frontmatter.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 680px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
    h3 { font-size: 1.2rem; margin-top: 2rem; }
    hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
    a { color: #0a66c2; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
    blockquote { border-left: 3px solid #ccc; margin: 1.5rem 0; padding: 0.5rem 1rem; color: #444; }
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

// --- Write output ---
const outDir = join(ROOT, 'reposts', slug);
mkdirSync(outDir, { recursive: true });

const twitterPath = join(outDir, 'twitter.html');
const linkedinPath = join(outDir, 'linkedin.html');

writeFileSync(twitterPath, wrapTwitter(twitterBody));
writeFileSync(linkedinPath, wrapLinkedin(linkedinBody));

console.log(`✓ reposts/${slug}/twitter.html`);
console.log(`✓ reposts/${slug}/linkedin.html`);
