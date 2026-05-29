#!/bin/bash
#
# HowToCook Skill 安装脚本
# 用法: curl -sSL https://howtocook.cn/install.sh | bash
#
set -e

SKILL_NAME="howtocook"
SKILL_URL="https://howtocook.cn/howtocook-skill.tar.gz"
SKILL_DIR=""

# 临时文件清理
_TMP_FILES=()
cleanup() {
    for f in "${_TMP_FILES[@]}"; do
        rm -f "$f"
    done
}
trap cleanup EXIT

# 日志
log() { echo "[HowToCook] $*"; }
warn() { echo "[HowToCook] 警告: $*" >&2; }
error() { echo "[HowToCook] 错误: $*" >&2; exit 1; }

# 检测 agent 类型
detect_agent() {
    if [ -n "$CLAUDE_CODE_SESSION_ID" ]; then
        echo "claude-code"
    elif command -v hermes >/dev/null 2>&1; then
        echo "hermes"
    elif command -v nanobot >/dev/null 2>&1; then
        echo "nanobot"
    else
        echo "unknown"
    fi
}

# 获取 skill 安装目录
get_skill_dir() {
    local agent_type="$1"
    case "$agent_type" in
        claude-code)
            # Claude Code: ~/.claude/skills/
            echo "$HOME/.claude/skills"
            ;;
        hermes|nanobot)
            # Hermes/NanoBot: ~/.hermes/skills/
            echo "$HOME/.hermes/skills"
            ;;
        *)
            # 默认 Claude Code 路径
            echo "$HOME/.claude/skills"
            ;;
    esac
}

# 检测已安装的 skill
check_existing() {
    local skill_dir="$1"
    if [ -d "$skill_dir/$SKILL_NAME" ]; then
        echo "exists"
    else
        echo "new"
    fi
}

# 主安装函数
install_skill() {
    local agent_type="$1"
    local skill_dir="$2"
    local dest_dir="$skill_dir/$SKILL_NAME"

    log "检测到 Agent 类型: $agent_type"
    log "安装目录: $skill_dir"

    # 创建目录
    mkdir -p "$skill_dir"

    # 下载并解压
    log "正在下载 HowToCook Skill..."
    local tmp_file
    tmp_file=$(mktemp /tmp/howtocook-skill-XXXXXX.tar.gz)
    _TMP_FILES+=("$tmp_file")

    if curl -fsSL "$SKILL_URL" -o "$tmp_file"; then
        # SHA256 checksum verification
        EXPECTED_SHA256="${SKILL_SHA256:-}"
        if [ -n "$EXPECTED_SHA256" ]; then
            ACTUAL_SHA256=$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)
            if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
                error "Checksum 验证失败：期望 $EXPECTED_SHA256，实际 $ACTUAL_SHA256"
            fi
            log "Checksum 验证通过"
        fi

        # Path traversal check
        if tar -tzf "$tmp_file" | grep -qE '^\.\.|^/'; then
            error "tarball 包含不安全路径，拒绝解压"
        fi

        log "下载完成，正在安装..."
        tar -xzf "$tmp_file" -C "$skill_dir" || error "解压失败，下载文件可能已损坏"
    else
        error "下载失败，请检查网络连接"
    fi

    # 验证安装
    if [ -f "$dest_dir/search.py" ] && [ -f "$dest_dir/SKILL.md" ]; then
        log "✅ HowToCook Skill 安装成功！"
        echo ""
        log "使用方法："
        echo "  Claude Code: /howtocook <搜索词>"
        echo "  其他 Agent:  参考各自文档加载 skill"
        echo ""
        log "示例命令："
        echo "  /howtocook 红烧肉"
        echo "  /查菜谱 水煮鱼"
        echo "  /今天吃什么"
        echo ""
    else
        error "安装验证失败，文件结构异常"
    fi
}

# 更新已安装的 skill
update_skill() {
    local agent_type="$1"
    local skill_dir="$2"
    local dest_dir="$skill_dir/$SKILL_NAME"

    log "检测到已安装 HowToCook Skill，正在更新..."

    # 备份配置（如果存在）
    local has_profile=false
    local profile_backup=""
    if [ -f "$skill_dir/$SKILL_NAME/profile.json" ]; then
        profile_backup=$(mktemp /tmp/howtocook-profile-XXXXXX.json)
        _TMP_FILES+=("$profile_backup")
        cp "$skill_dir/$SKILL_NAME/profile.json" "$profile_backup"
        has_profile=true
    fi

    # 重新下载安装
    local tmp_file
    tmp_file=$(mktemp /tmp/howtocook-skill-XXXXXX.tar.gz)
    _TMP_FILES+=("$tmp_file")

    if curl -fsSL "$SKILL_URL" -o "$tmp_file"; then
        # SHA256 checksum verification
        EXPECTED_SHA256="${SKILL_SHA256:-}"
        if [ -n "$EXPECTED_SHA256" ]; then
            ACTUAL_SHA256=$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)
            if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
                error "Checksum 验证失败：期望 $EXPECTED_SHA256，实际 $ACTUAL_SHA256"
            fi
            log "Checksum 验证通过"
        fi

        # Path traversal check
        if tar -tzf "$tmp_file" | grep -qE '^\.\.|^/'; then
            error "tarball 包含不安全路径，拒绝解压"
        fi

        # 保留旧目录备份，解压失败时可回滚
        rm -rf "$skill_dir/$SKILL_NAME.bak"
        mv "$skill_dir/$SKILL_NAME" "$skill_dir/$SKILL_NAME.bak"

        if ! tar -xzf "$tmp_file" -C "$skill_dir"; then
            mv "$skill_dir/$SKILL_NAME.bak" "$skill_dir/$SKILL_NAME"
            error "解压失败，已回滚到旧版本"
        fi

        rm -rf "$skill_dir/$SKILL_NAME.bak"

        # 恢复配置
        if [ "$has_profile" = true ] && [ -f "$profile_backup" ]; then
            mv "$profile_backup" "$skill_dir/$SKILL_NAME/profile.json"
        fi

        log "✅ HowToCook Skill 更新成功！"
    else
        # 下载失败，恢复旧目录名
        if [ -d "$skill_dir/$SKILL_NAME.bak" ]; then
            mv "$skill_dir/$SKILL_NAME.bak" "$skill_dir/$SKILL_NAME"
        fi
        error "更新失败，请检查网络连接"
    fi
}

# 主流程
main() {
    echo ""
    log "HowToCook Skill 安装脚本"
    log "========================"
    echo ""

    local agent_type=$(detect_agent)
    local skill_dir=$(get_skill_dir "$agent_type")
    local install_status=$(check_existing "$skill_dir")

    if [ "$install_status" = "exists" ]; then
        update_skill "$agent_type" "$skill_dir"
    else
        install_skill "$agent_type" "$skill_dir"
    fi
}

main "$@"