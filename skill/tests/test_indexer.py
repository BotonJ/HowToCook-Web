"""Tests for indexer.py — category logic, ingredient parsing, dish enrichment."""

import pytest
from pathlib import Path

from indexer import (
    get_category_howtocook,
    get_category_suibian,
    get_category,
    _extract_name_from_content,
    _parse_ingredients,
    _enrich_dish,
    extract_dish_info,
    index_directory,
    SKIP_NAMES,
    SUIBIAN_CATEGORY_MAP,
)


# ── get_category_howtocook ────────────────────────────────────────────


class TestGetCategoryHowtocook:
    def test_meat_dish_dir(self):
        assert get_category_howtocook("dishes/howtocook/meat_dish/红烧肉.md") == "meat_dish"

    def test_vegetable_dish_dir(self):
        assert get_category_howtocook("dishes/howtocook/vegetable_dish/炒青菜.md") == "vegetable_dish"

    def test_soup_dir(self):
        assert get_category_howtocook("dishes/howtocook/soup/番茄蛋汤.md") == "soup"

    def test_drink_dir(self):
        assert get_category_howtocook("dishes/howtocook/drink/柠檬水.md") == "drink"

    def test_dessert_dir(self):
        assert get_category_howtocook("dishes/howtocook/dessert/蛋糕.md") == "dessert"

    def test_breakfast_dir(self):
        assert get_category_howtocook("dishes/howtocook/breakfast/煎蛋.md") == "breakfast"

    def test_aquatic_dir(self):
        assert get_category_howtocook("dishes/howtocook/aquatic/清蒸鱼.md") == "aquatic"

    def test_staple_dir(self):
        assert get_category_howtocook("dishes/howtocook/staple/米饭.md") == "staple"

    def test_condiment_dir(self):
        assert get_category_howtocook("dishes/howtocook/condiment/辣椒油.md") == "condiment"

    def test_semi_finished_dir(self):
        assert get_category_howtocook("dishes/howtocook/semi-finished/肉丸.md") == "semi-finished"

    def test_unknown_dir_returns_other(self):
        assert get_category_howtocook("dishes/howtocook/unknown/某菜.md") == "other"

    def test_flat_path_returns_other(self):
        assert get_category_howtocook("某菜.md") == "other"


# ── get_category_suibian ──────────────────────────────────────────────


class TestGetCategorySuibian:
    def test_mapped_dish(self):
        assert get_category_suibian("宫保鸡丁", "") == "meat_dish"

    def test_aquatic_by_keyword(self):
        assert get_category_suibian("清蒸鲈鱼", "") == "aquatic"

    def test_dessert_by_keyword(self):
        assert get_category_suibian("草莓蛋糕", "") == "dessert"

    def test_soup_by_keyword(self):
        assert get_category_suibian("鸡蛋羹", "") == "soup"

    def test_staple_by_keyword(self):
        assert get_category_suibian("炒面条", "") == "staple"

    def test_drink_by_keyword(self):
        assert get_category_suibian("鸡尾酒", "") == "drink"

    def test_breakfast_by_keyword(self):
        assert get_category_suibian("燕麦吐司", "") == "breakfast"

    def test_vegetable_by_keyword(self):
        assert get_category_suibian("西兰花炒蛋", "") == "vegetable_dish"

    def test_negative_keyword_skips_category(self):
        # "鱼香肉丝" should NOT match aquatic (negative: "鱼香")
        result = get_category_suibian("鱼香肉丝", "")
        assert result != "aquatic"

    def test_unknown_returns_other(self):
        assert get_category_suibian("神秘料理", "") == "other"

    def test_path_text_also_searched(self):
        # text = name + path_str, so path content can match
        assert get_category_suibian("某菜", "recipes/汤/某菜.md") == "soup"


# ── get_category ──────────────────────────────────────────────────────


class TestGetCategory:
    def test_howtocook_uses_dir(self):
        assert get_category("dishes/howtocook/soup/汤.md", "howtocook", "汤") == "soup"

    def test_suibian_uses_name(self):
        assert get_category("", "随便做", "宫保鸡丁") == "meat_dish"

    def test_other_source_uses_name(self):
        assert get_category("", "金谷园", "草莓蛋糕") == "dessert"


# ── _extract_name_from_content ────────────────────────────────────────


class TestExtractNameFromContent:
    def test_standard_header(self):
        assert _extract_name_from_content("# 红烧肉的做法\n\n简介") == "红烧肉"

    def test_no_header(self):
        assert _extract_name_from_content("没有标题的内容") == ""

    def test_empty_content(self):
        assert _extract_name_from_content("") == ""

    def test_header_with_extra_text(self):
        assert _extract_name_from_content("# 麻婆豆腐的做法\n\n辣") == "麻婆豆腐"

    def test_mismatched_header(self):
        # "的做法" is required suffix
        assert _extract_name_from_content("# 红烧肉\n\n简介") == ""


# ── _parse_ingredients ───────────────────────────────────────────────


class TestParseIngredients:
    def test_basic_dash_list(self):
        lines = ["## 必备原料和工具", "- 鸡蛋 3 个", "- 盐 适量"]
        result = _parse_ingredients(lines)
        assert len(result) == 2
        assert "鸡蛋" in result[0]
        assert "盐" in result[1]

    def test_star_list(self):
        lines = ["## 必备原料和工具", "* 番茄 2 个"]
        result = _parse_ingredients(lines)
        assert len(result) == 1
        assert "番茄" in result[0]

    def test_plus_list(self):
        lines = ["## 必备原料和工具", "+ 糖 少许"]
        result = _parse_ingredients(lines)
        assert len(result) == 1
        assert "糖" in result[0]

    def test_skips_non_ingredient_section(self):
        lines = ["## 操作步骤", "- 先炒蛋"]
        assert _parse_ingredients(lines) == []

    def test_optional_ingredients_skipped(self):
        lines = ["## 可选原料", "- 葱花"]
        assert _parse_ingredients(lines) == []

    def test_strips_quantities(self):
        lines = ["## 必备原料和工具", "- 五花肉 500g"]
        result = _parse_ingredients(lines)
        assert "五花肉" in result[0]
        assert "500" not in result[0]

    def test_strips_parenthetical(self):
        lines = ["## 必备原料和工具", "- 豆瓣酱（提味用）"]
        result = _parse_ingredients(lines)
        assert result == ["豆瓣酱"]

    def test_empty_ingredient_skipped(self):
        lines = ["## 必备原料和工具", "- "]
        assert _parse_ingredients(lines) == []

    def test_no_ingredients_section(self):
        lines = ["# 标题", "普通文本"]
        assert _parse_ingredients(lines) == []


# ── _enrich_dish ──────────────────────────────────────────────────────


class TestEnrichDish:
    def test_returns_new_dict(self):
        original = {"name": "麻婆豆腐", "difficulty": 3, "category": "meat_dish",
                     "source": "howtocook", "path": "x.md", "ingredients": ["豆腐", "豆瓣酱"]}
        result = _enrich_dish(original)
        assert result is not original
        assert "cuisine" in result
        assert "cooking_method" in result
        assert "tags" in result

    def test_enriched_has_cuisine(self):
        dish = {"name": "麻婆豆腐", "difficulty": 3, "category": "meat_dish",
                "source": "howtocook", "path": "x.md", "ingredients": ["豆腐", "豆瓣酱"]}
        result = _enrich_dish(dish)
        assert result["cuisine"] == "川菜"

    def test_enriched_has_cook_time(self):
        dish = {"name": "炒蛋", "difficulty": 1, "category": "meat_dish",
                "source": "howtocook", "path": "x.md", "ingredients": ["鸡蛋"]}
        result = _enrich_dish(dish)
        assert result["cook_time"] == "quick"

    def test_preserves_original_fields(self):
        dish = {"name": "蒸鱼", "difficulty": 2, "category": "aquatic",
                "source": "howtocook", "path": "a.md", "ingredients": ["鲈鱼"]}
        result = _enrich_dish(dish)
        assert result["name"] == "蒸鱼"
        assert result["difficulty"] == 2
        assert result["path"] == "a.md"


# ── extract_dish_info ─────────────────────────────────────────────────


class TestExtractDishInfo:
    def test_valid_recipe_file(self, tmp_path):
        md = tmp_path / "红烧肉.md"
        md.write_text(
            "# 红烧肉的做法\n\n经典硬菜\n\n**预估烹饪难度**：★★★☆☆\n\n"
            "## 必备原料和工具\n\n- 五花肉 500g\n- 酱油\n",
            encoding="utf-8",
        )
        result = extract_dish_info(str(md), "howtocook", "meat_dish", tmp_path)
        assert result is not None
        assert result["name"] == "红烧肉"
        assert result["difficulty"] == 3
        assert result["category"] == "meat_dish"

    def test_no_title_returns_none(self, tmp_path):
        md = tmp_path / "无名.md"
        md.write_text("没有标题的文件\n\n一些内容", encoding="utf-8")
        result = extract_dish_info(str(md), "howtocook", "other", tmp_path)
        assert result is None

    def test_enriched_fields_present(self, tmp_path):
        md = tmp_path / "蒸鱼.md"
        md.write_text(
            "# 蒸鱼的做法\n\n清淡\n\n**预估烹饪难度**：★★☆☆☆\n\n"
            "## 必备原料和工具\n\n- 鲈鱼\n- 葱\n- 姜\n",
            encoding="utf-8",
        )
        result = extract_dish_info(str(md), "howtocook", "aquatic", tmp_path)
        assert result is not None
        assert "cuisine" in result
        assert "tags" in result
        assert "main_ingredients" in result


# ── index_directory ───────────────────────────────────────────────────


class TestIndexDirectory:
    def test_empty_directory(self, tmp_path):
        result = index_directory(tmp_path, "howtocook", tmp_path)
        assert result == []

    def test_nonexistent_directory(self, tmp_path):
        missing = tmp_path / "no_such_dir"
        result = index_directory(missing, "howtocook", tmp_path)
        assert result == []

    def test_skips_template_files(self, tmp_path):
        for name in SKIP_NAMES:
            md = tmp_path / f"{name}.md"
            md.write_text("# 某菜的做法\n\n**预估烹饪难度**：★☆☆☆☆\n\n## 必备原料和工具\n\n- 盐\n", encoding="utf-8")
        result = index_directory(tmp_path, "howtocook", tmp_path)
        assert result == []

    def test_indexes_valid_files(self, tmp_path):
        md = tmp_path / "番茄炒蛋.md"
        md.write_text(
            "# 番茄炒蛋的做法\n\n家常\n\n**预估烹饪难度**：★☆☆☆☆\n\n"
            "## 必备原料和工具\n\n- 鸡蛋\n- 番茄\n",
            encoding="utf-8",
        )
        result = index_directory(tmp_path, "howtocook", tmp_path)
        assert len(result) == 1
        assert result[0]["name"] == "番茄炒蛋"

    def test_recurses_subdirectories(self, tmp_path):
        sub = tmp_path / "soup"
        sub.mkdir()
        md = sub / "蛋汤.md"
        md.write_text(
            "# 蛋汤的做法\n\n汤\n\n**预估烹饪难度**：★☆☆☆☆\n\n"
            "## 必备原料和工具\n\n- 鸡蛋\n",
            encoding="utf-8",
        )
        result = index_directory(tmp_path, "howtocook", tmp_path)
        assert len(result) == 1
