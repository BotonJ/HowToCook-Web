#!/usr/bin/env python3
"""HowToCook User Profile — 偏好管理，单用户 JSON 文件存储"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DECAY_FACTOR = 0.95
ACTION_WEIGHTS = {
    "cooked": 0.10,
    "favorite": 0.07,
    "viewed": 0.02,
    "skipped": -0.03,
    "dislike": -0.15,
}


def profile_path() -> Path:
    return Path(__file__).parent / "profile.json"


_REQUIRED_FIELDS = ("version", "constraints", "preferences", "history")
_CURRENT_VERSION = "1.0"


def load_profile() -> Optional[dict]:
    p = profile_path()
    if not p.exists():
        return None
    try:
        with open(p, "r", encoding="utf-8") as f:
            profile = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("profile.json 读取失败: %s", e)
        return None

    missing = [f for f in _REQUIRED_FIELDS if f not in profile]
    if missing:
        logger.warning("profile.json 缺少字段: %s", missing)
        return None

    version = profile.get("version")
    if version != _CURRENT_VERSION:
        logger.warning(
            "profile.json 版本不匹配: 期望 %s, 实际 %s",
            _CURRENT_VERSION, version,
        )

    return profile


def save_profile(profile: dict) -> None:
    profile = {**profile, "updated": datetime.now().isoformat(timespec="seconds")}
    with open(profile_path(), "w", encoding="utf-8") as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)


def blank_profile() -> dict:
    now = datetime.now().isoformat(timespec="seconds")
    return {
        "version": "1.0",
        "created": now,
        "updated": now,
        "initialized": False,
        "constraints": {
            "allergens": [],
            "diet": [],
            "disliked_ingredients": [],
        },
        "preferences": {
            "cuisine": {},
            "cooking_method": {},
            "cook_time": {},
            "difficulty": {"1": 0.5, "2": 0.5, "3": 0.5, "4": 0.5, "5": 0.5},
            "spicy": 0.5,
            "main_ingredients": {},
        },
        "history": [],
    }


def create_from_answers(answers: dict) -> dict:
    profile = blank_profile()

    profile["constraints"]["allergens"] = answers.get("allergens", [])
    profile["constraints"]["diet"] = answers.get("diet", [])
    profile["constraints"]["disliked_ingredients"] = answers.get("disliked", [])

    prefs = profile["preferences"]
    for cuisine in answers.get("cuisine", []):
        prefs["cuisine"][cuisine] = 0.8

    prefs["spicy"] = answers.get("spicy", 0.5)

    time_pref = answers.get("cook_time", "medium")
    prefs["cook_time"][time_pref] = 0.8

    profile["initialized"] = True
    return profile


def record_action(profile: dict, dish: dict, action: str) -> dict:
    weight = ACTION_WEIGHTS.get(action, 0)
    if weight == 0:
        return profile

    prefs = {**profile["preferences"]}
    profile = {**profile, "preferences": prefs}

    cuisine = dish.get("cuisine", "")
    if cuisine:
        prefs["cuisine"] = {**prefs["cuisine"]}
        prefs["cuisine"][cuisine] = _clamp(prefs["cuisine"].get(cuisine, 0.5) + weight)

    method = dish.get("cooking_method", "")
    if method and method != "其他":
        prefs["cooking_method"] = {**prefs["cooking_method"]}
        prefs["cooking_method"][method] = _clamp(prefs["cooking_method"].get(method, 0.5) + weight)

    ct = dish.get("cook_time", "")
    if ct:
        prefs["cook_time"] = {**prefs["cook_time"]}
        prefs["cook_time"][ct] = _clamp(prefs["cook_time"].get(ct, 0.5) + weight)

    diff = str(dish.get("difficulty", 3))
    if diff in prefs["difficulty"]:
        prefs["difficulty"] = {**prefs["difficulty"]}
        prefs["difficulty"][diff] = _clamp(prefs["difficulty"][diff] + weight)

    prefs["main_ingredients"] = {**prefs["main_ingredients"]}
    for ing in dish.get("main_ingredients", []):
        prefs["main_ingredients"][ing] = _clamp(prefs["main_ingredients"].get(ing, 0.5) + weight * 0.5)

    if dish.get("tags", {}).get("spicy"):
        prefs["spicy"] = _clamp(prefs["spicy"] + weight * 0.3)

    history = list(profile["history"]) + [{
        "dish": dish.get("name", ""),
        "action": action,
        "ts": datetime.now().isoformat(timespec="seconds"),
    }]
    profile = {**profile, "history": history[-200:]}

    return profile


def apply_decay(profile: dict) -> dict:
    updated_str = profile.get("updated", "")
    if not updated_str:
        return profile

    try:
        updated = datetime.fromisoformat(updated_str)
        days = max(0, (datetime.now() - updated).days)
    except (ValueError, TypeError):
        return profile

    if days == 0:
        return profile

    decay = DECAY_FACTOR ** days
    prefs = {**profile["preferences"]}

    for dim in ["cuisine", "cooking_method", "cook_time", "main_ingredients"]:
        prefs[dim] = {k: v * decay for k, v in prefs[dim].items()}

    prefs["spicy"] *= decay
    prefs["difficulty"] = {k: v * decay for k, v in prefs["difficulty"].items()}

    return {**profile, "preferences": prefs}


def score_dish(profile: dict, dish: dict) -> float:
    prefs = profile["preferences"]
    score = 0.5

    cuisine = dish.get("cuisine", "")
    if cuisine in prefs["cuisine"]:
        score += prefs["cuisine"][cuisine] * 0.2

    method = dish.get("cooking_method", "")
    if method in prefs["cooking_method"]:
        score += prefs["cooking_method"][method] * 0.15

    ct = dish.get("cook_time", "")
    if ct in prefs["cook_time"]:
        score += prefs["cook_time"][ct] * 0.15

    diff = str(dish.get("difficulty", 3))
    if diff in prefs["difficulty"]:
        score += prefs["difficulty"][diff] * 0.1

    for ing in dish.get("main_ingredients", []):
        if ing in prefs["main_ingredients"]:
            score += prefs["main_ingredients"][ing] * 0.05

    if dish.get("tags", {}).get("spicy"):
        score += prefs["spicy"] * 0.1
    else:
        score += (1 - prefs["spicy"]) * 0.05

    return _clamp(score)


def filter_by_constraints(profile: dict, dishes: list) -> list:
    constraints = profile.get("constraints", {})
    allergens = set(constraints.get("allergens", []))
    disliked = set(constraints.get("disliked_ingredients", []))

    result = []
    for dish in dishes:
        dish_allergens = set(dish.get("tags", {}).get("allergens", []))
        if allergens and dish_allergens & allergens:
            continue
        ings_text = ",".join(dish.get("ingredients", []))
        if disliked and any(d in ings_text for d in disliked):
            continue
        result.append(dish)

    return result


def _clamp(val: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, val))


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.stdout.reconfigure(encoding="utf-8")

    profile = load_profile()
    if profile:
        print(f"已初始化: {profile['initialized']}")
        print(f"过敏原: {profile['constraints']['allergens']}")
        print(f"菜系偏好: {json.dumps(profile['preferences']['cuisine'], ensure_ascii=False)}")
    else:
        print("尚未初始化偏好，请先完成问卷")
