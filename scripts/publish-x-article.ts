#!/usr/bin/env npx tsx

/**
 * Create an X Article draft from a blog post via the X API.
 *
 * Usage:
 *   npx tsx scripts/publish-x-article.ts <slug> [--dry-run] [--publish]
 *
 * Converts the post to DraftJS content_state (headers, bold/italic, links,
 * lists, blockquotes), uploads pre-rendered mermaid/math/table/code PNGs as
 * media, and POSTs to /2/articles/draft. The article lands in
 * x.com/compose/articles as a DRAFT for manual review; --publish is required
 * to make it public, and even then only after the draft has been reviewed.
 *
 * The Articles API has no code-block type, so code fences are rendered to
 * monospace PNGs (same playwright pipeline as mermaid) followed by a
 * "view with highlighting" link into the original post.
 *
 * Auth: OAuth 1.0a user context. Set in the environment (never commit):
 *   X_API_KEY, X_API_SECRET            — app consumer key/secret
 *   X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET — your account's access token/secret
 * All four come from console.x.com → your app → Keys and tokens.
 */

import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadPost,
  preprocessBody,
  type Rendered,
  renderImages,
  scanBlocks,
} from './lib/repost-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API = 'https://api.x.com/2';

// --- Args ---
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const publish = args.includes('--publish');
if (!slug) {
  console.error('Usage: npx tsx scripts/publish-x-article.ts <slug> [--dry-run] [--publish]');
  process.exit(1);
}

// --- OAuth 1.0a (user context) ---

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

interface OAuthCreds {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessSecret: string;
}

/**
 * Auth, in order of preference:
 * 1. OAuth 2.0 user token (X_ACCESS_TOKEN as Bearer; scopes tweet.read
 *    tweet.write users.read media.write). X_REFRESH_TOKEN is not used here —
 *    refresh with your client when the token expires.
 * 2. OAuth 1.0a user context (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN,
 *    X_ACCESS_TOKEN_SECRET).
 */
type XAuth = { kind: 'bearer'; token: string } | { kind: 'oauth1'; creds: OAuthCreds };

function xAuth(): XAuth {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (X_API_KEY && X_API_SECRET && X_ACCESS_TOKEN && X_ACCESS_TOKEN_SECRET) {
    return {
      kind: 'oauth1',
      creds: {
        consumerKey: X_API_KEY,
        consumerSecret: X_API_SECRET,
        accessToken: X_ACCESS_TOKEN,
        accessSecret: X_ACCESS_TOKEN_SECRET,
      },
    };
  }
  if (X_ACCESS_TOKEN) return { kind: 'bearer', token: X_ACCESS_TOKEN };
  console.error('Set X_ACCESS_TOKEN (OAuth2 user token), or the full OAuth 1.0a set:');
  console.error('X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET');
  process.exit(1);
}

function oauthHeader(method: string, url: string, creds: OAuthCreds): string {
  const params: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  // JSON bodies are not form-encoded, so only oauth params enter the signature.
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');
  const base = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join('&');
  const key = `${percentEncode(creds.consumerSecret)}&${percentEncode(creds.accessSecret)}`;
  params.oauth_signature = createHmac('sha1', key).update(base).digest('base64');
  return `OAuth ${Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(params[k])}"`)
    .join(', ')}`;
}

interface ApiResponse {
  data?: { id?: string; title?: string; media_id?: string };
  [key: string]: unknown;
}

async function apiPost(path: string, body: unknown, auth: XAuth): Promise<ApiResponse> {
  const url = `${API}${path}`;
  const authorization =
    auth.kind === 'bearer' ? `Bearer ${auth.token}` : oauthHeader('POST', url, auth.creds);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

// --- DraftJS content_state builder ---

interface StyleRange {
  offset: number;
  length: number;
  style: 'bold' | 'italic' | 'strikethrough';
}
interface EntityRange {
  offset: number;
  length: number;
  key: number;
}
interface Block {
  key: string;
  text: string;
  type: string;
  inline_style_ranges: StyleRange[];
  entity_ranges: EntityRange[];
}
interface Entity {
  key: string;
  value: { type: string; mutability: string; data: Record<string, unknown> };
}

interface Inline {
  text: string;
  styles: StyleRange[];
  links: { offset: number; length: number; url: string }[];
}

/** Parse this blog's markdown inline subset: links, bold, italic, `code`, [^n]. */
function parseInline(md: string): Inline {
  const out: Inline = { text: '', styles: [], links: [] };
  const merge = (child: Inline, base: number) => {
    out.text += child.text;
    for (const s of child.styles) out.styles.push({ ...s, offset: s.offset + base });
    for (const l of child.links) out.links.push({ ...l, offset: l.offset + base });
  };
  const re =
    /\[([^\]]+)\]\(([^)\s]+)\)|\*\*((?:[^*]|\*(?!\*))+)\*\*|(?<![\w*])\*([^*\n]+)\*(?![\w*])|(?<![\w_])_([^_\n]+)_(?![\w_])|`([^`\n]+)`|\[\^(\d+)\]/g;
  let last = 0;
  for (const m of md.matchAll(re)) {
    out.text += md.slice(last, m.index);
    const base = out.text.length;
    if (m[1] !== undefined) {
      const inner = parseInline(m[1]);
      merge(inner, base);
      out.links.push({ offset: base, length: inner.text.length, url: m[2] });
    } else if (m[3] !== undefined) {
      const inner = parseInline(m[3]);
      merge(inner, base);
      out.styles.push({
        offset: base,
        length: inner.text.length,
        style: 'bold',
      });
    } else if (m[4] !== undefined || m[5] !== undefined) {
      const inner = parseInline((m[4] ?? m[5]) as string);
      merge(inner, base);
      out.styles.push({
        offset: base,
        length: inner.text.length,
        style: 'italic',
      });
    } else if (m[6] !== undefined) {
      out.text += m[6]; // inline code: no DraftJS style; keep the text
    } else {
      out.text += `[${m[7]}]`; // footnote ref → plain [n]
    }
    last = m.index + m[0].length;
  }
  out.text += md.slice(last);
  return out;
}

const entities: Entity[] = [];
const pendingMedia = new Map<number, { file: string }>(); // entity index → image file

function addLinkEntity(url: string): number {
  entities.push({
    key: String(entities.length),
    value: { type: 'link', mutability: 'mutable', data: { url } },
  });
  return entities.length - 1;
}

function addImageEntity(file: string, caption: string): number {
  const idx = entities.length;
  entities.push({
    key: String(idx),
    value: {
      type: 'image',
      mutability: 'immutable',
      // media_items is filled with a real media_id after upload
      data: {
        media_items: [{ media_category: 'TWEET_IMAGE', media_id: '' }],
        caption,
      },
    },
  });
  pendingMedia.set(idx, { file });
  return idx;
}

let blockN = 0;
function makeBlock(type: string, inl: Inline): Block {
  blockN += 1;
  // Bare URLs (footnote references) become links too, unless already inside one.
  const urlRe = /https?:\/\/[^\s)\]"']+/g;
  for (const m of inl.text.matchAll(urlRe)) {
    const [start, len] = [m.index, m[0].length];
    const covered = inl.links.some((l) => start < l.offset + l.length && l.offset < start + len);
    if (!covered) inl.links.push({ offset: start, length: len, url: m[0] });
  }
  return {
    key: `b${blockN}`,
    text: inl.text,
    type,
    inline_style_ranges: inl.styles,
    entity_ranges: inl.links.map((l) => ({
      offset: l.offset,
      length: l.length,
      key: addLinkEntity(l.url),
    })),
  };
}

function textBlock(type: string, md: string): Block {
  return makeBlock(type, parseInline(md));
}

function atomicBlock(entityKey: number): Block {
  blockN += 1;
  return {
    key: `b${blockN}`,
    text: ' ',
    type: 'atomic',
    inline_style_ranges: [],
    entity_ranges: [{ offset: 0, length: 1, key: entityKey }],
  };
}

// --- Load, preprocess, render images ---

const { frontmatter, body, blogUrl } = loadPost(ROOT, slug);
const imageDir = join(ROOT, 'public', 'images', 'reposts', slug);
const cleanBody = preprocessBody(body, blogUrl);
const { rendered, codeFences } = scanBlocks(cleanBody);

const codeRendered: Rendered[] = codeFences.map((f, i) => ({
  kind: 'code',
  source: f.source,
  anchor: f.anchor,
  file: `code-${i + 1}.png`,
  alt: 'Code — view with syntax highlighting on the original post',
  lang: f.lang,
}));

await renderImages([...rendered, ...codeRendered], ROOT, imageDir, `public/images/reposts/${slug}`);

// --- Walk the markdown into blocks ---

const blocks: Block[] = [];

blocks.push(
  (() => {
    const b = textBlock(
      'unstyled',
      `For the full experience with interactive visuals and citations, read the original at ${blogUrl}`,
    );
    b.inline_style_ranges.push({
      offset: 0,
      length: b.text.length,
      style: 'italic',
    });
    return b;
  })(),
);

const byKind = { mermaid: 0, math: 0, table: 0 };
const nextRendered = (kind: 'mermaid' | 'math' | 'table'): Rendered => {
  const r = rendered.filter((x) => x.kind === kind)[byKind[kind]];
  byKind[kind] += 1;
  return r;
};

const lines = cleanBody.split('\n');
let codeI = 0;
let sawFootnotes = false;
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  if (/^```/.test(line)) {
    const lang = line.slice(3).trim();
    let j = i + 1;
    while (j < lines.length && !/^```\s*$/.test(lines[j])) j += 1;
    if (lang === 'mermaid') {
      const r = nextRendered('mermaid');
      blocks.push(atomicBlock(addImageEntity(r.file, r.alt)));
    } else {
      // The Articles API has no code-block type; the image's caption already
      // points readers at the highlighted original, so no extra link block.
      const r = codeRendered[codeI];
      codeI += 1;
      blocks.push(atomicBlock(addImageEntity(r.file, r.alt)));
    }
    i = j + 1;
  } else if (/^\$\$\s*$/.test(line)) {
    let j = i + 1;
    while (j < lines.length && !/^\$\$\s*$/.test(lines[j])) j += 1;
    const r = nextRendered('math');
    blocks.push(atomicBlock(addImageEntity(r.file, r.alt)));
    i = j + 1;
  } else if (/^\|.*\|\s*$/.test(line) && /^\|.*\|\s*$/.test(lines[i + 1] ?? '')) {
    while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) i += 1;
    const r = nextRendered('table');
    blocks.push(atomicBlock(addImageEntity(r.file, r.alt)));
  } else if (/^<blockquote>/.test(line)) {
    const m = line.match(/<strong>([\s\S]*?)<\/strong>(?:<br>)?([\s\S]*?)<\/p><\/blockquote>/);
    if (m) {
      const title = m[1].trim();
      const rest = m[2].trim();
      const b = textBlock('blockquote', `${title}: ${rest}`);
      b.inline_style_ranges.push({
        offset: 0,
        length: title.length + 1,
        style: 'bold',
      });
      blocks.push(b);
    }
    i += 1;
  } else if (/^###\s+/.test(line)) {
    blocks.push(textBlock('header-two', line.replace(/^###\s+/, '')));
    i += 1;
  } else if (/^##\s+/.test(line)) {
    blocks.push(textBlock('header-one', line.replace(/^##\s+/, '')));
    i += 1;
  } else if (/^---\s*$/.test(line)) {
    i += 1;
  } else if (/^>\s?/.test(line)) {
    const quote: string[] = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) {
      quote.push(lines[i].replace(/^>\s?/, ''));
      i += 1;
    }
    blocks.push(textBlock('blockquote', quote.join(' ').trim()));
  } else if (/^\[\^(\d+)\]:\s+/.test(line)) {
    if (!sawFootnotes) {
      blocks.push(textBlock('header-two', 'References'));
      sawFootnotes = true;
    }
    blocks.push(textBlock('ordered-list-item', line.replace(/^\[\^\d+\]:\s+/, '')));
    i += 1;
  } else if (/^(\d+)\.\s+/.test(line) || /^-\s+/.test(line)) {
    const ordered = /^\d+\.\s+/.test(line);
    let item = line.replace(/^(?:\d+\.|-)\s+/, '');
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(?:\d+\.|-)\s+/.test(lines[i]) &&
      !/^#{2,3}\s/.test(lines[i])
    ) {
      item += ` ${lines[i].trim()}`;
      i += 1;
    }
    blocks.push(textBlock(ordered ? 'ordered-list-item' : 'unordered-list-item', item));
  } else if (line.trim() === '') {
    i += 1;
  } else {
    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(```|\$\$|##|>|\||-\s|\d+\.\s|<blockquote>|\[\^)/.test(lines[i]) &&
      !/^---\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(textBlock('unstyled', para.join(' ')));
  }
}

// --- Assemble, upload, create draft ---

const draft = {
  title: frontmatter.title,
  content_state: { blocks, entities },
} as {
  title: string;
  content_state: { blocks: Block[]; entities: Entity[] };
  cover_media?: { media_category: string; media_id: string };
};

if (dryRun) {
  console.log(JSON.stringify(draft, null, 2));
  console.log(
    `\n--dry-run: ${blocks.length} blocks, ${entities.length} entities, ${pendingMedia.size} images to upload`,
  );
  process.exit(0);
}

const creds = xAuth();

for (const [idx, { file }] of pendingMedia) {
  const b64 = readFileSync(join(imageDir, file)).toString('base64');
  const res = await apiPost(
    '/media/upload',
    {
      media: b64,
      media_category: 'tweet_image',
      media_type: 'image/png',
    },
    creds,
  );
  const mediaId = res.data?.id ?? res.data?.media_id;
  if (!mediaId)
    throw new Error(`No media id in upload response for ${file}: ${JSON.stringify(res)}`);
  (entities[idx].value.data.media_items as { media_id: string }[])[0].media_id = String(mediaId);
  console.log(`✓ uploaded ${file} → media_id ${mediaId}`);
}

const coverPath = join(ROOT, 'dist', 'og', `${slug}.png`);
if (existsSync(coverPath)) {
  const res = await apiPost(
    '/media/upload',
    {
      media: readFileSync(coverPath).toString('base64'),
      media_category: 'tweet_image',
      media_type: 'image/png',
    },
    creds,
  );
  const mediaId = res.data?.id ?? res.data?.media_id;
  if (mediaId) {
    draft.cover_media = {
      media_category: 'TWEET_IMAGE',
      media_id: String(mediaId),
    };
    console.log(`✓ uploaded cover → media_id ${mediaId}`);
  }
} else {
  console.log('! No cover (run `npm run build` to generate dist/og); creating draft without one');
}

const created = await apiPost('/articles/draft', draft, creds);
const articleId = created.data?.id;
console.log(`✓ draft created: "${created.data?.title}" (id ${articleId})`);
console.log(`  review at: https://x.com/compose/articles/edit/${articleId}`);

if (publish) {
  const pub = await apiPost(`/articles/${articleId}/publish`, {}, creds);
  console.log(`✓ PUBLISHED: ${JSON.stringify(pub.data)}`);
} else {
  console.log('  (draft only — pass --publish to make it public after review)');
}
