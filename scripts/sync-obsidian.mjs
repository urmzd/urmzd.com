#!/usr/bin/env node
// Mirrors the "Blog" folder of the main Obsidian vault into src/blog/.
//
// The vault is the source of truth: posts are copied into the repo when they
// differ, and repo posts with no counterpart in the vault are removed. Only
// top-level .md files are touched; git history is the safety net for deletes.
//
// Primary path: the Obsidian CLI's `eval` command, which runs the mirror
// inside the app. Under launchd, node itself is denied access to iCloud Drive
// by macOS privacy controls, but the Obsidian app already has it.
//
// Fallback: if the app isn't running, read the vault directly (resolved from
// Obsidian's vault registry). This works from a terminal with iCloud access.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VAULT = "Documents";
const SOURCE_FOLDER = "Blog";
const blogDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/blog");

// Self-contained so it can be serialized into the Obsidian `eval` payload.
function mirror(src, dst) {
  const fs = require("node:fs");
  const p = require("node:path");
  const listPosts = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("."));

  // iCloud evicts files to ".<name>.md.icloud" placeholders; refuse to treat
  // them as deletions.
  const evicted = fs.readdirSync(src).filter((f) => f.endsWith(".md.icloud"));
  if (evicted.length) throw new Error(`iCloud placeholders not downloaded: ${evicted.join(", ")}`);

  const vaultPosts = listPosts(src);
  if (vaultPosts.length === 0) throw new Error(`No posts in ${src}; refusing to empty ${dst}`);

  let copied = 0;
  let removed = 0;
  for (const f of vaultPosts) {
    const from = fs.readFileSync(p.join(src, f));
    const to = p.join(dst, f);
    if (fs.existsSync(to) && fs.readFileSync(to).equals(from)) continue;
    fs.writeFileSync(to, from);
    copied++;
  }
  for (const f of listPosts(dst)) {
    if (vaultPosts.includes(f)) continue;
    fs.rmSync(p.join(dst, f));
    removed++;
  }
  return `${copied} updated, ${removed} removed`;
}

function syncViaCli() {
  const code = `
const src = require('path').join(app.vault.adapter.basePath, ${JSON.stringify(SOURCE_FOLDER)});
(${mirror.toString()})(src, ${JSON.stringify(blogDir)});
`;
  const out = execFileSync("obsidian", [`vault=${VAULT}`, "eval", `code=${code}`], { encoding: "utf8" }).trim();
  if (!/updated, \d+ removed/.test(out)) throw new Error(out || "no output from Obsidian CLI");
  return out.replace(/^=>\s*/, "");
}

function syncViaDirectRead() {
  const registry = path.join(os.homedir(), "Library/Application Support/obsidian/obsidian.json");
  const { vaults } = JSON.parse(fs.readFileSync(registry, "utf8"));
  const vault = Object.values(vaults).find((v) => path.basename(v.path) === VAULT);
  if (!vault) throw new Error(`Vault "${VAULT}" not found in ${registry}`);
  return mirror(path.join(vault.path, SOURCE_FOLDER), blogDir);
}

const stamp = () => new Date().toISOString();
try {
  console.log(`[${stamp()}] vault -> repo via Obsidian CLI: ${syncViaCli()}`);
} catch (cliErr) {
  try {
    console.log(`[${stamp()}] vault -> repo via direct read: ${syncViaDirectRead()}`);
  } catch (err) {
    console.error(`[${stamp()}] Sync failed: CLI: ${cliErr.message.split("\n")[0]}; direct: ${err.message}`);
    process.exit(1);
  }
}
