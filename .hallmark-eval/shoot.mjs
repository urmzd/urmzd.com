// usage: node .hallmark-eval/shoot.mjs <before|after>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const phase = process.argv[2];
const base = 'http://127.0.0.1:4404';
const routes = { home: '/', blog: '/blog', post: '/blog/rag-is-immortal', projects: '/projects', project: '/projects/agentspec', research: '/research', about: '/about' };
const sizes = { desktop: [1440, 900], phone: [390, 844] };
const out = `.hallmark-eval/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [sn, [w, h]] of Object.entries(sizes)) for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, isMobile: sn === 'phone', hasTouch: sn === 'phone', serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
  for (const [name, route] of Object.entries(routes)) {
    const page = await ctx.newPage();
    try {
      await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}/${name}-${sn}-${theme}.png` });
      if (name !== 'home') {
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${out}/${name}-${sn}-${theme}-full.png`, fullPage: true });
      }
      console.log('ok', name, sn, theme);
    } catch (e) { console.log('ERR', name, sn, theme, e.message.split('\n')[0]); }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
