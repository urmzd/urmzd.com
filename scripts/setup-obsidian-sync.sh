#!/usr/bin/env bash
# Installs a launchd agent that mirrors the Obsidian vault's Blog folder into
# src/blog/ whenever a post changes in the vault (and once at login). Re-run
# to update; pass --uninstall to remove.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="com.urmzd.obsidian-blog-sync"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/obsidian-blog-sync.log"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL"
  exit 0
fi

# Stable node path: prefer fnm's default alias (survives shell sessions and
# version bumps), fall back to whatever is on PATH.
NODE="$HOME/.local/share/fnm/aliases/default/bin/node"
[[ -x "$NODE" ]] || NODE="$(command -v node)"

VAULT_BLOG="$("$NODE" -e '
const fs = require("fs"), os = require("os"), p = require("path");
const r = JSON.parse(fs.readFileSync(p.join(os.homedir(), "Library/Application Support/obsidian/obsidian.json"), "utf8"));
const v = Object.values(r.vaults).find((v) => p.basename(v.path) === "Documents");
process.stdout.write(p.join(v.path, "Blog"));
')"

OBSIDIAN_BIN_DIR="$(dirname "$(command -v obsidian)")"

mkdir -p "$(dirname "$PLIST")"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$REPO_ROOT/scripts/sync-obsidian.mjs</string>
  </array>
  <key>WatchPaths</key>
  <array>
    <string>$VAULT_BLOG</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$OBSIDIAN_BIN_DIR:/usr/bin:/bin</string>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Installed $LABEL"
echo "  watches: $VAULT_BLOG"
echo "  log:     $LOG"
