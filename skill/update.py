#!/usr/bin/env python3
"""HowToCook Skill 自更新脚本 — 检查远程代码版本并更新本地 skill 文件。

机制：
  1. 从 API /version 获取最新 skill_version
  2. 与本地 .update-state.json 比对
  3. 版本不同时，从 API 下载最新 skill 文件并覆盖

用法：
    python update.py              # 检查并更新
    python update.py --check      # 仅检查，不更新
    python update.py --force      # 强制更新
    python update.py --status     # 显示当前状态
"""

import argparse
import json
import logging
import os
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent
STATE_PATH = SCRIPT_DIR / ".update-state.json"
API_BASE = "https://api.howtocook.cn"
GITHUB_RAW = "https://raw.githubusercontent.com/BotonJ/HowToCook-Web/main/skill"
_TIMEOUT = 30
_AUTO_UPDATE_INTERVAL_DAYS = 7

# 可更新的 skill 文件（代码文件，不包含数据文件）
UPDATABLE_FILES = [
    "SKILL.md",
    "mcp_tools.py",
    "search.py",
    "sync.py",
    "update.py",
    "parser.py",
    "renderer.py",
    "schema.py",
    "profile.py",
    "planner.py",
    "indexer.py",
    "utils.py",
    "questionnaire.json",
    "config.json",
]


def _api_get(endpoint: str) -> dict:
    url = f"{API_BASE}/{endpoint}"
    try:
        req = urllib.request.Request(
            url,
            headers={"Accept": "application/json", "User-Agent": "howtocook-update/1.0"},
        )
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"API 请求失败: {url} — {exc}") from exc


def _download_file(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "howtocook-update/1.0"})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            content = resp.read()
        dest.write_bytes(content)
        return True
    except Exception as exc:
        logger.warning("下载失败 %s: %s", url, exc)
        return False


def _load_state() -> dict:
    if not STATE_PATH.exists():
        return {}
    with open(STATE_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save_state(version: str, files_updated: int) -> None:
    state = {
        "last_check": datetime.now(timezone.utc).isoformat(),
        "skill_version": version,
        "files_updated": files_updated,
    }
    tmp = STATE_PATH.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    tmp.replace(STATE_PATH)


def should_check() -> bool:
    """检查是否超过自动更新间隔。"""
    state = _load_state()
    last = state.get("last_check", "")
    if not last:
        return True
    elapsed = datetime.now(timezone.utc) - datetime.fromisoformat(last)
    return elapsed > timedelta(days=_AUTO_UPDATE_INTERVAL_DAYS)


def auto_update_if_needed(silent: bool = False) -> None:
    """符合条件时静默检查更新。失败时静默跳过。"""
    if not should_check():
        return
    try:
        result = cmd_update(dry_run=False, quiet=silent)
        if not silent:
            if result > 0:
                print(f"[Skill 更新] 已更新 {result} 个文件")
            else:
                print("[Skill 更新] 已是最新 ✓")
    except RuntimeError as exc:
        logger.warning("[Skill 更新] 检查失败: %s", exc)


def cmd_status() -> None:
    state = _load_state()
    if not state:
        print("尚未检查过更新（无 .update-state.json）")
        return
    print(f"上次检查: {state.get('last_check', '?')}")
    print(f"Skill 版本: {state.get('skill_version', '?')}")
    print(f"更新文件数: {state.get('files_updated', '?')}")


def cmd_update(dry_run: bool = False, quiet: bool = False, force: bool = False) -> int:
    """检查并更新。返回更新的文件数。"""
    _out = (lambda *args, **kwargs: None) if quiet else (lambda *args, **kwargs: print(*args, flush=True))

    _out("检查 skill 更新...")

    # 1. 获取远程版本
    try:
        version_data = _api_get("version")
    except RuntimeError:
        _out("  API 不可达，跳过更新")
        return 0

    remote_version = version_data.get("skill_version", "")
    if not remote_version:
        _out("  远程无 skill_version 字段，跳过")
        return 0

    # 2. 比对本地版本
    state = _load_state()
    local_version = state.get("skill_version", "")
    if not force and local_version == remote_version:
        _out(f"  版本一致（{remote_version}），无需更新")
        return 0

    _out(f"  发现新版本: {local_version or '(无)'} → {remote_version}")

    if dry_run:
        _out("  [dry-run] 不执行更新")
        return 0

    # 3. 下载更新文件
    updated = 0
    for filename in UPDATABLE_FILES:
        url = f"{GITHUB_RAW}/{filename}"
        dest = SCRIPT_DIR / filename
        if _download_file(url, dest):
            updated += 1
            _out(f"  ✓ {filename}")

    _out(f"  更新完成: {updated}/{len(UPDATABLE_FILES)} 个文件")

    # 4. 保存状态
    _save_state(remote_version, updated)
    return updated


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(description="HowToCook Skill 自更新")
    parser.add_argument("--check", action="store_true", help="仅检查，不更新")
    parser.add_argument("--force", action="store_true", help="强制更新")
    parser.add_argument("--dry-run", action="store_true", help="显示会做什么")
    parser.add_argument("--status", action="store_true", help="显示当前状态")
    args = parser.parse_args()

    if args.status:
        cmd_status()
    elif args.check:
        try:
            data = _api_get("version")
            remote_v = data.get("skill_version", "?")
            local_v = _load_state().get("skill_version", "?")
            print(f"本地版本: {local_v}")
            print(f"远程版本: {remote_v}")
            if local_v == remote_v:
                print("已是最新 ✓")
            else:
                print("有可用更新")
        except RuntimeError as exc:
            print(f"检查失败: {exc}", file=sys.stderr)
            sys.exit(1)
    else:
        try:
            cmd_update(dry_run=args.dry_run, force=args.force)
        except RuntimeError as exc:
            print(f"更新失败: {exc}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
