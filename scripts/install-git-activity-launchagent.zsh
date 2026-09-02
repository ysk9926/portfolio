#!/bin/zsh
set -euo pipefail

LABEL="com.ysk9926.portfolio-git-activity"
PROJECT_ROOT="/Users/seung-gyu/Workspace/Projects/Personal/Archive/portfolio"
PLIST_PATH="/Users/seung-gyu/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="/Users/seung-gyu/Library/Logs/portfolio-git-activity"
DOMAIN="gui/$(id -u)"

mkdir -p "$LOG_DIR"

tmp_plist=$(mktemp "/tmp/$LABEL.XXXXXX.plist")
trap 'rm -f "$tmp_plist"' EXIT

cat > "$tmp_plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>$PROJECT_ROOT/scripts/run-git-activity-sync.zsh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$PROJECT_ROOT</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>18</integer>
    <key>Minute</key>
    <integer>30</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/stderr.log</string>
</dict>
</plist>
PLIST

plutil -lint "$tmp_plist"
chmod 700 "$PROJECT_ROOT/scripts/run-git-activity-sync.zsh"
launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
install -m 600 "$tmp_plist" "$PLIST_PATH"
launchctl bootstrap "$DOMAIN" "$PLIST_PATH"
launchctl enable "$DOMAIN/$LABEL"

echo "Installed $LABEL (daily 18:30, RunAtLoad enabled)."
