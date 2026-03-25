#!/usr/bin/env node

/**
 * Captures screenshots of each embed page for use as preview images
 * in the markdown export.
 *
 * Prerequisites:
 *   npm run build && npm run preview   (in another terminal)
 *   npx playwright install chromium
 *
 * Usage:
 *   node scripts/generate-visual-previews.mjs [base-url]
 *   Default base URL: http://localhost:4321
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'images', 'visuals');
const BASE_URL = process.argv[2] || 'http://localhost:4321';

// Import the embed slugs from the source mapping.
// We inline them here to avoid needing tsx/ts-node for a simple script.
const EMBED_SLUGS = [
  'critical-thinking-loop',
  'first-principles',
  'confirmation-bias',
  'extrapolation',
  'consilience',
  'search-landscape',
  'gp-evolution',
  'chat-demo',
  'welcome-timeline',
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  for (const slug of EMBED_SLUGS) {
    const url = `${BASE_URL}/embed/${slug}`;
    console.log(`Capturing ${slug}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.fonts.ready);
    // Allow animations to settle into a presentable state
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(OUT_DIR, `${slug}.png`) });
    console.log(`  → public/images/visuals/${slug}.png`);
  }

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
