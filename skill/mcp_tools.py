#!/usr/bin/env python3
"""HowToCook MCP Tools — HTTP API 封装，供 Claude Code / Hermes 等代理直接调用。"""

import json
import logging
import urllib.error
import urllib.request
from typing import Any, Optional

logger = logging.getLogger(__name__)

API_BASE = "https://api.howtocook.cn"
_TIMEOUT = 15
_MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB


class ApiError(Exception):
    """Raised when the remote API returns an error."""


def _api_get(path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
    """GET JSON from the HowToCook API. Raises ApiError on failure."""
    import urllib.parse
    url = f"{API_BASE}{path}"
    if params:
        query = urllib.parse.urlencode({k: v for k, v in params.items() if v})
        if query:
            url = f"{url}?{query}"
    logger.debug("API request: %s", url)
    try:
        req = urllib.request.Request(
            url,
            headers={"Accept": "application/json", "User-Agent": "howtocook-mcp/1.0"},
        )
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            raw = resp.read(_MAX_RESPONSE_SIZE + 1)
            if len(raw) > _MAX_RESPONSE_SIZE:
                raise ApiError(f"响应过大: {url}")
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ApiError(f"HTTP {exc.code}: {url}") from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"网络错误: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise ApiError(f"JSON 解析错误: {exc}") from exc


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


def get_recipe(recipe_id: str) -> dict[str, Any]:
    """获取菜谱详情。返回菜谱完整数据。"""
    if not recipe_id:
        raise ApiError("recipe_id 不能为空")
    return _api_get(f"/recipe/{recipe_id}")


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


def get_version() -> dict[str, Any]:
    """获取版本信息。返回 {version, recipe_count, checksum, skill_version}。"""
    return _api_get("/version")


def epicure_pair(q: str, k: int = 10) -> dict[str, Any]:
    """食材搭配推荐。返回 {results: [{ingredient, score}], query, total}。"""
    if not q:
        raise ApiError("q 不能为空")
    return _api_get("/epicure/pair", {"q": q, "k": str(k)})


def epicure_substitute(q: str, k: int = 5) -> dict[str, Any]:
    """食材替代建议。返回 {results: [{ingredient, score}], query, total}。"""
    if not q:
        raise ApiError("q 不能为空")
    return _api_get("/epicure/substitute", {"q": q, "k": str(k)})


def epicure_search(q: str, limit: int = 20) -> dict[str, Any]:
    """搜索食材（Epicure 词表）。返回 {results: [string], query, total}。"""
    if not q:
        raise ApiError("q 不能为空")
    return _api_get("/epicure/search", {"q": q, "limit": str(limit)})


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


def tool_version() -> str:
    """MCP tool: 获取版本信息。返回 JSON 字符串。"""
    try:
        result = get_version()
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_epicure_pair(q: str, k: int = 10) -> str:
    """MCP tool: 食材搭配推荐。返回 JSON 字符串。"""
    try:
        result = epicure_pair(q=q, k=k)
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_epicure_substitute(q: str, k: int = 5) -> str:
    """MCP tool: 食材替代建议。返回 JSON 字符串。"""
    try:
        result = epicure_substitute(q=q, k=k)
        return json.dumps(result, ensure_ascii=False)
    except ApiError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)


def tool_epicure_search(q: str, limit: int = 20) -> str:
    """MCP tool: 搜索食材（Epicure 词表）。返回 JSON 字符串。"""
    try:
        result = epicure_search(q=q, limit=limit)
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
        print("  python mcp_tools.py version")
        print("  python mcp_tools.py pair <食材> [k]")
        print("  python mcp_tools.py substitute <食材> [k]")
        print("  python mcp_tools.py epicure-search <关键词> [limit]")
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
    elif cmd == "version":
        print(tool_version())
    elif cmd == "pair":
        if len(sys.argv) < 3:
            print("缺少食材名称", file=sys.stderr)
            sys.exit(1)
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        print(tool_epicure_pair(sys.argv[2], k))
    elif cmd == "substitute":
        if len(sys.argv) < 3:
            print("缺少食材名称", file=sys.stderr)
            sys.exit(1)
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        print(tool_epicure_substitute(sys.argv[2], k))
    elif cmd == "epicure-search":
        if len(sys.argv) < 3:
            print("缺少关键词", file=sys.stderr)
            sys.exit(1)
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        print(tool_epicure_search(sys.argv[2], limit))
    elif cmd == "health":
        ok = check_api_health()
        print(json.dumps({"healthy": ok}))
    else:
        print(f"未知命令: {cmd}", file=sys.stderr)
        sys.exit(1)
