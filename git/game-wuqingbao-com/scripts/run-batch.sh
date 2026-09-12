#!/usr/bin/env bash
# run-batch.sh — 分批推进 H5 游戏站的抓取工作
# 用法：
#   bash scripts/run-batch.sh 1          # 跑第 1 批（priority=1 上限 30）
#   bash scripts/run-batch.sh 2          # 跑第 2 批
#   bash scripts/run-batch.sh status     # 看各批次游戏数
set -e
export PATH="/usr/local/opt/node@26/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

BATCHES=(
  "1:1:30:B1 首批精选 priority=1"
  "2:2:35:B2 中批 priority≤2"
  "3:3:35:B3 加量 priority≤3"
  "4:9:40:B4 长尾兜底"
)

cmd="${1:-status}"

if [ "$cmd" = "status" ]; then
  total=$(ls "$ROOT/site/src/games/"*.json 2>/dev/null | wc -l | tr -d ' ')
  echo "站点游戏总数: $total"
  echo
  echo "按分类:"
  node -e "
    const fs=require('fs'),path=require('path');
    const dir='$ROOT/site/src/games';
    const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
    const by={};
    for(const f of files){
      const g=JSON.parse(fs.readFileSync(path.join(dir,f)));
      for(const c of g.categories||[]) by[c]=(by[c]||0)+1;
    }
    Object.entries(by).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(' ',k.padEnd(12),v));
  "
  echo
  echo "最近一次抓取日志:"
  ls -t "$ROOT/logs/"fetch-*.jsonl 2>/dev/null | head -1 | xargs -I{} sh -c 'echo "  {}"; tail -5 "{}"'
  exit 0
fi

idx=$((cmd - 1))
line="${BATCHES[$idx]}"
IFS=':' read -r _ prio limit label <<<"$line"

echo "==== $label ===="
echo "priority<=$prio, limit=$limit"
echo

# 只跑该批次尚未处理过的 seeds（fetch-games.mjs 内部按 src/games/<slug>.json 存在性跳过）
node "$ROOT/scripts/fetch-games.mjs" --priority="$prio" --limit="$limit"

echo
echo "==== 建议后续 ===="
echo "cd $ROOT/site && npm run build"
echo "bash scripts/run-batch.sh status"
