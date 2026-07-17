#!/usr/bin/env bash
# Installs a launchd agent that syncs src/blog/ to the Obsidian vault
# whenever a post changes (and once at login). Re-run to update; pass
# --uninstall to remove.
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
    <string>$REPO_ROOT/src/blog</string>
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
echo "  watches: $REPO_ROOT/src/blog"
echo "  log:     $LOG"
