import pytest
from schema import (
    extract_cuisine,
    extract_cooking_method,
    extract_cook_time,
    extract_main_ingredients,
    extract_allergens,
    detect_spicy,
    extract_tags,
    _detect_diet,
)


class TestExtractCuisine:
    def test_sichuan_dish(self):
        assert extract_cuisine("麻婆豆腐", ["豆腐", "豆瓣酱"]) == "川菜"

    def test_cantonese_dish(self):
        assert extract_cuisine("白灼虾", ["虾"]) == "粤菜"

    def test_default_to_homestyle(self):
        assert extract_cuisine("炒鸡蛋", ["鸡蛋"]) == "家常"


class TestExtractCookingMethod:
    def test_stir_fry(self):
        assert extract_cooking_method("青椒炒肉", []) == "炒"

    def test_steam(self):
        assert extract_cooking_method("蒸鱼", []) == "蒸"

    def test_bake(self):
        assert extract_cooking_method("烤羊排", []) == "烤"

    def test_default_other(self):
        assert extract_cooking_method("神秘料理", []) == "其他"

    # --- 扩展：汤/粥/烩 ---
    def test_soup(self):
        assert extract_cooking_method("玉米排骨汤", []) == "炖煮"

    def test_congee(self):
        assert extract_cooking_method("皮蛋瘦肉粥", []) == "炖煮"

    def test_braised(self):
        assert extract_cooking_method("梅菜扣肉", []) == "炖煮"

    # --- 扩展：味型菜（审计 P1-4：味型关键词已从"调味"移至"炒"） ---
    def test_sweet_sour(self):
        assert extract_cooking_method("糖醋排骨", []) == "炒"

    def test_curry(self):
        assert extract_cooking_method("咖喱肥牛", []) == "调味"

    def test_garlic(self):
        assert extract_cooking_method("蒜蓉虾", []) == "调味"

    def test_fish_flavor(self):
        assert extract_cooking_method("鱼香肉丝", []) == "炒"

    def test_mapo(self):
        assert extract_cooking_method("麻婆豆腐", []) == "炒"

    def test_kung_pao(self):
        assert extract_cooking_method("宫保鸡丁", []) == "炒"

    # --- 扩展：炸类 ---
    def test_crispy(self):
        assert extract_cooking_method("脆皮豆腐", []) == "煎炸"

    def test_tiger_skin(self):
        assert extract_cooking_method("虎皮青椒", []) == "煎炸"

    def test_candied(self):
        assert extract_cooking_method("拔丝土豆", []) == "调味"

    # --- 扩展：饮品 ---
    def test_cola(self):
        assert extract_cooking_method("可乐鸡翅", []) == "炖煮"

    def test_beer(self):
        assert extract_cooking_method("啤酒鸭", []) == "炖煮"

    # --- 扩展：微波 ---
    def test_microwave(self):
        assert extract_cooking_method("微波炉荷包蛋", []) == "微波"

    # --- 排除词 ---
    def test_b52_not_fried(self):
        assert extract_cooking_method("B52轰炸机", ["甘露咖啡酒", "百利甜酒", "伏特加"]) == "饮品"

    # --- 扩展：ingredients fallback ---
    def test_ingredients_fallback(self):
        assert extract_cooking_method("神秘料理", ["排骨", "炖煮用的玉米"]) == "炖煮"


class TestExtractMainIngredients:
    def test_chicken(self):
        result = extract_main_ingredients(["鸡腿", "酱油", "姜"])
        assert "鸡肉" in result

    def test_multiple_groups(self):
        result = extract_main_ingredients(["鸡蛋", "番茄", "面条"])
        assert "蛋奶" in result
        assert "蔬菜" in result
        assert "主食" in result

    def test_empty(self):
        assert extract_main_ingredients([]) == []

    def test_beverage_ingredient(self):
        result = extract_main_ingredients(["椰奶", "芒果"])
        assert "饮品原料" in result

    def test_condiment_as_main(self):
        result = extract_main_ingredients(["豆瓣酱", "豆腐"])
        assert "调味品" in result

    def test_nuts_dried(self):
        result = extract_main_ingredients(["红枣", "枸杞", "银耳"])
        assert "坚果干货" in result


class TestExtractAllergens:
    def test_seafood(self):
        result = extract_allergens(["虾", "蒜", "姜"])
        assert "海鲜" in result

    def test_peanut(self):
        result = extract_allergens(["花生", "辣椒"])
        assert "花生" in result

    def test_none(self):
        assert extract_allergens(["白菜", "盐"]) == []


class TestDetectSpicy:
    def test_spicy_dish(self):
        assert detect_spicy(["辣椒", "花椒"], "麻辣豆腐") is True

    def test_not_spicy(self):
        assert detect_spicy(["鸡蛋", "盐"], "蒸蛋") is False


class TestExtractTags:
    def test_full_tags(self):
        dish = {
            "name": "麻婆豆腐",
            "ingredients": ["豆腐", "豆瓣酱", "花椒", "辣椒"],
        }
        tags = extract_tags(dish)
        assert tags["spicy"] is True
        assert "大豆" in tags["allergens"]
        assert "素食" in tags["diet"]

    def test_meat_dish_not_vegetarian(self):
        dish = {
            "name": "红烧肉",
            "ingredients": ["五花肉", "酱油", "糖"],
        }
        tags = extract_tags(dish)
        assert "素食" not in tags["diet"]

    def test_seafood_not_vegetarian(self):
        dish = {
            "name": "清蒸鱼",
            "ingredients": ["鲈鱼", "葱", "姜"],
        }
        tags = extract_tags(dish)
        assert "素食" not in tags["diet"]


class TestExtractCookTime:
    def test_difficulty_1_quick(self):
        assert extract_cook_time(1) == "quick"

    def test_difficulty_2_quick(self):
        assert extract_cook_time(2) == "quick"

    def test_difficulty_3_medium(self):
        assert extract_cook_time(3) == "medium"

    def test_difficulty_4_long(self):
        assert extract_cook_time(4) == "long"

    def test_difficulty_5_very_long(self):
        assert extract_cook_time(5) == "very_long"

    def test_unknown_difficulty_defaults(self):
        assert extract_cook_time(99) == "medium"


class TestDetectDiet:
    def test_vegetarian_dish(self):
        assert "素食" in _detect_diet("炒青菜", ["青菜", "盐", "油"])

    def test_meat_dish_not_vegetarian(self):
        assert "素食" not in _detect_diet("红烧肉", ["五花肉", "酱油"])

    def test_fish_not_vegetarian(self):
        assert "素食" not in _detect_diet("清蒸鱼", ["鲈鱼"])

    def test_shrimp_not_vegetarian(self):
        assert "素食" not in _detect_diet("白灼虾", ["虾"])

    def test_tofu_vegetarian(self):
        assert "素食" in _detect_diet("麻婆豆腐", ["豆腐", "豆瓣酱"])

    def test_empty_ingredients_vegetarian(self):
        assert "素食" in _detect_diet("神秘料理", [])

    def test_meat_excludes_not_detected(self):
        # "肉桂" should not trigger meat detection
        assert "素食" in _detect_diet("肉桂茶", ["肉桂", "红糖"])

    def test_meat_in_name_detected(self):
        assert "素食" not in _detect_diet("鸡肉沙拉", ["生菜", "黄瓜"])
