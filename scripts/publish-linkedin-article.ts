#!/usr/bin/env npx tsx

/**
 * Create a LinkedIn ARTICLE draft by driving the editor with Playwright.
 *
 * LinkedIn has no public API for long-form articles (the Articles API is
 * retrieve/delete only), so this automates the editor UI itself:
 * paste-ready HTML (data-URI images included) is injected via a synthetic
 * clipboard paste, the cover is attached from the repost bundle, and the
 * editor's autosave leaves a DRAFT for human review. This never clicks
 * Next/Publish.
 *
 * Usage:
 *   npx tsx scripts/publish-linkedin-article.ts --login    # one-time: sign in, save session
 *   npx tsx scripts/publish-linkedin-article.ts <slug>     # create the draft
 *
 * The signed-in session is stored at ~/.config/broadcast/linkedin-state.json
 * (cookies only, never committed). Rerun --login when it expires.
 *
 * Caveat: LinkedIn's User Agreement frowns on automated access; this is a
 * low-frequency, own-account, human-in-the-loop tool. Keep it that way.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATE_DIR = join(homedir(), '.config', 'broadcast');
const STATE_PATH = join(STATE_DIR, 'linkedin-state.json');
const EDITOR_URL = 'https://www.linkedin.com/article/new/';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const login = args.includes('--login');

if (login) {
  mkdirSync(STATE_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.linkedin.com/login');
  console.log('Sign in to LinkedIn in the opened browser window.');
  console.log('Waiting for the feed to load (up to 5 minutes)...');
  await page.waitForURL('**/feed/**', { timeout: 300_000 });
  await context.storageState({ path: STATE_PATH });
  await browser.close();
  console.log(`✓ session saved to ${STATE_PATH}`);
  process.exit(0);
}

if (!slug) {
  console.error('Usage: npx tsx scripts/publish-linkedin-article.ts <slug> | --login');
  process.exit(1);
}
if (!existsSync(STATE_PATH)) {
  console.error(`No saved session. Run with --login first (${STATE_PATH}).`);
  process.exit(1);
}

const htmlPath = join(ROOT, 'reposts', slug, 'linkedin.html');
if (!existsSync(htmlPath)) {
  console.error(`Missing ${htmlPath} — run \`npm run generate:reposts ${slug}\` first.`);
  process.exit(1);
}
const html = readFileSync(htmlPath, 'utf-8');
const bodyHtml = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? html;
const title = html.match(/<title>\[LinkedIn Article\] ([\s\S]*?)<\/title>/)?.[1] ?? slug;
const coverPath = join(ROOT, 'reposts', slug, 'cover.png');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: STATE_PATH });
const page = await context.newPage();
await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });

// A redirect to /login means the saved session expired.
if (page.url().includes('/login') || page.url().includes('/authwall')) {
  console.error('Session expired — rerun with --login.');
  await browser.close();
  process.exit(1);
}

// Title: contenteditable with a "Title" placeholder.
const titleField = page
  .locator('[data-placeholder="Title"], [aria-placeholder="Title"], h1[contenteditable]')
  .first();
await titleField.waitFor({ timeout: 30_000 });
await titleField.click();
await page.keyboard.type(title);

// Body: focus the editor, then dispatch a synthetic paste carrying the HTML.
// The editor ingests it exactly like a manual Cmd+V, data-URI images included.
const bodyField = page
  .locator('[data-placeholder*="Write"], [aria-placeholder*="Write"], div.ql-editor, [role="textbox"][contenteditable]')
  .last();
await bodyField.click();
await bodyField.evaluate((el, payload) => {
  const dt = new DataTransfer();
  dt.setData('text/html', payload);
  el.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
  );
}, bodyHtml);

// Give the editor time to process embedded images and autosave.
await page.waitForTimeout(10_000);

// Cover image, if the editor exposes a file input for it.
if (existsSync(coverPath)) {
  const fileInput = page.locator('input[type="file"]').first();
  try {
    await fileInput.setInputFiles(coverPath, { timeout: 5_000 });
    await page.waitForTimeout(5_000);
    console.log('✓ cover attached');
  } catch {
    console.log('! could not attach cover automatically — add reposts/' + slug + '/cover.png in the editor');
  }
}

// Confirm autosave before leaving; the draft lives in LinkedIn's Manage view.
const saved = await page
  .getByText(/draft|saved/i)
  .first()
  .isVisible()
  .catch(() => false);
console.log(saved ? '✓ draft autosaved' : '! could not confirm autosave — check the window');
console.log('Draft left open for review at linkedin.com (Manage → Drafts). NOT published.');
console.log('Close the browser window when done inspecting.');

// Leave the window open for the human to inspect; disconnect without closing.
await new Promise(() => {});
