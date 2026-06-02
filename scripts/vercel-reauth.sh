#!/usr/bin/env bash
# 修复本机 Vercel CLI 登录（auth.json 损坏或为空时）
set -euo pipefail

AUTH_DIR="${HOME}/Library/Application Support/com.vercel.cli"
AUTH_FILE="${AUTH_DIR}/auth.json"

echo "==> 检查 Vercel CLI 登录状态…"
if vercel whoami 2>/dev/null; then
  echo "已登录，可直接执行: vercel --prod --yes"
  exit 0
fi

if [[ -f "${AUTH_FILE}" ]] && [[ "$(wc -c < "${AUTH_FILE}" | tr -d ' ')" -lt 20 ]]; then
  echo "==> 检测到无效的 auth.json，正在删除…"
  rm -f "${AUTH_FILE}"
fi

echo ""
echo "即将打开浏览器完成 Vercel 登录（设备码流程）。"
echo "若浏览器未自动打开，请按终端提示访问 vercel.com/oauth/device 并输入验证码。"
echo ""
vercel login

echo ""
vercel whoami
echo "登录成功。生产部署: cd $(dirname "$0")/.. && vercel --prod --yes"
