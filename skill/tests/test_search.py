"""Tests for search.py — search, recommend, filtering, format, _ensure_synced."""

import json
import pytest
from unittest.mock import patch, MagicMock

from search import (
    search_dishes,
    recommend_dish,
    _keyword_to_categories,
    get_all_categories,
    format_search_results,
    format_recipe_detail,
    load_index,
    _ensure_synced,
    _search_via_api,
)


# ── Fixtures ──────────────────────────────────────────────────────────


SAMPLE_INDEX = {
    "version": "2.0",
    "total": 5,
    "sources": ["howtocook"],
    "dishes": [
        {"id": "howtocook/红烧肉", "name": "红烧肉", "difficulty": 3, "category": "meat_dish",
         "source": "howtocook", "cuisine": "家常", "cooking_method": "炖煮", "cook_time": "medium",
         "ingredients": ["五花肉", "酱油", "冰糖"],
         "tags": {"spicy": False, "allergens": [], "diet": []}},
        {"id": "howtocook/麻婆豆腐", "name": "麻婆豆腐", "difficulty": 2, "category": "meat_dish",
         "source": "howtocook", "cuisine": "川菜", "cooking_method": "炖煮", "cook_time": "quick",
         "ingredients": ["豆腐", "豆瓣酱", "花椒"],
         "tags": {"spicy": True, "allergens": ["大豆"], "diet": ["素食"]}},
        {"id": "howtocook/番茄蛋汤", "name": "番茄蛋汤", "difficulty": 1, "category": "soup",
         "source": "howtocook", "cuisine": "家常", "cooking_method": "炖煮", "cook_time": "quick",
         "ingredients": ["番茄", "鸡蛋"],
         "tags": {"spicy": False, "allergens": ["鸡蛋"], "diet": []}},
        {"id": "howtocook/蒸鱼", "name": "蒸鱼", "difficulty": 2, "category": "aquatic",
         "source": "howtocook", "cuisine": "粤菜", "cooking_method": "蒸", "cook_time": "quick",
         "ingredients": ["鲈鱼", "葱", "姜"],
         "tags": {"spicy": False, "allergens": ["海鲜"], "diet": []}},
        {"id": "随便做/炒青菜", "name": "炒青菜", "difficulty": 1, "category": "vegetable_dish",
         "source": "随便做", "cuisine": "家常", "cooking_method": "炒", "cook_time": "quick",
         "ingredients": ["青菜", "蒜"],
         "tags": {"spicy": False, "allergens": [], "diet": ["素食"]}},
    ],
}


# ── _ensure_synced ───────────────────────────────────────────────────


class TestEnsureSynced:
    @patch("search._synced", False)
    @patch("sync.auto_sync_if_needed")
    def test_calls_sync_once(self, mock_sync):
        import search
        search._synced = False
        with patch.dict("os.environ", {"HOWTOCOOK_AUTO_SYNC": "1"}):
            _ensure_synced()
        mock_sync.assert_called_once_with(silent=True)

    @patch("search._synced", True)
    @patch("sync.auto_sync_if_needed")
    def test_skips_if_already_synced(self, mock_sync):
        import search
        search._synced = True
        _ensure_synced()
        mock_sync.assert_not_called()

    @patch.dict("os.environ", {"HOWTOCOOK_AUTO_SYNC": "0"})
    @patch("sync.auto_sync_if_needed")
    def test_env_flag_disables_sync(self, mock_sync):
        """HOWTOCOOK_AUTO_SYNC=0 must suppress the implicit network sync (H-3)."""
        import search
        search._synced = False
        _ensure_synced()
        mock_sync.assert_not_called()


# ── _search_via_api failure semantics (H-2) ───────────────────────────


class TestSearchViaApiFallback:
    """An API error or malformed response must surface as None so the caller
    falls back to the local index — NOT as a successful empty list."""

    @patch("mcp_tools.search_recipes", return_value={"error": "HTTP 500"})
    def test_api_error_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"results": "not a list"})
    def test_malformed_results_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"total": 0})
    def test_missing_results_key_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"results": [], "total": 0})
    def test_genuine_empty_results_returns_empty_list(self, _mock):
        # A well-formed response with zero matches IS a valid empty list,
        # distinct from a failure. Caller decides whether to fall back.
        assert _search_via_api("不存在的菜") == []

    @patch("mcp_tools.search_recipes", return_value={"results": [{"name": "红烧肉"}], "total": 1})
    def test_valid_results_returned(self, _mock):
        assert _search_via_api("红烧肉") == [{"name": "红烧肉"}]

    @patch("mcp_tools.search_recipes", side_effect=Exception("network down"))
    def test_exception_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None


# ── load_index ───────────────────────────────────────────────────────


class TestLoadIndex:
    @patch("search._ensure_synced")
    def test_loads_valid_json(self, mock_sync, tmp_path):
        idx_file = tmp_path / "index.json"
        idx_file.write_text(json.dumps(SAMPLE_INDEX), encoding="utf-8")
        result = load_index(str(idx_file))
        assert len(result["dishes"]) == 5

    @patch("search._ensure_synced")
    def test_missing_file_returns_empty(self, mock_sync, tmp_path):
        result = load_index(str(tmp_path / "nope.json"))
        assert result["dishes"] == []

    @patch("search._ensure_synced")
    def test_invalid_json_returns_empty(self, mock_sync, tmp_path):
        idx_file = tmp_path / "bad.json"
        idx_file.write_text("not json", encoding="utf-8")
        result = load_index(str(idx_file))
        assert result["dishes"] == []


# ── search_dishes ────────────────────────────────────────────────────


class TestSearchDishes:
    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_exact_name_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("红烧肉", SAMPLE_INDEX, use_profile=False)
        assert len(results) >= 1
        assert results[0]["name"] == "红烧肉"

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_partial_name_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("豆腐", SAMPLE_INDEX, use_profile=False)
        names = [d["name"] for d in results]
        assert "麻婆豆腐" in names

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_ingredient_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("豆瓣酱", SAMPLE_INDEX, use_profile=False)
        names = [d["name"] for d in results]
        assert "麻婆豆腐" in names

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_category_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("soup", SAMPLE_INDEX, use_profile=False)
        names = [d["name"] for d in results]
        assert "番茄蛋汤" in names

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_cuisine_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("川菜", SAMPLE_INDEX, use_profile=False)
        names = [d["name"] for d in results]
        assert "麻婆豆腐" in names

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_no_match(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("不存在", SAMPLE_INDEX, use_profile=False)
        assert results == []

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_empty_keyword(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, use_profile=False)
        assert len(results) == 5  # all dishes returned

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_category_filter(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, category="soup", use_profile=False)
        assert len(results) == 1
        assert results[0]["name"] == "番茄蛋汤"

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_cuisine_filter(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, cuisine="粤菜", use_profile=False)
        assert len(results) == 1
        assert results[0]["name"] == "蒸鱼"

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_cooking_method_filter(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, cooking_method="蒸", use_profile=False)
        assert len(results) == 1
        assert results[0]["name"] == "蒸鱼"

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_cook_time_filter(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, cook_time="medium", use_profile=False)
        assert len(results) == 1
        assert results[0]["name"] == "红烧肉"

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_limit(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("", SAMPLE_INDEX, limit=2, use_profile=False)
        assert len(results) == 2

    @patch("search._search_via_api", return_value=None)
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_ranking_exact_before_partial(self, mock_sync, mock_profile, mock_api):
        results = search_dishes("红烧肉", SAMPLE_INDEX, use_profile=False)
        assert results[0]["name"] == "红烧肉"


# ── recommend_dish ───────────────────────────────────────────────────


class TestRecommendDish:
    @patch("search.load_profile", return_value=None)
    def test_returns_list(self, mock_profile):
        results = recommend_dish(SAMPLE_INDEX)
        assert isinstance(results, list)

    @patch("search.load_profile", return_value=None)
    def test_respects_limit(self, mock_profile):
        results = recommend_dish(SAMPLE_INDEX, limit=2)
        assert len(results) <= 2

    @patch("search.load_profile", return_value=None)
    def test_source_filter(self, mock_profile):
        results = recommend_dish(SAMPLE_INDEX, source="随便做")
        for d in results:
            assert d["source"] == "随便做"

    @patch("search.load_profile", return_value=None)
    def test_category_filter(self, mock_profile):
        results = recommend_dish(SAMPLE_INDEX, category="soup")
        for d in results:
            assert d["category"] == "soup"

    @patch("search.load_profile", return_value=None)
    def test_keyword_to_category(self, mock_profile):
        results = recommend_dish(SAMPLE_INDEX, keyword="肉")
        for d in results:
            assert d["category"] == "meat_dish"

    @patch("search.load_profile", return_value=None)
    def test_no_candidates(self, mock_profile):
        results = recommend_dish({"dishes": []})
        assert results == []

    @patch("search.load_profile", return_value=None)
    @patch("search._recommend_via_api", return_value=None)
    def test_fallback_to_local_when_api_fails(self, mock_api, mock_profile):
        # API 返回 None → 走本地 index
        results = recommend_dish(SAMPLE_INDEX, source="随便做")
        assert isinstance(results, list)
        mock_api.assert_called_once()

    @patch("search.load_profile", return_value=None)
    @patch("cuisine_map.normalize_dish", side_effect=lambda d: d)
    @patch("search._recommend_via_api")
    def test_api_results_pass_through_normalize(self, mock_api, mock_norm, mock_profile):
        # API 命中时，结果必须经过 normalize_dish（唯一挂载点）
        mock_api.return_value = [
            {"name": "Pasta", "category": "staple", "source": "epicurious",
             "cuisine": "italian", "cooking_method": "bake", "difficulty": 2}
        ]
        results = recommend_dish(SAMPLE_INDEX)
        assert mock_norm.called
        assert isinstance(results, list)

    @patch("search.load_profile", return_value=None)
    @patch("search._recommend_via_api")
    def test_api_keyword_category_secondary_filter(self, mock_api, mock_profile):
        # keyword 的 category 映射 API 不认，skill 侧二次过滤
        mock_api.return_value = [
            {"name": "牛排", "category": "meat_dish", "source": "howtocook", "difficulty": 3},
            {"name": "沙拉", "category": "vegetable_dish", "source": "howtocook", "difficulty": 1},
        ]
        results = recommend_dish(SAMPLE_INDEX, keyword="肉")
        for d in results:
            assert d["category"] == "meat_dish"


# ── _keyword_to_categories ───────────────────────────────────────────


class TestKeywordToCategories:
    def test_meat(self):
        assert "meat_dish" in _keyword_to_categories("肉")

    def test_soup(self):
        assert "soup" in _keyword_to_categories("汤")

    def test_breakfast(self):
        assert "breakfast" in _keyword_to_categories("早餐")

    def test_dessert(self):
        assert "dessert" in _keyword_to_categories("甜点")

    def test_no_match(self):
        assert _keyword_to_categories("xyz") == []

    def test_seafood(self):
        assert "aquatic" in _keyword_to_categories("海鲜")

    def test_multiple_keywords(self):
        cats = _keyword_to_categories("肉和汤")
        assert "meat_dish" in cats
        assert "soup" in cats


# ── get_all_categories ───────────────────────────────────────────────


class TestGetAllCategories:
    def test_groups_by_category(self):
        result = get_all_categories(SAMPLE_INDEX)
        assert "meat_dish" in result
        assert "soup" in result
        assert len(result["meat_dish"]) == 2

    def test_empty_index(self):
        result = get_all_categories({"dishes": []})
        assert result == {}

    def test_unknown_category(self):
        idx = {"dishes": [{"name": "x", "category": "weird"}]}
        result = get_all_categories(idx)
        assert "weird" in result


# ── format_search_results (already tested in test_recipe_output.py,
#    adding more coverage for edge cases) ─────────────────────────────


class TestFormatSearchResults:
    def test_single_result(self):
        dishes = [SAMPLE_INDEX["dishes"][0]]
        result = format_search_results(dishes)
        assert "红烧肉" in result
        assert "1." in result

    def test_cuisine_displayed_when_not_homestyle(self):
        dishes = [d for d in SAMPLE_INDEX["dishes"] if d["cuisine"] == "川菜"]
        result = format_search_results(dishes)
        assert "川菜" in result

    def test_homestyle_cuisine_not_shown(self):
        dishes = [d for d in SAMPLE_INDEX["dishes"] if d["cuisine"] == "家常"]
        result = format_search_results(dishes)
        # "家常" should not appear in meta line
        assert "家常" not in result.split("\n")[1] if len(result.split("\n")) > 1 else True

    def test_more_than_10_truncated(self):
        many = [{"name": f"菜{i}", "difficulty": 1, "source": "howtocook",
                 "cuisine": "家常", "cooking_method": "炒", "id": f"howtocook/菜{i}"} for i in range(15)]
        result = format_search_results(many)
        assert "还有 5 个结果" in result


# ── format_recipe_detail ─────────────────────────────────────────────


class TestFormatRecipeDetail:
    def test_missing_id(self):
        # format_recipe_detail 走 API，缺 id 时返回固定提示（不读本地文件）
        result = format_recipe_detail({"id": ""})
        assert "菜谱 ID 未找到" in result

    def test_with_api_recipe(self):
        # 详情来自 API get_recipe；mock 返回结构化菜谱，断网且不碰本地文件
        api_recipe = {
            "id": "howtocook/红烧肉", "name": "红烧肉", "difficulty": 3,
            "source": "howtocook", "cuisine": "家常", "cooking_method": "炖煮",
            "ingredients": ["五花肉", "酱油"], "optional_ingredients": [],
            "steps": ["切块焯水", "炒糖色"], "tips": ["肥而不腻"],
        }
        with patch("mcp_tools.get_recipe", return_value=api_recipe):
            dish = {"id": "howtocook/红烧肉"}
            result = format_recipe_detail(dish)
        assert "红烧肉" in result
        assert "五花肉" in result
        assert "https://howtocook.cn/recipe/howtocook/红烧肉" in result

    def test_api_error_returns_failure_message(self):
        # API 抛错时回退为失败提示，不抛异常给调用方
        from mcp_tools import ApiError
        with patch("mcp_tools.get_recipe", side_effect=ApiError("HTTP 404")):
            result = format_recipe_detail({"id": "howtocook/不存在"})
        assert "获取菜谱详情失败" in result
