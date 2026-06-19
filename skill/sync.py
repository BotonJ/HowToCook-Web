#!/usr/bin/env python3
"""HowToCook 本地同步脚本 — 从远程 Worker 拉取菜谱数据并合并到本地 index.json。"""

import argparse
import json
import logging
import os
import sys
import tempfile
from datetime import datetime, timezone, timedelta

from http_client import api_get, ApiError, API_BASE  # noqa: F401 — API_BASE re-exported

logger = logging.getLogger(__name__)

# 自动同步间隔（天）
AUTO_SYNC_INTERVAL_DAYS = 7

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(SCRIPT_DIR, "index.json")
STATE_PATH = os.path.join(SCRIPT_DIR, ".sync-state.json")

# sync 拉 /sync 全量索引，需要比 mcp_tools 单条查询更大的上限与超时。
_SYNC_TIMEOUT = 30
_SYNC_MAX_RESPONSE_SIZE = 50 * 1024 * 1024  # 50 MB
_SYNC_USER_AGENT = "howtocook-sync/1.0"


class SyncError(Exception):
    """Raised when a sync operation fails."""


# ── helpers ──────────────────────────────────────────────────────────────


def _api_get(endpoint: str) -> dict:
    """GET JSON from remote API. Raises SyncError on failure.

    Delegates to the shared :func:`http_client.api_get` with sync-specific
    limits (50 MB cap, 30 s timeout) and translates :class:`ApiError` into
    :class:`SyncError` so callers see a single exception type.
    """
    path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
    logger.info("连接远程: %s%s", API_BASE, path)
    try:
        return api_get(
            path,
            timeout=_SYNC_TIMEOUT,
            max_response_size=_SYNC_MAX_RESPONSE_SIZE,
            user_agent=_SYNC_USER_AGENT,
        )
    except ApiError as exc:
        raise SyncError(str(exc)) from exc


def _load_local_index() -> dict:
    """Load local index.json. Returns empty structure if missing."""
    if not os.path.exists(INDEX_PATH):
        logger.info("本地 index.json 不存在，将创建新文件")
        return {
            "version": "2.0",
            "total": 0,
            "sources": ["howtocook"],
            "dishes": [],
        }
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_state() -> dict:
    """Load .sync-state.json. Returns empty dict if missing."""
    if not os.path.exists(STATE_PATH):
        return {}
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _atomic_write_json(path: str, data: object) -> None:
    fd, tmp = tempfile.mkstemp(suffix=".tmp", dir=SCRIPT_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _save_state(checksum: str, count: int) -> None:
    state = {
        "last_sync": datetime.now(timezone.utc).isoformat(),
        "last_checksum": checksum,
        "recipe_count": count,
    }
    _atomic_write_json(STATE_PATH, state)


_REQUIRED_DISH_FIELDS = {"name", "category", "source", "difficulty"}


def should_sync() -> bool:
    """检查是否超过 AUTO_SYNC_INTERVAL_DAYS 未同步。"""
    state = _load_state()
    last_sync = state.get("last_sync", "")
    if not last_sync:
        return True
    last_time = datetime.fromisoformat(last_sync)
    elapsed = datetime.now(timezone.utc) - last_time
    return elapsed > timedelta(days=AUTO_SYNC_INTERVAL_DAYS)


def auto_sync_if_needed(silent: bool = False) -> None:
    """符合条件时静默同步，不符合则直接返回。失败时静默跳过。"""
    if not should_sync():
        return
    try:
        added, updated, unchanged = cmd_sync(quiet=silent)
        if not silent:
            if added == 0 and updated == 0:
                print("[检查菜谱资源] 数据已是最新 ✓")
            else:
                print(f"[检查菜谱资源] 发现 {added + updated} 个更新，已拉取 json")
    except SyncError as exc:
        logger.warning("[检查菜谱资源] 同步失败: %s", exc)


# 与 API (/sync 返回的 search:index 条目) 对齐的核心契约字段。
# 必需字段：缺则拒绝该条目（防止坏数据污染本地 index）。
# 参考 howtocook-api/src/lib/validate.ts 的 isDishIndex。
_REQUIRED_DISH_FIELDS = {"name", "category", "source", "difficulty"}
# 类型契约：键 -> 期望 Python 类型。与 API 类型约束一一对应。
_DISH_FIELD_TYPES: dict[str, type] = {
    "name": str,
    "category": str,
    "source": str,
    "difficulty": int,
    "cuisine": str,
    "cooking_method": str,
    "cook_time": str,
    "ingredients": list,
    "main_ingredients": list,
}


def _validate_dish(dish: dict) -> bool:
    if not isinstance(dish, dict):
        return False
    if not _REQUIRED_DISH_FIELDS.issubset(dish):
        return False
    # 类型校验（与 API isDishIndex 对齐）：任一必需字段类型不符即拒绝
    for field, expected in _DISH_FIELD_TYPES.items():
        value = dish.get(field)
        if value is None:
            continue  # 非必需字段缺失允许（向后兼容本地旧数据）
        if field in _REQUIRED_DISH_FIELDS and not isinstance(value, expected):
            return False
    if not isinstance(dish["name"], str) or not dish["name"]:
        return False
    path = dish.get("path", "")
    if path and (".." in path or path.startswith("/")):
        return False
    # 无 canonical id 的旧数据会退化为按 name 合并（见 _dish_key），可能与
    # 跨 source 同名菜冲突。告警以便上游补 id，但不拒绝（向后兼容）。
    if not dish.get("id"):
        logger.warning("菜谱缺少 canonical id，将按 name 合并: %s", dish.get("name"))
    return True


def _dish_key(dish: dict) -> str:
    """Return a stable merge key for a dish.

    Prefer canonical `id` (source/name) so duplicates across sources are not
    collapsed during sync. Fall back to name for legacy data without ids.
    """
    return dish.get("id") or dish.get("name") or ""


def _strip_local_path(dish: dict) -> dict:
    """Drop any local `dishes/...md` path reference from a dish.

    The skill fetches recipe details via API at runtime; a residual local
    `path` is a dangling reference that only existed for the legacy
    markdown reader. Strip it from every dish that flows through sync so
    the distributed index never points at files the user does not have.
    """
    if "path" not in dish:
        # Remote dishes carry no path; stamp an explicit empty string so the
        # distributed index keeps a stable schema (path always present, blank).
        return {**dish, "path": ""}
    result = {**dish}
    result["path"] = ""
    return result


def _merge(local: dict, remote_dishes: list[dict]) -> tuple[dict, int, int, int, int]:
    """Merge remote dishes into local index by canonical id.

    - Remote has, local missing  -> add (path="", has_duplicate=False)
    - Both have                  -> update with remote fields, carry over
                                    has_duplicate; path is always blanked
                                    (runtime reads via API, never local md)
    - Local has, remote missing  -> keep as-is, but blank its stale local path
    """
    local_by_key: dict[str, dict] = {_dish_key(d): d for d in local["dishes"]}
    remote_keys: set[str] = set()
    added, updated, unchanged = 0, 0, 0

    merged: list[dict] = []
    for rd in remote_dishes:
        rd = _strip_local_path(rd)
        key = _dish_key(rd)
        remote_keys.add(key)
        if key in local_by_key:
            existing = local_by_key[key]
            merged_entry = {**rd, "has_duplicate": existing.get("has_duplicate", False)}
            if merged_entry != existing:
                updated += 1
            else:
                unchanged += 1
            merged.append(merged_entry)
        else:
            merged.append({**rd, "has_duplicate": False})
            added += 1

    local_only = 0
    for d in local["dishes"]:
        if _dish_key(d) not in remote_keys:
            merged.append(_strip_local_path(d))
            local_only += 1

    result = {**local, "dishes": merged, "total": len(merged)}
    return result, added, updated, unchanged, local_only


# ── commands ─────────────────────────────────────────────────────────────


def cmd_status() -> None:
    state = _load_state()
    if not state:
        print("尚未同步过（无 .sync-state.json）")
        return
    print(f"上次同步: {state.get('last_sync', '?')}")
    print(f"Checksum: {state.get('last_checksum', '?')}")
    print(f"菜谱数量: {state.get('recipe_count', '?')}")


def cmd_sync(force: bool = False, dry_run: bool = False, quiet: bool = False) -> tuple[int, int, int]:
    """返回 (added, updated, unchanged)。quiet=True 时抑制所有内部输出。"""
    label = "[dry-run] " if dry_run else ""
    _out = (lambda *args, **kwargs: None) if quiet else (lambda *args, **kwargs: print(*args, flush=True))

    _out(f"{label}开始同步...")

    _out("步骤 1/4: 获取远程版本信息")
    version = _api_get("version")
    remote_checksum = version.get("checksum", "")
    remote_total = version.get("total", 0)
    _out(f"  远程版本: {version.get('version')} | 菜谱: {remote_total} | checksum: {remote_checksum[:16]}...")

    _out("步骤 2/4: 比较 checksum")
    state = _load_state()
    local_checksum = state.get("last_checksum", "")
    if not force and local_checksum == remote_checksum:
        _out(f"  checksum 一致（{remote_checksum[:16]}...），无需同步。使用 --force 强制同步。")
        return (0, 0, 0)
    if force:
        _out("  --force 模式，跳过 checksum 比较")
    else:
        _out(f"  checksum 不同: {local_checksum[:16] if local_checksum else '(无)'}... -> {remote_checksum[:16]}...")

    _out("步骤 3/4: 拉取远程数据并合并")
    sync_data = _api_get("sync")
    remote_dishes = [d for d in sync_data.get("dishes", []) if _validate_dish(d)]
    _out(f"  远程菜谱数: {len(remote_dishes)}（已校验）")

    local = _load_local_index()
    merged, added, updated, unchanged, local_only = _merge(local, remote_dishes)

    _out(f"  合并结果: 新增 {added} | 更新 {updated} | 不变 {unchanged} | 本地保留 {local_only} | 总计 {merged['total']}")

    if dry_run:
        _out(f"{label}同步完成（未写入文件）")
        return (added, updated, unchanged)

    _out("步骤 4/4: 写入文件")
    _atomic_write_json(INDEX_PATH, merged)
    _out(f"  已写入 {INDEX_PATH}")
    _save_state(remote_checksum, merged["total"])
    _out(f"  已写入 {STATE_PATH}")
    _out("同步完成。")
    return (added, updated, unchanged)


# ── CLI ──────────────────────────────────────────────────────────────────


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(
        description="HowToCook 本地同步脚本 — 从远程 Worker 拉取菜谱数据并合并到本地 index.json"
    )
    parser.add_argument("--force", action="store_true", help="强制同步（忽略 checksum 比较）")
    parser.add_argument("--dry-run", action="store_true", help="只显示会做什么，不实际写入")
    parser.add_argument("--status", action="store_true", help="显示当前同步状态")
    args = parser.parse_args()

    try:
        if args.status:
            cmd_status()
        else:
            cmd_sync(force=args.force, dry_run=args.dry_run)
    except SyncError as exc:
        print(f"同步失败: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
