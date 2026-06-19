import pytest
from parser import parse_recipe, format_recipe


SAMPLE_RECIPE = """# 番茄炒蛋的做法

简单快手的家常菜

**预估烹饪难度**：★☆☆☆☆

## 必备原料和工具

- 鸡蛋 3 个
- 番茄 2 个
- 盐 适量
- 糖 少许

## 可选原料

- 葱花

## 计算

每人份

## 操作步骤

1. 鸡蛋打散加盐
2. 番茄切块
3. 热锅凉油，炒蛋盛出
4. 炒番茄出汁，加蛋翻炒

## 附加

- 番茄先炒出汁口感更好
"""


class TestParseRecipe:
    def test_name(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert recipe["name"] == "番茄炒蛋"

    def test_difficulty(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert recipe["difficulty"] == 1

    def test_introduction(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert "简单快手" in recipe["introduction"]

    def test_ingredients(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert len(recipe["ingredients"]) == 4
        assert "鸡蛋 3 个" in recipe["ingredients"]

    def test_optional_ingredients(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert "葱花" in recipe["optional_ingredients"]

    def test_steps(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert len(recipe["steps"]) == 4
        assert "鸡蛋打散加盐" in recipe["steps"][0]

    def test_tips(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        assert len(recipe["tips"]) == 1

    def test_empty_content(self):
        recipe = parse_recipe("")
        assert recipe["name"] == ""
        assert recipe["ingredients"] == []


class TestFormatRecipe:
    def test_roundtrip(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe)
        assert "番茄炒蛋" in output
        assert "鸡蛋" in output
        assert "操作步骤" in output

    def test_with_source(self):
        recipe = parse_recipe(SAMPLE_RECIPE)
        output = format_recipe(recipe, source="howtocook")
        assert "howtocook" in output
