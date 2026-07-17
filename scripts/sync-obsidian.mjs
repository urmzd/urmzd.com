#!/usr/bin/env node
// Syncs src/blog/*.md into the "Blog" folder of the main Obsidian vault.
//
// Primary path: the Obsidian CLI's `eval` command, which copies files from
// inside the running app. `eval` is used instead of `create content=...`
// because the CLI rewrites literal \n and \t sequences in the content
// argument, which corrupts LaTeX.
//
// Fallback: if the app isn't running, copy directly into the vault folder
// (resolved from Obsidian's vault registry); Obsidian indexes the files on
// next launch.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VAULT = "Documents";
const TARGET_FOLDER = "Blog";
const blogDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/blog");

const posts = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

function syncViaCli() {
  const code = `
const fs = require('fs'), p = require('path');
const src = ${JSON.stringify(blogDir)};
const dst = p.join(app.vault.adapter.basePath, ${JSON.stringify(TARGET_FOLDER)});
fs.mkdirSync(dst, { recursive: true });
for (const f of ${JSON.stringify(posts)}) fs.copyFileSync(p.join(src, f), p.join(dst, f));
'ok';
`;
  execFileSync("obsidian", [`vault=${VAULT}`, "eval", `code=${code}`], { encoding: "utf8" });
}

function syncViaDirectCopy() {
  const registry = path.join(os.homedir(), "Library/Application Support/obsidian/obsidian.json");
  const { vaults } = JSON.parse(fs.readFileSync(registry, "utf8"));
  const vault = Object.values(vaults).find((v) => path.basename(v.path) === VAULT);
  if (!vault) throw new Error(`Vault "${VAULT}" not found in ${registry}`);
  const dst = path.join(vault.path, TARGET_FOLDER);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of posts) fs.copyFileSync(path.join(blogDir, f), path.join(dst, f));
}

try {
  syncViaCli();
  console.log(`[${new Date().toISOString()}] ${posts.length} post(s) synced via Obsidian CLI`);
} catch {
  try {
    syncViaDirectCopy();
    console.log(
      `[${new Date().toISOString()}] ${posts.length} post(s) synced via direct copy (Obsidian not running)`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Sync failed: ${err.message}`);
    process.exit(1);
  }
}
