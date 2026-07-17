#!/usr/bin/env npx tsx

/**
 * One-time OAuth 2.0 PKCE helper: obtain an X user access token with the
 * scopes publish-x-article.ts needs (media upload included).
 *
 * Usage:
 *   X_CLIENT_ID=... npx tsx scripts/get-x-token.ts
 *
 * Prereqs (console.x.com → your app → Authentication settings):
 *   - Type of App: Native App (public client) or Web App (confidential)
 *   - Callback URI registered: http://localhost:8935/callback by default
 *     (override the port with X_OAUTH_PORT)
 *   - X_CLIENT_ID is the OAuth 2.0 Client ID from Keys & Tokens. If your app
 *     is a confidential (Web App) client, also set X_CLIENT_SECRET.
 *
 * Prints the authorization URL, waits for the callback, exchanges the code,
 * and prints `export X_ACCESS_TOKEN` / `export X_REFRESH_TOKEN` to stdout.
 * Storage is not this script's job: the broadcast launcher captures these
 * lines and upserts them into its encrypted store (see ../broadcast). To use
 * them by hand, copy the two lines into your environment (never commit).
 */

import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';

// Must match a Callback URI registered in the app's authentication settings.
const PORT = Number(process.env.X_OAUTH_PORT ?? 8935);
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'tweet.read tweet.write users.read media.write offline.access';

const clientId = process.env.X_CLIENT_ID;
const clientSecret = process.env.X_CLIENT_SECRET; // only for confidential clients
if (!clientId) {
  console.error(
    'Set X_CLIENT_ID (console.x.com → app → User authentication settings → OAuth 2.0 Client ID).',
  );
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const verifier = randomBytes(32).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');

const authUrl =
  'https://x.com/i/oauth2/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get('code');
  if (!code || url.searchParams.get('state') !== state) {
    res.writeHead(400).end('Missing code or state mismatch — check the terminal.');
    console.error(
      `Callback error: ${url.searchParams.get('error_description') ?? 'state mismatch'}`,
    );
    process.exit(1);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }
  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    res.writeHead(500).end('Token exchange failed — check the terminal.');
    console.error('Token exchange failed:', JSON.stringify(token));
    process.exit(1);
  }

  res
    .writeHead(200, { 'Content-Type': 'text/html' })
    .end('<h3>Done — you can close this tab.</h3>');

  console.log('\nTokens (captured by the broadcast launcher, or copy by hand):\n');
  console.log(`export X_ACCESS_TOKEN=${token.access_token}`);
  console.log(`export X_REFRESH_TOKEN=${token.refresh_token ?? ''}`);
  console.log(
    `(scopes: ${token.scope ?? SCOPES}; expires in ${Math.round((token.expires_in ?? 7200) / 3600)}h — refresh with X_REFRESH_TOKEN)`,
  );
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log('Open this URL in your browser and approve access:\n');
  console.log(authUrl);
  console.log(`\nWaiting for the callback on ${REDIRECT_URI} ...`);
});
