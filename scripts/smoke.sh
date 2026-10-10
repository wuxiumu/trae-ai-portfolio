#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
fail(){ echo "✗ $1" >&2; exit 1; }; ok(){ echo "✓ $1"; }
[[ -f index.html && -f app.js && -f projects.js ]] || fail "缺少作品集入口"
[[ -f .env.example ]] || fail "缺少 .env.example"
ok "核心文件齐全"
PORT="${SMOKE_PORT:-18094}"
php -S "127.0.0.1:${PORT}" -t "$ROOT" >/tmp/trae-smoke.log 2>&1 &
PID=$!; trap "kill $PID 2>/dev/null||true" EXIT
for i in $(seq 1 30); do curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1 && break; sleep 0.15; done
curl -sf "http://127.0.0.1:${PORT}/" | grep -qi 'html' || fail "首页失败"; ok "首页 200"
echo ""; echo "smoke: ok"
