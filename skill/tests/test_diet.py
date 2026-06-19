"""diet 模块测试 — auto_detect + overrides + 集成"""

import json
import pytest
from diet.auto_detect import detect_diet, DietLevel
from diet.overrides import load_overrides, set_override, remove_override, OVERRIDES_PATH
from diet import get_diet, DietResult


class TestAutoDetect:
    """auto_detect.py 核心逻辑测试"""

    # ── 肉类检测 ──

    def test_pork(self):
        r = detect_diet("红烧肉", ["五花肉", "酱油", "糖"])
        assert r.level == DietLevel.NONE

    def test_chicken(self):
        r = detect_diet("宫保鸡丁", ["鸡胸肉", "花生", "辣椒"])
        assert r.level == DietLevel.NONE

    def test_seafood(self):
        r = detect_diet("白灼虾", ["虾", "姜", "葱"])
        assert r.level == DietLevel.NONE

    def test_fish(self):
        r = detect_diet("清蒸鲈鱼", ["鲈鱼", "葱", "姜"])
        assert r.level == DietLevel.NONE

    def test_organ_meat(self):
        r = detect_diet("爆炒腰花", ["猪腰", "蒜", "姜"])
        assert r.level == DietLevel.NONE

    def test_processed_meat(self):
        r = detect_diet("腊肉饭", ["腊肉", "米饭", "青菜"])
        assert r.level == DietLevel.NONE

    def test_stock_broth(self):
        r = detect_diet("鸡汤面", ["面条", "鸡汤", "葱花"])
        assert r.level == DietLevel.NONE

    # ── 调味名排除 ──

    def test_fish_flavor_no_fish(self):
        r = detect_diet("鱼香肉丝", ["猪肉", "木耳", "辣椒"])
        assert r.level == DietLevel.NONE  # 有猪肉

    def test_fish_flavor_vegetarian(self):
        r = detect_diet("鱼香土豆泥", ["土豆", "泡椒酱", "葱油"])
        assert r.level == DietLevel.VEGAN

    def test_mock_meat_vegetarian(self):
        r = detect_diet("素鸡炒青椒", ["素鸡", "青椒", "盐"])
        assert r.level == DietLevel.VEGAN

    def test_cinnamon_not_meat(self):
        r = detect_diet("肉桂茶", ["肉桂", "红糖"])
        assert r.level == DietLevel.VEGAN

    # ── 调味料排除 ──

    def test_chicken_powder_not_meat(self):
        r = detect_diet("香辣土豆丝", ["土豆", "鸡粉", "盐"])
        assert r.level == DietLevel.VEGAN

    def test_chicken_essence_not_meat(self):
        r = detect_diet("葱煎豆腐", ["豆腐", "葱", "鸡精"])
        assert r.level == DietLevel.VEGAN

    def test_dried_shrimp_seasoning(self):
        r = detect_diet("炒青菜", ["青菜", "虾皮", "盐"])
        assert r.level == DietLevel.VEGAN

    # ── 蛋奶检测 ──

    def test_egg_dish(self):
        r = detect_diet("番茄炒蛋", ["番茄", "鸡蛋", "盐"])
        assert r.level == DietLevel.LACTO_OVO
        assert "蛋奶素" in r.tags

    def test_preserved_egg(self):
        r = detect_diet("皮蛋豆腐", ["皮蛋", "豆腐", "酱油"])
        assert r.level == DietLevel.LACTO_OVO

    def test_dairy(self):
        r = detect_diet("奶油蘑菇汤", ["蘑菇", "奶油", "面粉"])
        assert r.level == DietLevel.LACTO_OVO

    def test_cheese(self):
        r = detect_diet("芝士焗饭", ["米饭", "芝士", "黄油"])
        assert r.level == DietLevel.LACTO_OVO

    # ── 纯素 ──

    def test_vegan_simple(self):
        r = detect_diet("炒青菜", ["青菜", "盐", "油"])
        assert r.level == DietLevel.VEGAN
        assert "素食" in r.tags

    def test_vegan_tofu(self):
        r = detect_diet("麻婆豆腐", ["豆腐", "豆瓣酱", "花椒"])
        assert r.level == DietLevel.VEGAN

    def test_vegan_noodle(self):
        r = detect_diet("凉拌黄瓜", ["黄瓜", "蒜", "醋"])
        assert r.level == DietLevel.VEGAN

    # ── Confidence ──

    def test_confidence_meat(self):
        r = detect_diet("红烧肉", ["五花肉"])
        assert r.confidence == 0.9

    def test_confidence_egg_dairy(self):
        r = detect_diet("蛋炒饭", ["鸡蛋", "米饭"])
        assert r.confidence == 0.8

    def test_confidence_vegan(self):
        r = detect_diet("炒青菜", ["青菜", "盐"])
        assert r.confidence == 0.7


class TestOverrides:
    """overrides.py 读写测试"""

    def setup_method(self):
        """测试前清空 overrides"""
        if OVERRIDES_PATH.exists():
            OVERRIDES_PATH.unlink()

    def teardown_method(self):
        """测试后清空 overrides"""
        if OVERRIDES_PATH.exists():
            OVERRIDES_PATH.unlink()

    def test_load_empty(self):
        assert load_overrides() == {}

    def test_set_and_load(self):
        set_override("howtocook/红烧肉", ["素食"], "vegan", "test")
        data = load_overrides()
        assert "howtocook/红烧肉" in data
        assert data["howtocook/红烧肉"]["tags"] == ["素食"]

    def test_remove(self):
        set_override("test_dish", ["素食"], "vegan")
        assert remove_override("test_dish") is True
        assert load_overrides() == {}

    def test_remove_nonexistent(self):
        assert remove_override("nonexistent") is False

    def test_persistence(self):
        set_override("test_dish", ["蛋奶素"], "lacto_ovo", "test reason")
        # 重新加载验证持久化
        data = load_overrides()
        assert data["test_dish"]["level"] == "lacto_ovo"
        assert data["test_dish"]["reason"] == "test reason"


class TestDietIntegration:
    """diet 模块集成测试（get_diet 入口）"""

    def setup_method(self):
        if OVERRIDES_PATH.exists():
            OVERRIDES_PATH.unlink()

    def teardown_method(self):
        if OVERRIDES_PATH.exists():
            OVERRIDES_PATH.unlink()

    def test_auto_detect(self):
        r = get_diet("炒青菜", ["青菜", "盐"])
        assert r.source == "auto"
        assert r.level == DietLevel.VEGAN

    def test_override_priority(self):
        set_override("howtocook/炒青菜", ["蛋奶素"], "lacto_ovo", "test")
        r = get_diet("炒青菜", ["青菜", "盐"], "howtocook/炒青菜")
        assert r.source == "override"
        assert r.level == DietLevel.LACTO_OVO
        assert r.confidence == 1.0

    def test_no_override_falls_back_to_auto(self):
        r = get_diet("炒青菜", ["青菜", "盐"], "nonexistent_id")
        assert r.source == "auto"

    def test_diet_result_frozen(self):
        r = get_diet("炒青菜", ["青菜", "盐"])
        with pytest.raises(AttributeError):
            r.tags = ["changed"]


class TestSchemaIntegration:
    """schema.py 集成测试"""

    def test_detect_diet_returns_tags(self):
        from schema import _detect_diet
        tags = _detect_diet("炒青菜", ["青菜", "盐"])
        assert isinstance(tags, list)
        assert "素食" in tags

    def test_detect_diet_egg(self):
        from schema import _detect_diet
        tags = _detect_diet("番茄炒蛋", ["番茄", "鸡蛋"])
        assert "蛋奶素" in tags

    def test_detect_diet_meat(self):
        from schema import _detect_diet
        tags = _detect_diet("红烧肉", ["五花肉"])
        assert tags == []

    def test_extract_tags_diet(self):
        from schema import extract_tags
        dish = {"name": "炒青菜", "ingredients": ["青菜", "盐"]}
        tags = extract_tags(dish)
        assert "素食" in tags["diet"]

    def test_detect_diet_detail(self):
        from schema import detect_diet_detail
        r = detect_diet_detail("炒青菜", ["青菜", "盐"])
        assert isinstance(r, DietResult)
        assert r.level == DietLevel.VEGAN
