#!/usr/bin/env python3
"""HowToCook MCP Tools — HTTP API 封装，供 Claude Code / Hermes 等代理直接调用。"""

import json
import logging
import re
import urllib.parse
from typing import Any, Optional

from http_client import api_get, ApiError  # noqa: F401 — ApiError re-exported for callers/tests

logger = logging.getLogger(__name__)

API_BASE = "https://api.howtocook.cn"  # kept for backward-compat imports
_TIMEOUT = 15
_MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB
_USER_AGENT = "howtocook-mcp/1.0"


def _api_get(path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
    """GET JSON from the HowToCook API. Raises ApiError on failure.

    Thin wrapper over the shared :func:`http_client.api_get`, preserving the
    mcp_tools-specific constraints (5 MB cap, 15 s timeout, mcp user-agent).
    """
    return api_get(
        path,
        params=params,
        timeout=_TIMEOUT,
        max_response_size=_MAX_RESPONSE_SIZE,
        user_agent=_USER_AGENT,
    )


def search_recipes(
    q: str = "",
    category: str = "",
    cuisine: str = "",
    cooking_method: str = "",
    cook_time: str = "",
    limit: int = 20,
) -> dict[str, Any]:
    """搜索菜谱。返回 {results, total, query}。"""
    params: dict[str, str] = {}
    if q:
        params["q"] = q
    if category:
        params["category"] = category
    if cuisine:
        params["cuisine"] = cuisine
    if cooking_method:
        params["cooking_method"] = cooking_method
    if cook_time:
        params["cook_time"] = cook_time
    if limit != 20:
        params["limit"] = str(limit)
    return _api_get("/search", params)


def recommend_recipes(
    source: str = "",
    category: str = "",
    cuisine: str = "",
    cooking_method: str = "",
    cook_time: str = "",
    difficulty_max: int | None = None,
    language: str = "",
    limit: int = 200,
) -> dict[str, Any]:
    """推荐候选集。返回 {results: DishIndex[], total, query}。

    API 只做过滤，返回完整 DishIndex（含 tags/main_ingredients），供 skill
    用本地 profile 打分。difficulty_max 为 1-5 数值上界。
    """
    params: dict[str, str] = {}
    if source:
        params["source"] = source
    if category:
        params["category"] = category
    if cuisine:
        params["cuisine"] = cuisine
    if cooking_method:
        params["cooking_method"] = cooking_method
    if cook_time:
        params["cook_time"] = cook_time
    if difficulty_max is not None:
        params["difficulty_max"] = str(difficulty_max)
    if language:
        params["language"] = language
    if limit != 200:
        params["limit"] = str(limit)
    return _api_get("/recommend", params)


def get_recipe(recipe_id: str) -> dict[str, Any]:
    """获取菜谱详情。返回菜谱完整数据。"""
    if not recipe_id:
        raise ApiError("recipe_id 不能为空")
    # canonical id 形如 source/name，含 "/" 与可能的中文/特殊字符。
    # 校验格式并对路径段编码（保留 source/name 的 "/" 字面分隔），
    # 防止路径操纵与 URL 损坏。worker 端 safeDecode 兼容已编码形式。
    if not re.fullmatch(r"[^/]+/[^/]+", recipe_id):
        raise ApiError(f"recipe_id 格式应为 source/name: {recipe_id!r}")
    encoded = urllib.parse.quote(recipe_id, safe="/")
    return _api_get(f"/recipe/{encoded}")


def get_categories() -> dict[str, Any]:
    """获取分类列表。返回 {categories: [...]}。"""
    return _api_get("/categories")


def check_api_health() -> bool:
    """检查 API 是否可用。"""
    try:
        _api_get("/health")
        return True
    except ApiError:
        return False


# ── MCP tool entry points (structured JSON responses) ────────────────


def tool_search(q: str = "", **filters: str) -> str:
    """MCP tool: 搜索菜谱。返回 JSON 字符串。"""
    try:
        result = search_recipes(q=q, **filters)
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_recipe(recipe_id: str) -> str:
    """MCP tool: 获取菜谱详情。返回 JSON 字符串。"""
    try:
        result = get_recipe(recipe_id)
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_categories() -> str:
    """MCP tool: 获取分类列表。返回 JSON 字符串。"""
    try:
        result = get_categories()
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_recommend(
    source: str = "",
    category: str = "",
    cuisine: str = "",
    cooking_method: str = "",
    cook_time: str = "",
    difficulty_max: int | None = None,
    language: str = "",
    limit: int = 200,
) -> str:
    """MCP tool: 推荐菜谱候选集。返回 JSON 字符串。"""
    try:
        result = recommend_recipes(
            source=source,
            category=category,
            cuisine=cuisine,
            cooking_method=cooking_method,
            cook_time=cook_time,
            difficulty_max=difficulty_max,
            language=language,
            limit=limit,
        )
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if len(sys.argv) < 2:
        print("用法:")
        print("  python mcp_tools.py search <关键词>")
        print("  python mcp_tools.py recipe <id>")
        print("  python mcp_tools.py categories")
        print("  python mcp_tools.py health")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "search":
        q = sys.argv[2] if len(sys.argv) > 2 else ""
        print(tool_search(q))
    elif cmd == "recipe":
        if len(sys.argv) < 3:
            print("缺少 recipe id", file=sys.stderr)
            sys.exit(1)
        print(tool_recipe(sys.argv[2]))
    elif cmd == "categories":
        print(tool_categories())
    elif cmd == "health":
        ok = check_api_health()
        print(json.dumps({"healthy": ok}))
    else:
        print(f"未知命令: {cmd}", file=sys.stderr)
        sys.exit(1)
