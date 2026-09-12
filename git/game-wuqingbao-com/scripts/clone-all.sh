#!/usr/bin/env bash
# clone-all.sh — 读 games-list.md，批量 clone 游戏仓库到 vendors/<简写>/
#
# 规则：≤1MB 自动 clone，>1MB 跳过（除非 --all 或指定了该 slug）
#
# 用法:
#   bash scripts/clone-all.sh                    # clone 所有 ≤1MB 且未完成的
#   bash scripts/clone-all.sh pacman hextris     # 指定 slug（无视体积限制）
#   bash scripts/clone-all.sh --all              # 强制全部（含 >1MB）
#   bash scripts/clone-all.sh --dry-run          # 预览
#   bash scripts/clone-all.sh --update           # 已存在的 git pull
set -euo pipefail
export PATH="/usr/local/opt/node@26/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MD="$ROOT/games-list.md"
VENDORS="$ROOT/vendors"
TARBALL_TMP="/tmp/h5games-clone-cache"

mkdir -p "$VENDORS" "$TARBALL_TMP"

DRY=0; FORCE=0; UPDATE=0; ONLY=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    --all) FORCE=1 ;;
    --update) UPDATE=1 ;;
    -*) echo "unknown flag: $arg" ;;
    *) ONLY+=("$arg") ;;
  esac
done

# ── 解析 MD 表格 ──
# 输出: slug<TAB>url<TAB>size_mb
parse_md() {
  awk -F'|' '/^\|/ && !/^\|---/ && !/^\| #/ {
    gsub(/^ +| +$/, "", $4); gsub(/^ +| +$/, "", $6); gsub(/^ +| +$/, "", $7);
    # $4=简写 $6=约MB(如 ~0.1 ~3 ~30+) $7=git链接
    if ($4 != "" && $7 ~ /github\.com/) {
      gsub(/[^0-9.]/, "", $6);  # strip ~ MB letters → numeric
      mb = $6 + 0; if (mb == 0) mb = 0.5;
      print $4 "\t" $7 "\t" mb
    }
  }' "$MD"
}

# ── clone 单个仓库 ──
clone_one() {
  local slug="$1" url="$2" mb="$3"
  local dest="$VENDORS/$slug"

  # 体积检查（--all 或 ONLY 列表指定的不受限制）
  local is_manual=0
  if (( $(echo "$mb > 1.0" | bc -l) )); then
    if [ $FORCE -eq 0 ]; then
      # 检查是否被显式指定
      local explicit=0
      for o in "${ONLY[@]:-}"; do [ "$o" = "$slug" ] && explicit=1; done
      if [ $explicit -eq 0 ]; then
        echo "  ⚠️  $slug: ~${mb}MB > 1MB, skip (use --all or name it explicitly)"
        return 2  # special code: manual-skip
      fi
    fi
    is_manual=1
  fi

  # 跳过已存在
  if [ -d "$dest" ] && [ $FORCE -eq 0 ] && [ $UPDATE -eq 0 ]; then
    echo "  · $slug: already cloned."
    return 0
  fi
  if [ -d "$dest" ] && [ $UPDATE -eq 1 ]; then
    echo "  ↻ $slug: git pull..."
    [ $DRY -eq 0 ] && (cd "$dest" && git pull --ff-only 2>/dev/null || true)
    return 0
  fi

  echo "  ↓ $slug (${mb}MB): $url"
  [ $DRY -eq 1 ] && return 0

  # 方式 1: git clone --depth=1
  if git clone --depth=1 "$url" "$dest" 2>/dev/null; then
    echo "    ✓ git clone ok"
    return 0
  fi

  # 方式 2: tarball 回退
  local repo="${url#https://github.com/}"
  repo="${repo%.git}"
  for branch in main master gh-pages game dist; do
    local tarball="$TARBALL_TMP/$slug.tar.gz"
    if curl -sSfL --http1.1 --max-time 180 \
        -o "$tarball" \
        "https://codeload.github.com/$repo/tar.gz/refs/heads/$branch" 2>/dev/null; then
      local sz=$(wc -c < "$tarball" | tr -d ' ')
      if [ "$sz" -gt 1024 ]; then
        mkdir -p "$dest"
        tar -xzf "$tarball" -C "$dest" --strip-components=1
        rm -f "$tarball"
        echo "    ✓ tarball ($branch)"
        return 0
      fi
    fi
    rm -f "$tarball"
  done

  echo "    ✗ FAILED"
  return 1
}

# ── 主循环 ──
echo "═══════════════════════════════════════════"
echo " H5 游戏站 · Clone (≤1MB auto / >1MB manual)"
echo " 源文件: $MD"
echo " 目标:   $VENDORS/"
echo "═══════════════════════════════════════════"
[ $DRY -eq 1 ] && echo " [DRY-RUN mode]"
echo

ok=0; skip=0; manual=0; fail=0

while IFS=$'\t' read -r slug url mb; do
  # 过滤指定 slug
  if [ ${#ONLY[@]} -gt 0 ]; then
    match=0
    for o in "${ONLY[@]}"; do [ "$o" = "$slug" ] && match=1; done
    [ $match -eq 0 ] && continue
  fi

  rc=0
  clone_one "$slug" "$url" "$mb" || rc=$?
  case $rc in
    0) ok=$((ok+1)) ;;
    2) manual=$((manual+1)) ;;
    *) fail=$((fail+1)) ;;
  esac
done < <(parse_md)

echo
echo "───────────────────────────────────────────"
echo " ✓ 完成: $ok | ⚠️ 待手动(>1MB): $manual | ✗ 失败: $fail"
echo "───────────────────────────────────────────"
echo
if [ $manual -gt 0 ]; then
  echo "手动处理 >1MB 的游戏:"
  echo "  bash scripts/clone-all.sh --all        # 一次性全部 clone"
  echo "  bash scripts/clone-all.sh adarkroom    # 逐个 clone"
  echo "  # 或从 GitHub 下载 zip 解压到 vendors/<简写>/"
  echo
fi
[ $DRY -eq 0 ] && [ $ok -gt 0 ] && du -sh "$VENDORS" 2>/dev/null
