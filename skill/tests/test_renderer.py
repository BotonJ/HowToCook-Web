"""Tests for renderer.py — questionnaire rendering, answer parsing, welcome/done."""

import pytest

from renderer import (
    render_question,
    parse_answer,
    _match_label,
    render_done,
)


# ── Fixtures ──────────────────────────────────────────────────────────


@pytest.fixture
def single_select_step():
    return {
        "id": "cook_time",
        "question": "你做饭的时间预算？",
        "type": "single_select",
        "options": [
            {"label": "快手菜（15分钟内）", "value": "quick"},
            {"label": "常规（30分钟）", "value": "medium"},
            {"label": "硬菜（1小时+）", "value": "long"},
        ],
    }


@pytest.fixture
def multi_select_step():
    return {
        "id": "allergens",
        "question": "你对哪些食物过敏？",
        "type": "multi_select",
        "options": [
            {"label": "花生", "value": "花生"},
            {"label": "海鲜", "value": "海鲜"},
            {"label": "麸质", "value": "麸质"},
        ],
        "none_option": "都没有",
    }


# ── render_question ──────────────────────────────────────────────────


class TestRenderQuestion:
    def test_basic_render(self, single_select_step):
        result = render_question(single_select_step, 1, 3)
        assert "第1题/3" in result
        assert "你做饭的时间预算" in result
        assert "1. 快手菜" in result
        assert "2. 常规" in result
        assert "3. 硬菜" in result

    def test_multi_select_hints(self, multi_select_step):
        result = render_question(multi_select_step, 2, 3)
        assert "可多选" in result
        assert "逗号" in result

    def test_single_select_hints(self, single_select_step):
        result = render_question(single_select_step, 1, 3)
        assert "回复编号即可" in result

    def test_none_option(self, multi_select_step):
        result = render_question(multi_select_step, 2, 3)
        assert "0. 都没有" in result


# ── parse_answer ─────────────────────────────────────────────────────


class TestParseAnswer:
    def test_single_select_by_number(self, single_select_step):
        assert parse_answer(single_select_step, "1") == "quick"

    def test_single_select_second_option(self, single_select_step):
        assert parse_answer(single_select_step, "2") == "medium"

    def test_single_select_out_of_range(self, single_select_step):
        assert parse_answer(single_select_step, "99") is None

    def test_multi_select_by_numbers(self, multi_select_step):
        result = parse_answer(multi_select_step, "1,2")
        assert "花生" in result
        assert "海鲜" in result

    def test_multi_select_none_option(self, multi_select_step):
        assert parse_answer(multi_select_step, "0") == []

    def test_multi_select_none_text(self, multi_select_step):
        assert parse_answer(multi_select_step, "都没有") == []

    def test_multi_select_chinese_comma(self, multi_select_step):
        result = parse_answer(multi_select_step, "1，3")
        assert "花生" in result
        assert "麸质" in result

    def test_single_by_label(self, single_select_step):
        result = parse_answer(single_select_step, "快手菜")
        assert result == "quick"

    def test_multi_by_label(self, multi_select_step):
        result = parse_answer(multi_select_step, "花生,海鲜")
        assert "花生" in result
        assert "海鲜" in result

    def test_single_invalid_text(self, single_select_step):
        assert parse_answer(single_select_step, "xyz") is None

    def test_multi_partial_invalid(self, multi_select_step):
        # one valid + one invalid = None (all must match)
        result = parse_answer(multi_select_step, "花生,xyz")
        assert result is None


# ── _match_label ─────────────────────────────────────────────────────


class TestMatchLabel:
    def test_exact_label(self, single_select_step):
        result = _match_label(single_select_step["options"], "快手菜", False)
        assert result == "quick"

    def test_value_match(self, single_select_step):
        result = _match_label(single_select_step["options"], "quick", False)
        assert result == "quick"

    def test_label_with_parenthetical(self, single_select_step):
        # "快手菜（15分钟内）" → "快手菜" after split
        result = _match_label(single_select_step["options"], "快手菜", False)
        assert result == "quick"

    def test_no_match(self, single_select_step):
        assert _match_label(single_select_step["options"], "不存在", False) is None

    def test_multi_match(self, multi_select_step):
        result = _match_label(multi_select_step["options"], "花生,海鲜", True)
        assert "花生" in result
        assert "海鲜" in result


# ── render_done ──────────────────────────────────────────────────────


class TestRenderDone:
    def test_basic_output(self):
        answers = {"allergens": [], "diet": [], "cuisine": ["川菜"], "spicy": 0.7, "cook_time": "quick"}
        result = render_done(answers)
        assert "偏好设置完成" in result
        assert "川菜" in result
        assert "挺能吃辣" in result
        assert "快手菜" in result

    def test_allergens_shown(self):
        answers = {"allergens": ["花生"], "diet": [], "cuisine": [], "spicy": 0.0}
        result = render_done(answers)
        assert "花生" in result
        assert "过敏" in result

    def test_diet_shown(self):
        answers = {"allergens": [], "diet": ["素食"], "cuisine": [], "spicy": 0.0}
        result = render_done(answers)
        assert "素食" in result

    def test_disliked_shown(self):
        answers = {"allergens": [], "diet": [], "cuisine": [], "spicy": 0.0, "disliked": ["香菜"]}
        result = render_done(answers)
        assert "香菜" in result
        assert "不吃" in result

    def test_spicy_levels(self):
        for level, label in [(0.0, "不吃辣"), (0.3, "微辣"), (0.7, "挺能吃辣"), (1.0, "越辣越好")]:
            result = render_done({"allergens": [], "diet": [], "cuisine": [], "spicy": level})
            assert label in result

    def test_empty_answers(self):
        result = render_done({})
        assert "偏好设置完成" in result
