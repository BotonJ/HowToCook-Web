"""Tests for cuisine_map.normalize_dish — 推荐接口预留的唯一挂载点。"""

from cuisine_map import normalize_dish, CUISINE_ZH_MAP, METHOD_ZH_MAP


class TestNormalizeDish:
    def test_chinese_dish_passes_through(self):
        # 中文菜 cuisine 已是中文，无映射表时原样穿过
        dish = {"name": "红烧肉", "cuisine": "家常", "cooking_method": "炖煮",
                "main_ingredients": ["猪肉"]}
        result = normalize_dish(dish)
        assert result["cuisine"] == "家常"
        assert result["cooking_method"] == "炖煮"
        assert result["main_ingredients"] == ["猪肉"]

    def test_english_dish_unmapped_keeps_original(self):
        # 空映射表：英文值原样保留（不 crash，score_dish 得基线 0.5）
        dish = {"name": "Pasta", "cuisine": "italian", "cooking_method": "bake"}
        result = normalize_dish(dish)
        assert result["cuisine"] == "italian"
        assert result["cooking_method"] == "bake"

    def test_english_dish_mapped_replaces(self, monkeypatch):
        # 填映射表后，英文值替换为中文
        monkeypatch.setitem(CUISINE_ZH_MAP, "italian", "西式")
        monkeypatch.setitem(METHOD_ZH_MAP, "bake", "烘焙")
        dish = {"name": "Pasta", "cuisine": "italian", "cooking_method": "bake"}
        result = normalize_dish(dish)
        assert result["cuisine"] == "西式"
        assert result["cooking_method"] == "烘焙"

    def test_partial_mapping(self, monkeypatch):
        # 只映射了 cuisine，method 未命中保留原值
        monkeypatch.setitem(CUISINE_ZH_MAP, "italian", "西式")
        dish = {"name": "Pasta", "cuisine": "italian", "cooking_method": "bake"}
        result = normalize_dish(dish)
        assert result["cuisine"] == "西式"
        assert result["cooking_method"] == "bake"

    def test_does_not_mutate_original(self):
        dish = {"name": "Pasta", "cuisine": "italian", "cooking_method": "bake"}
        original_cuisine = dish["cuisine"]
        normalize_dish(dish)
        assert dish["cuisine"] == original_cuisine  # 原 dict 未变

    def test_empty_fields_safe(self):
        dish = {"name": "X"}
        result = normalize_dish(dish)
        assert result["cuisine"] == ""
        assert result["cooking_method"] == ""
        assert result["main_ingredients"] == []

    def test_preserves_other_fields(self):
        dish = {"name": "Pasta", "difficulty": 3, "tags": {"spicy": False},
                "cuisine": "italian"}
        result = normalize_dish(dish)
        assert result["difficulty"] == 3
        assert result["tags"] == {"spicy": False}
        assert result["name"] == "Pasta"
