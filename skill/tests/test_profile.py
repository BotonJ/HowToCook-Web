"""Tests for profile.py — user profile loading, saving, scoring, constraints."""

import json
import pytest
from unittest.mock import patch
from datetime import datetime, timedelta

from profile import (
    blank_profile,
    create_from_answers,
    load_profile,
    save_profile,
    record_action,
    apply_decay,
    score_dish,
    filter_by_constraints,
    _clamp,
    ACTION_WEIGHTS,
    DECAY_FACTOR,
)


# ── Fixtures ──────────────────────────────────────────────────────────


@pytest.fixture
def sample_profile():
    return blank_profile()


@pytest.fixture
def initialized_profile():
    return create_from_answers({
        "allergens": ["花生"],
        "diet": ["素食"],
        "cuisine": ["川菜", "粤菜"],
        "spicy": 0.7,
        "cook_time": "quick",
        "disliked": ["香菜"],
    })


@pytest.fixture
def sample_dish():
    return {
        "name": "麻婆豆腐",
        "cuisine": "川菜",
        "cooking_method": "炖煮",
        "cook_time": "medium",
        "difficulty": 3,
        "main_ingredients": ["豆腐"],
        "ingredients": ["豆腐", "豆瓣酱", "花椒"],
        "tags": {"spicy": True, "allergens": ["大豆"], "diet": ["素食"]},
    }


# ── blank_profile ────────────────────────────────────────────────────


class TestBlankProfile:
    def test_has_required_fields(self):
        p = blank_profile()
        for field in ("version", "constraints", "preferences", "history"):
            assert field in p

    def test_version_is_1_0(self):
        assert blank_profile()["version"] == "1.0"

    def test_initialized_false(self):
        assert blank_profile()["initialized"] is False

    def test_empty_constraints(self):
        p = blank_profile()
        assert p["constraints"]["allergens"] == []
        assert p["constraints"]["diet"] == []
        assert p["constraints"]["disliked_ingredients"] == []

    def test_default_difficulty_scores(self):
        p = blank_profile()
        for d in range(1, 6):
            assert p["preferences"]["difficulty"][str(d)] == 0.5

    def test_default_spicy(self):
        assert blank_profile()["preferences"]["spicy"] == 0.5


# ── create_from_answers ──────────────────────────────────────────────


class TestCreateFromAnswers:
    def test_sets_allergens(self, initialized_profile):
        assert initialized_profile["constraints"]["allergens"] == ["花生"]

    def test_sets_diet(self, initialized_profile):
        assert initialized_profile["constraints"]["diet"] == ["素食"]

    def test_sets_disliked(self, initialized_profile):
        assert initialized_profile["constraints"]["disliked_ingredients"] == ["香菜"]

    def test_sets_cuisine_preferences(self, initialized_profile):
        prefs = initialized_profile["preferences"]["cuisine"]
        assert prefs["川菜"] == 0.8
        assert prefs["粤菜"] == 0.8

    def test_sets_spicy(self, initialized_profile):
        assert initialized_profile["preferences"]["spicy"] == 0.7

    def test_sets_cook_time(self, initialized_profile):
        assert initialized_profile["preferences"]["cook_time"]["quick"] == 0.8

    def test_marks_initialized(self, initialized_profile):
        assert initialized_profile["initialized"] is True

    def test_empty_answers(self):
        p = create_from_answers({})
        assert p["constraints"]["allergens"] == []
        assert p["initialized"] is True


# ── load_profile ─────────────────────────────────────────────────────


class TestLoadProfile:
    def test_missing_file_returns_none(self, tmp_path):
        with patch("profile.profile_path", return_value=tmp_path / "nope.json"):
            assert load_profile() is None

    def test_valid_json(self, tmp_path, sample_profile):
        p = tmp_path / "profile.json"
        p.write_text(json.dumps(sample_profile, ensure_ascii=False), encoding="utf-8")
        with patch("profile.profile_path", return_value=p):
            result = load_profile()
            assert result is not None
            assert result["version"] == "1.0"

    def test_invalid_json_returns_none(self, tmp_path):
        p = tmp_path / "profile.json"
        p.write_text("not json", encoding="utf-8")
        with patch("profile.profile_path", return_value=p):
            assert load_profile() is None

    def test_missing_fields_returns_none(self, tmp_path):
        p = tmp_path / "profile.json"
        p.write_text(json.dumps({"version": "1.0"}), encoding="utf-8")
        with patch("profile.profile_path", return_value=p):
            assert load_profile() is None

    def test_wrong_version_still_loads(self, tmp_path, sample_profile):
        sample_profile["version"] = "99.0"
        p = tmp_path / "profile.json"
        p.write_text(json.dumps(sample_profile, ensure_ascii=False), encoding="utf-8")
        with patch("profile.profile_path", return_value=p):
            result = load_profile()
            assert result is not None


# ── save_profile ─────────────────────────────────────────────────────


class TestSaveProfile:
    def test_saves_json(self, tmp_path, sample_profile):
        target = tmp_path / "profile.json"
        with patch("profile.profile_path", return_value=target):
            save_profile(sample_profile)
        data = json.loads(target.read_text(encoding="utf-8"))
        assert data["version"] == "1.0"
        assert "updated" in data

    def test_preserves_data(self, tmp_path, initialized_profile):
        target = tmp_path / "profile.json"
        with patch("profile.profile_path", return_value=target):
            save_profile(initialized_profile)
        data = json.loads(target.read_text(encoding="utf-8"))
        assert data["constraints"]["allergens"] == ["花生"]


# ── record_action ────────────────────────────────────────────────────


class TestRecordAction:
    def test_cooked_increases_cuisine(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "cooked")
        assert result["preferences"]["cuisine"]["川菜"] > 0.5

    def test_dislike_decreases(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "dislike")
        assert result["preferences"]["cuisine"]["川菜"] < 0.5

    def test_unknown_action_no_change(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "unknown_action")
        assert result is sample_profile  # identity, no change

    def test_adds_history(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "cooked")
        assert len(result["history"]) == 1
        assert result["history"][0]["dish"] == "麻婆豆腐"
        assert result["history"][0]["action"] == "cooked"

    def test_does_not_mutate_input(self, sample_profile, sample_dish):
        original_cuisine = sample_profile["preferences"].get("cuisine", {})
        record_action(sample_profile, sample_dish, "cooked")
        # sample_profile should remain unchanged
        assert sample_profile["preferences"].get("cuisine", {}) == original_cuisine

    def test_spicy_dish_adjusts_spicy_pref(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "cooked")
        assert result["preferences"]["spicy"] != sample_profile["preferences"]["spicy"]

    def test_history_capped_at_200(self, sample_profile, sample_dish):
        profile = sample_profile
        for _ in range(210):
            profile = record_action(profile, sample_dish, "cooked")
        assert len(profile["history"]) == 200

    def test_difficulty_adjustment(self, sample_profile, sample_dish):
        result = record_action(sample_profile, sample_dish, "cooked")
        assert result["preferences"]["difficulty"]["3"] > 0.5


# ── apply_decay ──────────────────────────────────────────────────────


class TestApplyDecay:
    def test_no_updated_field(self, sample_profile):
        result = apply_decay(sample_profile)
        assert result is sample_profile

    def test_same_day_no_decay(self, sample_profile):
        sample_profile["updated"] = datetime.now().isoformat(timespec="seconds")
        result = apply_decay(sample_profile)
        assert result["preferences"]["spicy"] == sample_profile["preferences"]["spicy"]

    def test_10_days_decayed(self, sample_profile):
        past = datetime.now() - timedelta(days=10)
        sample_profile["updated"] = past.isoformat(timespec="seconds")
        sample_profile["preferences"]["spicy"] = 1.0
        result = apply_decay(sample_profile)
        expected = DECAY_FACTOR ** 10
        assert abs(result["preferences"]["spicy"] - expected) < 0.001

    def test_does_not_mutate(self, sample_profile):
        past = datetime.now() - timedelta(days=5)
        sample_profile["updated"] = past.isoformat(timespec="seconds")
        original_spicy = sample_profile["preferences"]["spicy"]
        apply_decay(sample_profile)
        assert sample_profile["preferences"]["spicy"] == original_spicy


# ── score_dish ───────────────────────────────────────────────────────


class TestScoreDish:
    def test_base_score(self, sample_profile, sample_dish):
        score = score_dish(sample_profile, sample_dish)
        assert 0.0 <= score <= 1.0

    def test_preferred_cuisine_higher(self, sample_profile, sample_dish):
        sample_profile["preferences"]["cuisine"]["川菜"] = 0.9
        score = score_dish(sample_profile, sample_dish)
        assert score > 0.5

    def test_spicy_preference_match(self, sample_profile, sample_dish):
        sample_profile["preferences"]["spicy"] = 0.9
        score = score_dish(sample_profile, sample_dish)
        # spicy dish + high spicy pref = bonus
        assert score > 0.5

    def test_score_clamped(self, sample_profile, sample_dish):
        # Set all preferences very high
        sample_profile["preferences"]["cuisine"]["川菜"] = 1.0
        sample_profile["preferences"]["cooking_method"]["炖煮"] = 1.0
        sample_profile["preferences"]["cook_time"]["medium"] = 1.0
        sample_profile["preferences"]["difficulty"]["3"] = 1.0
        sample_profile["preferences"]["main_ingredients"]["豆腐"] = 1.0
        sample_profile["preferences"]["spicy"] = 1.0
        score = score_dish(sample_profile, sample_dish)
        assert score <= 1.0

    def test_no_preferences_still_works(self, sample_profile, sample_dish):
        sample_profile["preferences"]["cuisine"] = {}
        score = score_dish(sample_profile, sample_dish)
        assert 0.0 <= score <= 1.0


# ── filter_by_constraints ────────────────────────────────────────────


class TestFilterByConstraints:
    def test_filters_allergens(self, initialized_profile):
        dishes = [
            {"name": "花生酱面", "ingredients": ["花生", "面条"], "tags": {"allergens": ["花生", "麸质"]}},
            {"name": "白米饭", "ingredients": ["大米"], "tags": {"allergens": []}},
        ]
        result = filter_by_constraints(initialized_profile, dishes)
        assert len(result) == 1
        assert result[0]["name"] == "白米饭"

    def test_filters_disliked_ingredients(self, initialized_profile):
        dishes = [
            {"name": "香菜拌豆腐", "ingredients": ["香菜", "豆腐"], "tags": {"allergens": []}},
            {"name": "炒青菜", "ingredients": ["青菜"], "tags": {"allergens": []}},
        ]
        result = filter_by_constraints(initialized_profile, dishes)
        assert len(result) == 1
        assert result[0]["name"] == "炒青菜"

    def test_no_constraints_passes_all(self, sample_profile):
        dishes = [
            {"name": "花生面", "ingredients": ["花生"], "tags": {"allergens": ["花生"]}},
        ]
        result = filter_by_constraints(sample_profile, dishes)
        assert len(result) == 1

    def test_empty_dishes(self, initialized_profile):
        assert filter_by_constraints(initialized_profile, []) == []

    def test_no_tags_field(self, sample_profile):
        dishes = [{"name": "某菜", "ingredients": ["盐"]}]
        result = filter_by_constraints(sample_profile, dishes)
        assert len(result) == 1


# ── _clamp ───────────────────────────────────────────────────────────


class TestClamp:
    def test_within_range(self):
        assert _clamp(0.5) == 0.5

    def test_above_max(self):
        assert _clamp(1.5) == 1.0

    def test_below_min(self):
        assert _clamp(-0.5) == 0.0

    def test_custom_bounds(self):
        assert _clamp(5, lo=0, hi=10) == 5
        assert _clamp(15, lo=0, hi=10) == 10
