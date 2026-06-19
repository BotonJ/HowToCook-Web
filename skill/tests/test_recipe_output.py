"""Tests for recipe output formatting: URL links, content filtering, ID format."""

import json
import os
from unittest.mock import patch

import pytest

from parser import format_recipe, parse_recipe
from search import format_search_results, format_recipe_detail


# ── Fixtures ──────────────────────────────────────────────────────────


SAMPLE_RECIPE = """# 红烧肉的做法

肥而不腻的经典硬菜

**预估烹饪难度**：★★★☆☆

## 必备原料和工具

- 五花肉 500g
- 酱油
- 冰糖
- 料酒
- 葱
- 姜

## 操作步骤

1. 五花肉切块焯水
2. 炒糖色
3. 加水炖煮 40 分钟

## 附加

- 炒糖色用冰糖效果更好
"""

RECIPE_WITH_UNWANTED_PHRASE = """# 金谷园牛奶醪糟鸡蛋的做法

甜品

**预估烹饪难度**：★☆☆☆☆

## 必备原料和工具

- 牛奶
- 醪糟
- 鸡蛋

## 操作步骤

1. 牛奶加热
2. 加入醪糟和鸡蛋

## 附加

- 好喝
- 如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。
"""


def _make_dish(**overrides):
    """Build a minimal dish dict for format_search_results / format_recipe_detail."""
    base = {
        "id": "howtocook/B52轰炸机",
        "name": "B52轰炸机",
        "difficulty": 3,
        "category": "drink",
        "source": "howtocook",
        "cuisine": "家常",
        "cooking_method": "炸",
        "cook_time": "medium",
        "main_ingredients": [],
        "ingredients": ["甘露咖啡酒", "爱尔兰百利甜酒", "蓝天原味伏特加"],
        "tags": {"spicy": False, "allergens": [], "diet": ["素食"]},
        "has_duplicate": False,
        "path": "dishes/howtocook/drink/B52轰炸机.md",
    }
    base.update(overrides)
    return base


# ── format_recipe: dish_id → website URL ──────────────────────────────


class TestFormatRecipeUrl:
    def test_no_dish_id_no_link(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe)
        assert "howtocook.cn" not in output

    def test_dish_id_produces_link(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe, dish_id="howtocook/红烧肉")
        assert "https://howtocook.cn/recipe/howtocook/红烧肉" in output

    def test_link_with_encoded_id(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe, dish_id="随便做/九转大肠")
        assert "https://howtocook.cn/recipe/随便做/九转大肠" in output

    def test_link_position_after_separator(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe, dish_id="howtocook/红烧肉")
        assert "---\n👉 https://howtocook.cn" in output

    def test_source_label_after_link(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe, source="howtocook", dish_id="howtocook/红烧肉")
        lines = output.strip().split("\n")
        source_line = [l for l in lines if "数据来源" in l][0]
        link_lines = [l for l in lines if "howtocook.cn" in l]
        # source line should come after link line
        assert lines.index(source_line) > lines.index(link_lines[0])


# ── format_recipe: "如果您遵循本指南" filtering ──────────────────────


class TestUnwantedPhraseFilter:
    def test_filtered_from_tips(self):
        recipe = parse_recipe(RECIPE_WITH_UNWANTED_PHRASE)
        output = format_recipe(recipe)
        assert "如果您遵循本指南的制作流程" not in output

    def test_other_tips_preserved(self):
        recipe = parse_recipe(RECIPE_WITH_UNWANTED_PHRASE)
        output = format_recipe(recipe)
        assert "好喝" in output

    def test_filtered_from_introduction(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        recipe["introduction"] = "如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。"
        output = format_recipe(recipe)
        assert "如果您遵循本指南的制作流程" not in output

    def test_normal_introduction_preserved(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe)
        assert "肥而不腻" in output


# ── format_search_results: URL per result ─────────────────────────────


class TestFormatSearchResultsUrl:
    def test_single_result_has_link(self):
        dishes = [_make_dish()]
        output = format_search_results(dishes)
        # H-1: canonical id 的中文部分需百分号编码，保留 source/name 的 "/" 分隔
        assert "https://howtocook.cn/recipe/howtocook/B52%E8%BD%B0%E7%82%B8%E6%9C%BA" in output

    def test_multiple_results_each_have_link(self):
        dishes = [
            _make_dish(id="howtocook/红烧肉", name="红烧肉"),
            _make_dish(id="随便做/回锅肉", name="回锅肉"),
        ]
        output = format_search_results(dishes)
        assert "https://howtocook.cn/recipe/howtocook/%E7%BA%A2%E7%83%A7%E8%82%89" in output
        assert "https://howtocook.cn/recipe/%E9%9A%8F%E4%BE%BF%E5%81%9A/%E5%9B%9E%E9%94%85%E8%82%89" in output

    def test_no_id_no_link(self):
        dishes = [_make_dish(id="")]
        output = format_search_results(dishes)
        assert "howtocook.cn" not in output

    def test_empty_results(self):
        output = format_search_results([])
        assert "未找到" in output


# ── format_recipe_detail: dish_id passed through ──────────────────────


class TestFormatRecipeDetail:
    def test_passes_dish_id_to_format_recipe(self):
        # 详情走 API：mock get_recipe 返回结构化菜谱，断言 id 拼进网站链接
        api_recipe = {
            "id": "howtocook/B52轰炸机", "name": "B52轰炸机", "difficulty": 3,
            "source": "howtocook", "ingredients": [], "optional_ingredients": [],
            "steps": [], "tips": [],
        }
        with patch("mcp_tools.get_recipe", return_value=api_recipe):
            dish = _make_dish(id="howtocook/B52轰炸机")
            output = format_recipe_detail(dish)
        assert "https://howtocook.cn/recipe/howtocook/B52轰炸机" in output

    def test_missing_id(self):
        dish = _make_dish(id="")
        output = format_recipe_detail(dish)
        assert "菜谱 ID 未找到" in output


# ── ID format consistency: index.json vs recipes.json ─────────────────


class TestIdFormatConsistency:
    """Verify both data stores use source/name format."""

    def test_index_json_uses_source_name_format(self):
        index_path = os.path.join(os.path.dirname(__file__), "..", "index.json")
        if not os.path.exists(index_path):
            pytest.skip("index.json not found")

        with open(index_path, "r", encoding="utf-8") as f:
            index = json.load(f)

        for dish in index["dishes"]:
            assert "/" in dish["id"], f"Expected source/name format, got: {dish['id']}"
            source, name = dish["id"].split("/", 1)
            assert source == dish["source"]
            assert name == dish["name"]

    def test_recipes_json_uses_source_name_format(self):
        recipes_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "website", "src", "data", "recipes.json"
        )
        if not os.path.exists(recipes_path):
            pytest.skip("recipes.json not found")

        with open(recipes_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for cat in data:
            for r in cat["recipes"]:
                assert "/" in r["id"], f"Expected source/name format, got: {r['id']}"
                source, name = r["id"].split("/", 1)
                assert source == r["source"], f"id={r['id']} but source={r['source']}"
                # Display name may carry a source disambiguation suffix (e.g. "宫保鸡丁(随便做)")
                # while the canonical id remains "source/宫保鸡丁".
                assert r["name"].startswith(name), f"id={r['id']} but name={r['name']}"
