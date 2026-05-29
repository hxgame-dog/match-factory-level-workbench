#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SRC="$ROOT/scripts/git-hooks/post-commit"
HOOK_DST="$ROOT/.git/hooks/post-commit"

if [ ! -d "$ROOT/.git" ]; then
  echo "错误：当前目录不是 Git 仓库" >&2
  exit 1
fi

cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "已安装 post-commit 钩子：每次 commit 后自动 git push"
