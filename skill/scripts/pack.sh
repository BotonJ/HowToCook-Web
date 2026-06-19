#!/bin/bash
#
# HowToCook Skill 打包脚本 — 生成只含运行时产物的分发包。
#
# 目标：用户拿到的 skill 包只有「代码 + index.json + SKILL.md + 静态资源」，
# 绝不含 dishes/ 下的 500+ 菜谱 markdown（那是开发/构建原料，运行时走 API）。
#
# 用法:
#   ./scripts/pack.sh                     # 产出 ../howtocook-skill.tar.gz
#   SKILL_SHA256_PRINT=1 ./scripts/pack.sh  # 额外打印 sha256（填 install.sh 用）
#
# 退出码非 0 表示打包失败或产物仍含 dishes/。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$(cd "$REPO_DIR/.." && pwd)"
TARBALL="$OUT_DIR/howtocook-skill.tar.gz"

cd "$REPO_DIR"

log() { echo "[pack] $*"; }
die() { echo "[pack] 错误: $*" >&2; exit 1; }

log "打包目录: $REPO_DIR"
log "产物:     $TARBALL"

# 关键排除项（防止泄漏 + 防止缓存/状态进包）:
#   dishes/          — 菜谱 markdown 原料（C1 风险，最核心）
#   __pycache__/ *.pyc — Python 字节码
#   .git/ .pytest_cache/ .ruff_cache/ .gstack/ — 仓库元数据与缓存
#   worklogs/ *.md(工作日志) — 开发记录，非运行时
#   .sync-state.json — 本机同步状态（每台机器不同）
#   profile.json     — 用户偏好（若存在，属本机隐私）
#   GIT-ARCHIVE.md / WORKLOG_*.md / .DS_Store / .coverage — 历史文档与系统文件
EXCLUDES=(
  --exclude='dishes'
  --exclude='__pycache__'
  --exclude='*.pyc'
  --exclude='.git'
  --exclude='.pytest_cache'
  --exclude='.ruff_cache'
  --exclude='.gstack'
  --exclude='worklogs'
  --exclude='.sync-state.json'
  --exclude='profile.json'
  --exclude='GIT-ARCHIVE.md'
  --exclude='WORKLOG_*.md'
  --exclude='.DS_Store'
  --exclude='.coverage'
)

# 先校验 index.json 存在且非空（分发核心产物）
[ -s "index.json" ] || die "index.json 缺失或为空，无法打包"

rm -f "$TARBALL"
# 在临时目录里把仓库内容镜像为 howtocook/ 再打包，保证包内前缀干净统一为
# howtocook/（与 install.sh 的 $SKILL_NAME 一致），避免 ./ 或双目录残留。
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
rsync -a \
  --exclude='dishes' \
  --exclude='__pycache__' --exclude='*.pyc' \
  --exclude='.git' --exclude='.pytest_cache' --exclude='.ruff_cache' --exclude='.gstack' \
  --exclude='worklogs' \
  --exclude='.sync-state.json' --exclude='profile.json' \
  --exclude='GIT-ARCHIVE.md' --exclude='WORKLOG_*.md' \
  --exclude='.DS_Store' --exclude='.coverage' \
  "$REPO_DIR/" "$STAGE/howtocook/"

tar -czf "$TARBALL" -C "$STAGE" howtocook

# 闸门：解包验证 dishes/ 绝不存在
if tar -tzf "$TARBALL" | grep -qE '^howtocook/dishes(/|$)'; then
  die "产物仍含 dishes/，打包排除失败，拒绝发布"
fi

log "✅ 打包完成"
log "   条目数: $(tar -tzf "$TARBALL" | wc -l | tr -d ' ')"
log "   体积:   $(du -h "$TARBALL" | cut -f1)"

if [ "${SKILL_SHA256_PRINT:-0}" = "1" ]; then
  printf "   sha256: %s\n" "$(shasum -a 256 "$TARBALL" | cut -d' ' -f1)"
fi
