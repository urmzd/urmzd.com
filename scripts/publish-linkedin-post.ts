#!/usr/bin/env npx tsx

/**
 * Publish the LinkedIn feed post announcing a blog article, via the
 * Posts API (POST /rest/posts) with an article link card.
 *
 * Usage:
 *   npx tsx scripts/publish-linkedin-post.ts <slug>          # preview only
 *   npx tsx scripts/publish-linkedin-post.ts <slug> --yes    # actually post
 *
 * IMPORTANT: unlike the X Articles API, LinkedIn's Posts API has NO draft
 * state on creation ("PUBLISHED is the only accepted field during
 * creation"), so --yes posts LIVE to your feed immediately. The default run
 * is a preview that makes no write calls.
 *
 * This automates the FEED SHARE only (reposts/<slug>/linkedin-post.txt +
 * link card with the OG thumbnail). The long-form LinkedIn *article* has no
 * public API and still goes through the editor paste flow — see the
 * publish-reposts skill.
 *
 * Env (get-linkedin-token.ts prints the last two):
 *   LINKEDIN_ACCESS_TOKEN   — member token with w_member_social
 *   LINKEDIN_PERSON_URN     — urn:li:person:...
 *   LINKEDIN_VERSION        — optional LinkedIn-Version header (default 202506)
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPost } from './lib/repost-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API = 'https://api.linkedin.com';
const VERSION = process.env.LINKEDIN_VERSION ?? '202606';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const confirmed = args.includes('--yes');
if (!slug) {
  console.error('Usage: npx tsx scripts/publish-linkedin-post.ts <slug> [--yes]');
  process.exit(1);
}

const { frontmatter, blogUrl } = loadPost(ROOT, slug);
const feedPostPath = join(ROOT, 'reposts', slug, 'linkedin-post.txt');
if (!existsSync(feedPostPath)) {
  console.error(`Missing ${feedPostPath} — run \`npm run generate:reposts ${slug}\` first.`);
  process.exit(1);
}
const commentaryRaw = readFileSync(feedPostPath, 'utf-8').trim();

// "little" text format: these characters are reserved and must be escaped.
// # and @ are left alone so hashtags stay live (the text contains no mentions).
function escapeLittle(text: string): string {
  return text.replace(/[\\|{}<>[\]()*_~]/g, (c) => `\\${c}`);
}
const commentary = escapeLittle(commentaryRaw);

console.log('--- Post preview -------------------------------------------');
console.log(commentaryRaw);
console.log('--- Link card ----------------------------------------------');
console.log(`title:       ${frontmatter.title}`);
console.log(`description: ${frontmatter.description.slice(0, 120)}...`);
console.log(`source:      ${blogUrl}`);
console.log('------------------------------------------------------------');

if (!confirmed) {
  console.log('\nPreview only. LinkedIn has NO draft state for API-created posts;');
  console.log('rerun with --yes to publish LIVE to your feed.');
  process.exit(0);
}

const token = process.env.LINKEDIN_ACCESS_TOKEN;
const author = process.env.LINKEDIN_PERSON_URN;
if (!token || !author) {
  console.error(
    'Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN (run scripts/get-linkedin-token.ts).',
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'LinkedIn-Version': VERSION,
  'X-Restli-Protocol-Version': '2.0.0',
  'Content-Type': 'application/json',
};

// --- Thumbnail: upload the OG card via the Images API ---
let thumbnail: string | undefined;
const ogPath = join(ROOT, 'dist', 'og', `${slug}.png`);
if (existsSync(ogPath)) {
  const init = await fetch(`${API}/rest/images?action=initializeUpload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
  });
  const initJson = await init.json();
  if (!init.ok) throw new Error(`initializeUpload failed: ${JSON.stringify(initJson)}`);
  const { uploadUrl, image } = initJson.value;
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: readFileSync(ogPath),
  });
  if (!put.ok) throw new Error(`image PUT failed: ${put.status}`);
  thumbnail = image;
  console.log(`✓ uploaded thumbnail → ${image}`);
} else {
  console.log('! No dist/og cover found; posting without a custom thumbnail');
}

// --- Create the post (LIVE) ---
const body = {
  author,
  commentary,
  visibility: 'PUBLIC',
  distribution: {
    feedDistribution: 'MAIN_FEED',
    targetEntities: [],
    thirdPartyDistributionChannels: [],
  },
  content: {
    article: {
      source: blogUrl,
      title: frontmatter.title,
      description: frontmatter.description,
      ...(thumbnail ? { thumbnail } : {}),
    },
  },
  lifecycleState: 'PUBLISHED',
  isReshareDisabledByAuthor: false,
};

const res = await fetch(`${API}/rest/posts`, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});
if (!res.ok) {
  throw new Error(`POST /rest/posts → ${res.status}: ${await res.text()}`);
}
const postUrn = res.headers.get('x-restli-id');
console.log(`✓ PUBLISHED: ${postUrn}`);
console.log(`  view: https://www.linkedin.com/feed/update/${postUrn}/`);
