"""Tests for planner.py — meal planning, shopping lists, time recommendations."""

import json
import pytest
from unittest.mock import patch

from planner import (
    get_dishes_by_names,
    group_ingredients,
    _is_suibian,
    recommend_by_time_budget,
    generate_weekly_menu,
    generate_shopping_list,
    TIME_PROFILES,
    DEFAULT_TIME_ESTIMATE,
    CATEGORY_POOLS,
)


# ── Fixtures ──────────────────────────────────────────────────────────


SAMPLE_INDEX = {
    "version": "2.0",
    "total": 6,
    "sources": ["howtocook", "随便做"],
    "dishes": [
        {"name": "红烧肉", "difficulty": 3, "category": "meat_dish", "source": "howtocook",
         "ingredients": ["五花肉", "酱油", "冰糖"], "cuisine": "家常"},
        {"name": "麻婆豆腐", "difficulty": 2, "category": "meat_dish", "source": "howtocook",
         "ingredients": ["豆腐", "豆瓣酱", "花椒"], "cuisine": "川菜"},
        {"name": "蒸蛋", "difficulty": 1, "category": "breakfast", "source": "随便做",
         "ingredients": ["鸡蛋", "盐"], "cuisine": "家常"},
        {"name": "番茄蛋汤", "difficulty": 1, "category": "soup", "source": "howtocook",
         "ingredients": ["番茄", "鸡蛋", "盐"], "cuisine": "家常"},
        {"name": "炒青菜", "difficulty": 1, "category": "vegetable_dish", "source": "随便做",
         "ingredients": ["青菜", "蒜", "盐"], "cuisine": "家常"},
        {"name": "米饭", "difficulty": 1, "category": "staple", "source": "howtocook",
         "ingredients": ["大米"], "cuisine": "家常"},
    ],
}


def _mock_load_index():
    return SAMPLE_INDEX


# ── get_dishes_by_names ──────────────────────────────────────────────


class TestGetDishesByNames:
    def test_finds_existing(self):
        result = get_dishes_by_names(["红烧肉", "蒸蛋"], SAMPLE_INDEX)
        assert len(result) == 2
        assert result[0]["name"] == "红烧肉"

    def test_skips_missing(self):
        result = get_dishes_by_names(["不存在的菜"], SAMPLE_INDEX)
        assert result == []

    def test_mixed_existing_and_missing(self):
        result = get_dishes_by_names(["红烧肉", "不存在"], SAMPLE_INDEX)
        assert len(result) == 1

    def test_empty_names(self):
        result = get_dishes_by_names([], SAMPLE_INDEX)
        assert result == []

    def test_preserves_order(self):
        result = get_dishes_by_names(["米饭", "红烧肉"], SAMPLE_INDEX)
        assert [d["name"] for d in result] == ["米饭", "红烧肉"]


# ── _is_suibian ──────────────────────────────────────────────────────


class TestIsSuibian:
    def test_suibian_source(self):
        assert _is_suibian({"source": "随便做"}) is True

    def test_suibian_english(self):
        assert _is_suibian({"source": "suibian"}) is True

    def test_howtocook(self):
        assert _is_suibian({"source": "howtocook"}) is False

    def test_no_source(self):
        assert _is_suibian({}) is False


# ── group_ingredients ────────────────────────────────────────────────


class TestGroupIngredients:
    def test_meat_category(self):
        result = group_ingredients(["五花肉", "鸡腿"])
        assert "肉禽类" in result
        assert "五花肉" in result["肉禽类"]

    def test_vegetable_category(self):
        result = group_ingredients(["青椒", "番茄"])
        assert "蔬菜类" in result

    def test_egg_dairy_category(self):
        # "鸡蛋" matches 肉禽类 first (keyword "鸡"), "牛奶" matches 蛋奶豆制品
        result = group_ingredients(["牛奶", "豆腐"])
        assert "蛋奶豆制品" in result

    def test_seasoning_category(self):
        result = group_ingredients(["盐", "酱油"])
        assert "调料香料" in result

    def test_seafood_category(self):
        result = group_ingredients(["虾", "鲈鱼"])
        assert "水产类" in result

    def test_staple_category(self):
        result = group_ingredients(["面条", "大米"])
        assert "主食粮杂" in result

    def test_empty_ingredients(self):
        result = group_ingredients([])
        assert result == {}

    def test_unknown_goes_to_other(self):
        result = group_ingredients(["神秘调料X"])
        assert "其他" in result

    def test_empty_categories_excluded(self):
        result = group_ingredients(["盐"])
        assert "肉禽类" not in result
        assert "水产类" not in result


# ── recommend_by_time_budget ─────────────────────────────────────────


class TestRecommendByTimeBudget:
    # API 在测试环境默认强制走本地 fallback，保证确定性。
    # planner.recommend_by_time_budget 函数内 `from search import _recommend_via_api`，
    # 故 patch search 命名空间即可。test_api_priority_path 自行覆盖。
    @pytest.fixture(autouse=True)
    def _force_local(self, request):
        if "force_api" in request.keywords:
            yield
            return
        with patch("search._recommend_via_api", return_value=None):
            yield

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_quick_profile(self, mock_idx):
        result = recommend_by_time_budget("快速")
        assert "推荐" in result
        # Quick profile: max_difficulty=2, so only difficulty 1-2 dishes appear
        assert "红烧肉" not in result  # difficulty 3, excluded

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_weekend_profile(self, mock_idx):
        result = recommend_by_time_budget("周末")
        assert "推荐" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_guest_profile(self, mock_idx):
        result = recommend_by_time_budget("请客")
        assert "推荐" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_custom_difficulty(self, mock_idx):
        result = recommend_by_time_budget(custom_difficulty=1)
        assert "推荐" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_category_filter(self, mock_idx):
        result = recommend_by_time_budget(custom_difficulty=5, category="soup")
        assert "番茄蛋汤" in result
        assert "红烧肉" not in result

    @patch("planner.load_index_local")
    def test_no_candidates(self, mock_idx):
        mock_idx.return_value = {"dishes": [{"name": "{菜名}", "difficulty": 5}]}
        result = recommend_by_time_budget("快速")
        assert "没有找到" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_unknown_profile_uses_custom_difficulty(self, mock_idx):
        result = recommend_by_time_budget(profile_key="未知", custom_difficulty=2)
        assert "推荐" in result

    @pytest.mark.force_api
    @patch("search._recommend_via_api")
    def test_api_priority_path(self, mock_api):
        # API 命中：difficulty_max 透传，结果含 time_estimate
        mock_api.return_value = [
            {"name": "快手菜", "difficulty": 1, "category": "vegetable_dish",
             "source": "howtocook", "ingredients": ["番茄"]}
        ]
        result = recommend_by_time_budget("快速")
        assert "快手菜" in result
        # 确认 difficulty_max=2 (快速 profile) 透传给了 API
        mock_api.assert_called_once()
        _, kwargs = mock_api.call_args
        assert kwargs.get("difficulty_max") == 2


# ── generate_weekly_menu ─────────────────────────────────────────────


class TestGenerateWeeklyMenu:
    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_basic_output(self, mock_idx):
        result = generate_weekly_menu(people=2, days=3)
        assert "一周菜单" in result
        assert "2人份" in result
        assert "3天" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_contains_weekdays(self, mock_idx):
        result = generate_weekly_menu(people=1, days=2)
        assert "周一" in result
        assert "周二" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_avoid_list(self, mock_idx):
        result = generate_weekly_menu(people=2, days=1, avoid=["红烧肉"])
        assert "红烧肉" not in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_max_7_days(self, mock_idx):
        result = generate_weekly_menu(people=2, days=10)
        assert "7天" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_contains_shopping_section(self, mock_idx):
        result = generate_weekly_menu(people=2, days=1)
        assert "食材" in result


# ── generate_shopping_list ───────────────────────────────────────────


class TestGenerateShoppingList:
    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_basic_shopping_list(self, mock_idx):
        result = generate_shopping_list(["红烧肉", "番茄蛋汤"])
        assert "购物清单" in result
        assert "红烧肉" in result
        assert "番茄蛋汤" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_unknown_dish(self, mock_idx):
        result = generate_shopping_list(["不存在的菜"])
        assert "未找到" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_ingredients_present(self, mock_idx):
        result = generate_shopping_list(["红烧肉"])
        assert "五花肉" in result

    @patch("planner.load_index_local", side_effect=_mock_load_index)
    def test_empty_names(self, mock_idx):
        result = generate_shopping_list([])
        assert "未找到" in result
