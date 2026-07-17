#!/usr/bin/env npx tsx

/**
 * One-time OAuth 2.0 (3-legged) helper: obtain a LinkedIn member access
 * token for publish-linkedin-post.ts.
 *
 * Usage:
 *   LINKEDIN_CLIENT_ID=... LINKEDIN_CLIENT_SECRET=... npx tsx scripts/get-linkedin-token.ts
 *
 * Prereqs (developer app, linkedin.com/developers/apps):
 *   - Products: "Share on LinkedIn" and "Sign In with LinkedIn using OpenID
 *     Connect" (the latter provides the openid/profile scopes used to
 *     resolve your person URN).
 *   - Auth → Authorized redirect URLs must include:
 *       http://localhost:8935/callback
 *
 * Starts a localhost callback server, prints the authorization URL for you
 * to open, exchanges the code, and prints the access token + person URN to
 * copy into your environment (.envrc — never commit). Tokens live ~2 months.
 */

import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';

const save = process.argv.includes('--save'); // append to ~/.envrc.local instead of printing
const PORT = 8935;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'openid profile w_member_social';

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET (developer app → Auth tab).');
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authUrl =
  'https://www.linkedin.com/oauth/v2/authorization?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    state,
    scope: SCOPES,
  }).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get('code');
  const gotState = url.searchParams.get('state');
  if (!code || gotState !== state) {
    res.writeHead(400).end('Missing code or state mismatch — check the terminal.');
    console.error(
      `Callback error: ${url.searchParams.get('error_description') ?? 'state mismatch'}`,
    );
    process.exit(1);
  }

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    res.writeHead(500).end('Token exchange failed — check the terminal.');
    console.error('Token exchange failed:', JSON.stringify(token));
    process.exit(1);
  }

  // Resolve the member URN for the posts `author` field.
  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();
  const personUrn = me.sub
    ? `urn:li:person:${me.sub}`
    : '(userinfo failed — set LINKEDIN_PERSON_URN manually)';

  res
    .writeHead(200, { 'Content-Type': 'text/html' })
    .end('<h3>Done — you can close this tab.</h3>');

  if (save) {
    const envPath = join(homedir(), '.envrc.local');
    appendFileSync(
      envPath,
      `\nexport LINKEDIN_ACCESS_TOKEN="${token.access_token}"\nexport LINKEDIN_PERSON_URN="${personUrn}"\n`,
    );
    console.log(`\n✓ appended LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN to ${envPath}`);
  } else {
    console.log('\nAdd to your environment (.envrc — never commit):\n');
    console.log(`export LINKEDIN_ACCESS_TOKEN=${token.access_token}`);
    console.log(`export LINKEDIN_PERSON_URN=${personUrn}`);
  }
  console.log(`(token expires in ${Math.round((token.expires_in ?? 0) / 86400)} days)`);
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log('Open this URL in your browser and approve access:\n');
  console.log(authUrl);
  console.log(`\nWaiting for the callback on ${REDIRECT_URI} ...`);
});
