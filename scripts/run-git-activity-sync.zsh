#!/bin/zsh
set -euo pipefail

PROJECT_ROOT="/Users/seung-gyu/Workspace/Projects/Personal/Archive/portfolio"
cd "$PROJECT_ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NVM_DIR="/Users/seung-gyu/.nvm"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
fi

set -a
source "$PROJECT_ROOT/.env.local"
set +a

exec node --import tsx "$PROJECT_ROOT/scripts/sync-git-activity.ts"
