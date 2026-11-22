#!/usr/bin/env node

/**
 * Renders branded 1600x900 hero images for projects, in light and dark.
 * Each hero puts the project icon and name over a current screenshot, with the
 * urmzd mark, Instrument Sans and IBM Plex Mono from docs-site/public/brand.
 * The project card shows the description under the image, so the image leaves it out.
 *
 * Projects live in scripts/project-hero/projects.json. A project's screenshot is
 * `image` (a URL or path, or one per theme as {light, dark}) or `url`, a page this
 * script captures at 1440x1000 in each color scheme.
 *
 * Usage:
 *   node scripts/generate-project-heroes.mjs [--out DIR] [--image NAME=PATH] [NAME...]
 *
 * Writes DIR/NAME/showcase/hero-light.png, DIR/NAME/showcase/hero-dark.png and
 * DIR/NAME/SHOWCASE.md (default DIR: project-heroes). Copy them into the repo root:
 * SHOWCASE.md points the urmzd.com card at both images and sets its description.
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = JSON.parse(readFileSync(join(ROOT, 'scripts/project-hero/projects.json'), 'utf-8'));
const THEMES = ['light', 'dark'];
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

const args = process.argv.slice(2);
let out = 'project-heroes';
const overrides = {};
const only = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--image') {
    const [name, path] = args[++i].split('=');
    overrides[name] = resolve(path);
  } else only.push(args[i]);
}
for (const name of only) if (!PROJECTS[name]) throw new Error(`Unknown project: ${name}`);

// Serve the repository (template and brand assets) and local screenshots from one origin.
const local = new Map();
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = local.get(path) ?? join(ROOT, path);
  if (!file.startsWith(ROOT) && !local.has(path)) return res.writeHead(403).end();
  if (!existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;

function served(path) {
  const key = `/__local/${local.size}${extname(path)}`;
  local.set(key, path);
  return origin + key;
}

const browser = await chromium.launch();
try {
  for (const [name, project] of Object.entries(PROJECTS)) {
    if (only.length && !only.includes(name)) continue;
    mkdirSync(join(out, name, 'showcase'), { recursive: true });
    writeFileSync(
      join(out, name, 'SHOWCASE.md'),
      `---\ndescription: ${JSON.stringify(project.description)}\nimage: showcase/hero-light.png\nimage_dark: showcase/hero-dark.png\n---\n`,
    );
    for (const theme of THEMES) {
      let shot;
      if (overrides[name]) shot = served(overrides[name]);
      else if (project.url) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
        await page.goto(project.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        const file = join(tmpdir(), `hero-${name}-${theme}-${process.pid}.png`);
        await page.screenshot({ path: file });
        await page.close();
        shot = served(file);
      } else {
        const src = typeof project.image === 'string' ? project.image : project.image[theme];
        shot = /^https?:/.test(src) ? src : served(resolve(src));
      }

      const query = new URLSearchParams({ name, theme, shot });
      for (const key of ['icon', 'monogram', 'fit']) if (project[key]) query.set(key, project[key]);
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      await page.goto(`${origin}/scripts/project-hero/hero.html?${query}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() =>
        document.querySelector('#mark svg') && [...document.images].every((img) => img.complete && img.naturalWidth > 0),
      );
      await page.evaluate(() => document.fonts.ready);
      const fonts = await page.evaluate(() =>
        [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
      );
      if (!fonts.includes('Instrument Sans')) throw new Error(`${name} ${theme}: Instrument Sans did not load`);
      const file = join(out, name, 'showcase', `hero-${theme}.png`);
      await page.screenshot({ path: file });
      await page.close();
      console.log(file);
    }
  }
} finally {
  await browser.close();
  server.close();
}
