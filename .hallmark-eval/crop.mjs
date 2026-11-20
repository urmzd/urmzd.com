import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', serviceWorkers: 'block' });
await ctx.addInitScript(() => localStorage.setItem('theme', 'dark'));
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:4404/blog/rag-is-immortal', { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(1500);
const el = p.locator('pre.astro-code:has(span[style*="6A737D"])').first();
await el.scrollIntoViewIfNeeded();
await el.screenshot({ path: '.hallmark-eval/after/post-codeblock-desktop-dark.png' });
console.log(await el.locator('span[style*="6A737D"]').first().evaluate(e => getComputedStyle(e).color));
// command palette
await p.keyboard.press('Meta+k'); await p.waitForTimeout(800);
await p.screenshot({ path: '.hallmark-eval/after/command-palette-desktop-dark.png' });
await b.close();
