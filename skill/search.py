#!/usr/bin/env python3
"""HowToCook Recipe Search Engine — 搜索、筛选、推荐逻辑，集成用户偏好

搜索策略：API 优先，本地 fallback。本地索引 7 天 TTL 缓存。
"""

import json
import logging
import os
import random
import time
import urllib.parse
from pathlib import Path
from typing import Optional

from profile import load_profile, filter_by_constraints, score_dish, apply_decay
from utils import skill_path, render_stars

logger = logging.getLogger(__name__)

_synced = False

# ── API-first search with local fallback ────────────────────────────

_LOCAL_INDEX_TTL = 7 * 24 * 3600  # 7 days in seconds
_local_index_cache: dict | None = None
_local_index_mtime: float = 0.0


def _load_local_index_cached(index_path: str | None = None) -> dict:
    """Load local index.json, cached by file mtime.

    Cache key is the file's mtime: when ``index.json`` is rewritten (e.g. by
    sync), the cache is invalidated automatically. The TTL only bounds how long
    a *stale mtime* (unchanged file) is trusted before re-reading from disk.
    """
    global _local_index_cache, _local_index_mtime

    if index_path is None:
        index_path = str(Path(__file__).parent / "index.json")

    try:
        current_mtime = os.path.getmtime(index_path)
    except OSError:
        return {"dishes": []}

    # Return cached if mtime unchanged and within TTL
    if _local_index_cache is not None and _local_index_mtime == current_mtime:
        age = time.time() - current_mtime
        if age < _LOCAL_INDEX_TTL:
            return _local_index_cache

    try:
        with open(index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _local_index_cache = data
        _local_index_mtime = current_mtime
        return data
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("加载本地索引失败: %s", e)
        if _local_index_cache is not None:
            return _local_index_cache
        return {"dishes": []}


def _search_via_api(
    keyword: str,
    category: str = "",
    cuisine: str = "",
    cooking_method: str = "",
    cook_time: str = "",
    limit: int = 10,
) -> list[dict] | None:
    """Try searching via remote API. Returns None on failure (so caller falls back to local).

    Crucially, an API error response (``{error: ...}``) or a malformed payload is
    treated as failure — NOT as a successful empty result. Otherwise the caller's
    ``if api_results is not None`` check would return ``[]`` and silently discard
    the complete local index (the skill-side equivalent of the 503→20 bug).
    """
    try:
        from mcp_tools import search_recipes

        result = search_recipes(
            q=keyword,
            category=category,
            cuisine=cuisine,
            cooking_method=cooking_method,
            cook_time=cook_time,
            limit=limit,
        )
    except Exception as exc:
        logger.debug("API 搜索失败，降级到本地: %s", exc)
        return None

    if not isinstance(result, dict) or result.get("error"):
        logger.warning("API 搜索返回错误，降级到本地: %s", result.get("error") if isinstance(result, dict) else "非对象响应")
        return None

    results = result.get("results")
    if not isinstance(results, list):
        # 缺少 results 字段视为协议异常，降级而非返回空。
        logger.warning("API 响应缺少 results 字段，降级到本地")
        return None
    return results


def _ensure_synced() -> None:
    """Lazy-init: call auto_sync_if_needed() and auto_update_if_needed() once per process.

    Auto-sync is gated by the ``HOWTOCOOK_AUTO_SYNC`` env var (default ``"1"``).
    Set ``HOWTOCOOK_AUTO_SYNC=0`` to disable the implicit network fetch + file
    write — required for tests, library use, and offline environments. This keeps
    the import/call path free of uncontrolled side effects while preserving the
    end-user auto-refresh behavior.
    """
    global _synced
    if _synced:
        return
    _synced = True
    if os.environ.get("HOWTOCOOK_AUTO_SYNC", "1") != "1":
        logger.debug("自动同步已通过 HOWTOCOOK_AUTO_SYNC=0 禁用")
        return
    from sync import auto_sync_if_needed
    from update import auto_update_if_needed
    auto_sync_if_needed(silent=True)
    auto_update_if_needed(silent=True)


CATEGORY_NAMES = {
    "aquatic": "水产",
    "meat_dish": "荤菜",
    "breakfast": "早餐",
    "dessert": "甜品",
    "soup": "汤粥",
    "drink": "饮品",
    "vegetable_dish": "素菜",
    "staple": "主食",
    "condiment": "酱料",
    "semi-finished": "半成品",
}

TIME_NAMES = {"quick": "快手菜", "medium": "常规", "long": "需要耐心", "slow": "慢工出细活"}


def load_index(index_path: str | None = None) -> dict:
    """Load index: API-first with local fallback. Local uses 7-day mtime cache."""
    _ensure_synced()
    if index_path is None:
        # Try API first for index/version check
        try:
            from mcp_tools import _api_get, ApiError
            version = _api_get("/version")
            remote_total = version.get("total", 0)
            if remote_total > 0:
                # API is available; search_dishes will use API directly
                logger.debug("API 可用，菜谱数: %d", remote_total)
        except Exception:
            logger.debug("API 不可用，使用本地索引")
        return _load_local_index_cached(index_path)
    # Explicit path provided (testing)
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning("加载索引失败: %s", e)
        return {"dishes": []}


def search_dishes(keyword: str, index: dict, limit: int = 10,
                  category: str = "", cuisine: str = "",
                  cooking_method: str = "", cook_time: str = "",
                  use_profile: bool = True) -> list:
    """搜索菜谱。API 优先，失败则本地 fallback。"""
    _ensure_synced()

    # Try API first
    api_results = _search_via_api(
        keyword, category=category, cuisine=cuisine,
        cooking_method=cooking_method, cook_time=cook_time, limit=limit,
    )
    if api_results is not None:
        logger.debug("使用 API 搜索结果: %d 条", len(api_results))
        return api_results

    # Fallback to local search
    keyword_lower = keyword.lower()
    profile = load_profile() if use_profile else None
    candidates = index.get("dishes", [])

    if profile:
        candidates = filter_by_constraints(profile, candidates)

    if category:
        candidates = [d for d in candidates if d.get("category") == category]
    if cuisine:
        candidates = [d for d in candidates if d.get("cuisine") == cuisine]
    if cooking_method:
        candidates = [d for d in candidates if d.get("cooking_method") == cooking_method]
    if cook_time:
        candidates = [d for d in candidates if d.get("cook_time") == cook_time]

    results = []
    for dish in candidates:
        name = dish.get("name", "")
        name_lower = name.lower()
        score = 0.0

        if keyword_lower:
            if keyword_lower == name_lower:
                score = 100
            elif keyword_lower in name_lower:
                score = 80
            elif any(keyword_lower in ing.lower() for ing in dish.get("ingredients", [])):
                score = 60
            elif keyword_lower in dish.get("category", "").lower():
                score = 40
            elif keyword_lower in dish.get("cuisine", "").lower():
                score = 30
            else:
                continue

        if profile:
            pref_score = score_dish(profile, dish)
            score = score + pref_score * 20

        results.append((dish, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return [dish for dish, score in results[:limit]]


def recommend_dish(index: dict, keyword: str = "", source: str = "",
                   category: str = "", limit: int = 3) -> list:
    profile = load_profile()
    candidates = index.get("dishes", [])

    if profile:
        candidates = filter_by_constraints(profile, candidates)

    if source:
        candidates = [d for d in candidates if d.get("source") == source]
    if category:
        candidates = [d for d in candidates if d.get("category") == category]
    if keyword:
        kw_cats = _keyword_to_categories(keyword)
        if kw_cats:
            candidates = [d for d in candidates if d.get("category") in kw_cats]

    if not candidates:
        return []

    if profile:
        profile = apply_decay(profile)
        scored = [(d, score_dish(profile, d)) for d in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)
        top_n = max(limit, len(scored) // 5)
        pool = [d for d, s in scored[:top_n]]
    else:
        pool = candidates

    selected = random.sample(pool, min(limit, len(pool)))
    return selected


def _keyword_to_categories(keyword: str) -> list:
    mapping = {
        "早餐": ["breakfast"], "荤菜": ["meat_dish"], "肉": ["meat_dish"],
        "素菜": ["vegetable_dish"], "水产": ["aquatic"], "海鲜": ["aquatic"],
        "汤": ["soup"], "粥": ["soup"], "主食": ["staple"], "面": ["staple"],
        "甜品": ["dessert"], "甜点": ["dessert"], "饮品": ["drink"], "饮料": ["drink"],
        "酱料": ["condiment"], "调料": ["condiment"], "半成品": ["semi-finished"],
        "快手": [],
    }
    categories = []
    for kw, cats in mapping.items():
        if kw in keyword:
            categories.extend(cats)
    return categories or []


def get_all_categories(index: dict) -> dict:
    categories: dict[str, list] = {}
    for dish in index.get("dishes", []):
        cat = dish.get("category", "other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(dish)
    return categories


def format_search_results(dishes: list) -> str:
    if not dishes:
        return "未找到匹配的菜谱，请尝试其他关键词。"

    output = [f"找到 {len(dishes)} 个匹配结果：\n"]

    for i, dish in enumerate(dishes[:10], 1):
        name = dish.get("name", "未知")
        difficulty = dish.get("difficulty", 3)
        source = dish.get("source", "")
        cuisine = dish.get("cuisine", "")
        method = dish.get("cooking_method", "")
        stars = render_stars(difficulty)

        output.append(f"{i}. **{name}** {stars}")
        meta = []
        if cuisine and cuisine != "家常":
            meta.append(cuisine)
        if method and method != "其他":
            meta.append(method)
        if source:
            meta.append(source)
        if meta:
            output.append(f"   {' | '.join(meta)}")
        # 网站链接
        dish_id = dish.get("id", "")
        if dish_id:
            encoded_id = urllib.parse.quote(dish_id, safe="/")
            url = f"https://howtocook.cn/recipe/{encoded_id}"
            output.append(f"   👉 {url}")
        output.append("")

    if len(dishes) > 10:
        output.append(f"...还有 {len(dishes) - 10} 个结果")

    return "\n".join(output)


def format_recipe_detail(dish: dict) -> str:
    """获取菜谱详情。API 实时查询，不读取本地文件。"""
    from mcp_tools import get_recipe, ApiError

    dish_id = dish.get("id", "")
    if not dish_id:
        return "菜谱 ID 未找到"

    try:
        recipe = get_recipe(dish_id)
    except (ApiError, Exception) as exc:
        logger.debug("API 获取详情失败: %s", exc)
        return f"获取菜谱详情失败: {exc}"

    return _format_api_recipe(recipe)


def _format_api_recipe(recipe: dict) -> str:
    """格式化 API 返回的菜谱详情。"""
    name = recipe.get("name", "未知")
    difficulty = recipe.get("difficulty", 3)
    source = recipe.get("source", "")
    cuisine = recipe.get("cuisine", "")
    method = recipe.get("cooking_method", "")
    dish_id = recipe.get("id", "")

    stars = render_stars(difficulty)
    lines = [f"🍳 {name} {stars}"]

    meta = []
    if cuisine and cuisine != "家常":
        meta.append(f"菜系: {cuisine}")
    if method and method != "其他":
        meta.append(f"烹饪: {method}")
    if source:
        meta.append(f"来源: {source}")
    if meta:
        lines.append(" · ".join(meta))

    # 食材
    ingredients = recipe.get("ingredients", [])
    optional = recipe.get("optional_ingredients", [])
    if ingredients:
        lines.append("")
        lines.append("【食材】")
        lines.append("主料: " + "、".join(ingredients))
    if optional:
        lines.append("可选: " + "、".join(optional))

    # 步骤
    steps = recipe.get("steps", [])
    if steps:
        lines.append("")
        lines.append("【步骤】")
        for i, step in enumerate(steps, 1):
            lines.append(f"{i}. {step}")

    # 提示
    tips = recipe.get("tips", [])
    if tips:
        lines.append("")
        lines.append("【提示】")
        for tip in tips:
            lines.append(f"- {tip}")

    # 网站链接
    if dish_id:
        encoded_id = urllib.parse.quote(dish_id, safe="/")
        url = f"https://howtocook.cn/recipe/{encoded_id}"
        lines.append("")
        lines.append(f"👉 {url}")

    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) < 2:
        print("用法: python search.py <关键词> [--recommend] [--source 数据源] [--category 分类] [--no-profile]")
        sys.exit(1)

    keyword = sys.argv[1]
    recommend = "--recommend" in sys.argv
    source = ""
    category = ""
    use_profile = "--no-profile" not in sys.argv

    for arg in sys.argv:
        if arg.startswith("--source="):
            source = arg.split("=")[1]
        if arg.startswith("--category="):
            category = arg.split("=")[1]

    index = load_index()

    if recommend:
        results = recommend_dish(index, keyword, source, category)
    else:
        results = search_dishes(keyword, index, category=category, use_profile=use_profile)

    print(format_search_results(results))
