#!/usr/bin/env bash
#
# 把 docs-dist/ 部署到服务器,并更新导览站的 app.js。
#
# 用法:
#   pnpm docs:deploy          # 构建 + 部署
#   bash scripts/deploy-docs.sh   # 只部署(需要先 pnpm docs 构建)
#
# 服务器现状(2026-10 部署):
#   /opt/docs/            → http://47.94.202.248:3333/docs/
#   /opt/dsh-source-tour/ → http://47.94.202.248:3333/dsh-source-tour/
#   nginx 配置在 /etc/nginx/sites-available/agent-academy
#
set -euo pipefail

HOST="aliyun-lobster"
BASE="http://47.94.202.248:3333"
SSH="ssh -o ClearAllForwardings=yes -o BatchMode=yes $HOST"
SCP="scp -o ClearAllForwardings=yes -o BatchMode=yes"

cd "$(dirname "$0")/.."

if [ ! -d docs-dist ]; then
  echo "❌ 没有 docs-dist/,先执行:pnpm docs"
  exit 1
fi

echo "==> 打包并上传"
tar -czf /tmp/agent-docs.tar.gz -C docs-dist .
tar -czf /tmp/agent-tour.tar.gz dsh-source-tour
$SCP /tmp/agent-docs.tar.gz /tmp/agent-tour.tar.gz "$HOST:/tmp/"

echo "==> 解压并修权限"
$SSH 'mkdir -p /opt/docs
  tar -xzf /tmp/agent-docs.tar.gz -C /opt/docs
  tar -xzf /tmp/agent-tour.tar.gz -C /opt/dsh-source-tour --strip-components=1
  chown -R root:root /opt/docs /opt/dsh-source-tour
  find /opt/docs /opt/dsh-source-tour -type d -exec chmod 755 {} +
  find /opt/docs /opt/dsh-source-tour -type f -exec chmod 644 {} +
  rm -f /tmp/agent-docs.tar.gz /tmp/agent-tour.tar.gz'
rm -f /tmp/agent-docs.tar.gz /tmp/agent-tour.tar.gz

echo "==> 验证"
fail=0
for u in /docs/ /docs/interview.html /docs/learning.html /dsh-source-tour/; do
  code=$(curl -s -o /dev/null -m 10 -w "%{http_code}" "$BASE$u" || echo "000")
  printf "  %-26s HTTP %s\n" "$u" "$code"
  [ "$code" = "200" ] || fail=1
done

if [ "$fail" = "0" ]; then
  echo
  echo "✅ 部署完成:"
  echo "   文档站   $BASE/docs/"
  echo "   源码导览 $BASE/dsh-source-tour/"
else
  echo
  echo "❌ 有页面没返回 200,检查 nginx 和 /opt 下的文件"
  exit 1
fi