---
name: publish-reposts
description: Prepare, validate, and publish X/LinkedIn repost drafts for a blog post. Use when repurposing a post for social platforms, creating an X Article draft via the API, validating repost HTML in the platform editors, or troubleshooting the repost pipeline.
compatibility: "Requires: npm deps installed (playwright, tsx); X API env vars for the API route; Claude in Chrome for the browser route"
metadata:
  author: urmzd
  version: "1.0"
---

# Publishing Reposts

Repurpose a blog post (`src/blog/<slug>.md`) into platform drafts. Two routes:
the **X API route** (preferred for X — programmatic, reviewable draft) and the
**browser paste route** (required for LinkedIn — no public article API).

## Pipeline overview

Shared core: `scripts/lib/repost-core.ts` (post loading, markdown
preprocessing, block scanning, headless PNG rendering of mermaid / math /
tables / code via playwright + the site's own mermaid/katex builds).

| Artifact | Producer | Purpose |
| --- | --- | --- |
| `reposts/<slug>/twitter.html` | `generate-reposts.ts` | X Articles editor paste (fallback route) |
| `reposts/<slug>/linkedin.html` | `generate-reposts.ts` | LinkedIn article editor paste |
| `reposts/<slug>/x-post.txt`, `linkedin-post.txt` | `generate-reposts.ts` | Feed posts (280 / 3000 char caps checked) |
| `reposts/<slug>/code-N.<lang>` | `generate-reposts.ts` | Native code-block dialogs |
| `reposts/<slug>/cover.png` | `generate-reposts.ts` | Article thumbnail (from the build's OG card) |
| `public/images/reposts/<slug>/*.png` | both scripts | Rendered diagrams/code (HiDPI) |

## Step 1 — Generate

```bash
npm run build                          # once, for dist/og/<slug>.png (cover)
npm run generate:reposts <slug>
```

Images are embedded in the HTML as **data: URIs** so a copy-paste carries the
pixels into the editor (neither platform fetches pasted image URLs). Code
stays as `<pre><code>` with a "view with highlighting" deep link.

## Step 2 — Review the generated files

- Feed posts: check the char counters the script prints; hashtag casing comes
  from `TAG_CASING` in `generate-reposts.ts` (add new acronyms there).
- HTML: open in a browser; confirm callouts became `<blockquote>` (handled in
  `preprocessBody`), footnotes are a numbered list at the end, and section
  deep links point at real anchors.

## Step 3a — X via API (preferred)

```bash
npx tsx scripts/publish-x-article.ts <slug> --dry-run   # inspect content_state
npx tsx scripts/publish-x-article.ts <slug>             # create DRAFT
```

- Needs env: `X_ACCESS_TOKEN` (OAuth2 user token). Bootstrap with
  `scripts/get-x-token.ts --save` (PKCE; needs `X_CLIENT_ID` +
  `X_CLIENT_SECRET` from console.x.com and the registered
  `http://localhost:8935/callback`). Console-generated tokens LACK
  `media.write` — the helper requests it explicitly. Tokens last 2h;
  rerun the helper (zero-click once pre-authorized). OAuth 1.0a
  (`X_API_KEY` + 3 more) also works as a fallback. Never commit secrets.
- The app is Pay-Per-Use: a 402 "credits depleted" means top up in
  console.x.com → Billing → Credits.
- Creates a **draft only** and prints the `x.com/compose/articles/edit/<id>`
  URL. Review in the editor, add the cover if needed, publish by hand — or
  rerun with `--publish` only after the draft has been reviewed.
- The feed post announcing the article is `x-post.txt`; posting it is a
  separate manual step.

### API mapping notes

- DraftJS `content_state`: `##` → `header-one`, `###` → `header-two`, bold /
  italic → `inline_style_ranges`, links + bare URLs → `link` entities,
  footnote refs → plain `[n]`, footnote defs → a "References" header plus
  `ordered-list-item` blocks.
- The Articles API has **no code-block type**: code fences become monospace
  PNGs (`code-N.png`, dark background) as atomic image blocks, each followed
  by a highlighting deep link. Mermaid/math/tables are atomic images too.
- Images upload via `POST /2/media/upload` (base64 JSON,
  `media_category: tweet_image`) before the draft references their ids.

## Step 3b — LinkedIn via browser (no API exists)

1. Serve the repo: `python3 -m http.server 8931 --bind 127.0.0.1` — the
   Chrome extension refuses `file://` URLs.
2. Open `http://127.0.0.1:8931/reposts/<slug>/linkedin.html`, Cmd+A, Cmd+C.
3. Open `https://www.linkedin.com/article/new/`, click the body, Cmd+V.
4. Verify: headings, bold/italic, blockquote, images (data URIs upload on
   paste), code blocks. Add the cover via "Upload from computer" →
   `reposts/<slug>/cover.png`. LinkedIn autosaves as Draft; do not press
   Publish or Next unless publishing was requested.
5. The feed post automates via `scripts/publish-linkedin-post.ts <slug>`
   (preview; `--yes` posts LIVE — LinkedIn's Posts API has no draft state
   on creation). One-time token bootstrap: `scripts/get-linkedin-token.ts`
   (needs the app's `http://localhost:8935/callback` redirect URL and the
   "Sign In with LinkedIn using OpenID Connect" product).

## Browser-automation gotchas (Claude in Chrome)

- The extension needs site permission for `linkedin.com` / `x.com`
  (navigation AND interaction) — set in the extension per site.
- X requires being logged in; the automation must never do the login itself.
- Cross-tab actions inside one `browser_batch` (copy on tab A → click on tab
  B) can fail with a spurious "Permission denied"; split the copy and the
  paste into separate batches.
- Synthetic Cmd+C only reaches the system clipboard after a real click on
  the source page first (focus + gesture), then Cmd+A, Cmd+C.

## Rules

- Never publish from automation. Drafts only; a human presses Publish.
- Never commit or echo the X API credentials.
- Regenerate rather than hand-edit `reposts/<slug>/*.html` — hand fixes get
  overwritten; fix the generator (`preprocessBody`, `TAG_CASING`, etc.).
