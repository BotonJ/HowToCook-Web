#!/usr/bin/env python3
"""HowToCook 问卷渲染器 — 纯文本降级方案"""

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def _load_questionnaire() -> dict:
    p = Path(__file__).parent / "questionnaire.json"
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def render_question(step: dict, index: int, total: int) -> str:
    lines = [f"第{index}题/{total}：{step['question']}"]

    for i, opt in enumerate(step["options"], 1):
        lines.append(f"  {i}. {opt['label']}")

    if step.get("none_option"):
        lines.append(f"  0. {step['none_option']}")

    if step["type"] == "multi_select":
        lines.append("可多选，用逗号分隔，如 1,3")
    else:
        lines.append("回复编号即可")

    return "\n".join(lines)


def render_all_questions() -> list[dict]:
    q = _load_questionnaire()
    steps = q["steps"]
    total = len(steps)
    return [
        {"question": render_question(s, i + 1, total), "step": s}
        for i, s in enumerate(steps)
    ]


def parse_answer(step: dict, user_input: str) -> Optional[object]:
    text = user_input.strip()
    options = step["options"]
    none_option = step.get("none_option")
    is_multi = step["type"] == "multi_select"

    if none_option and text in ("0", "无", "都没有", "都能吃", "没有"):
        return [] if is_multi else none_option

    try:
        indices = [int(x.strip()) for x in text.replace("，", ",").split(",")]
    except ValueError:
        return _match_label(options, text, is_multi)

    if is_multi:
        result = []
        for idx in indices:
            if idx == 0 and none_option:
                return []
            if 1 <= idx <= len(options):
                result.append(options[idx - 1]["value"])
        return result if result else None
    else:
        idx = indices[0]
        if 1 <= idx <= len(options):
            return options[idx - 1]["value"]
        return None


def _match_label(options: list[dict], text: str, is_multi: bool) -> Optional[object]:
    text_lower = text.lower()
    for opt in options:
        label_clean = opt["label"].split("（")[0].lower()
        if text_lower == label_clean or str(opt["value"]).lower() == text_lower:
            return [opt["value"]] if is_multi else opt["value"]

    if is_multi:
        parts = [p.strip() for p in text.replace("，", ",").replace("、", ",").split(",")]
        result = []
        for part in parts:
            matched = False
            for opt in options:
                label_clean = opt["label"].split("（")[0].lower()
                if part.lower() == label_clean or str(opt["value"]).lower() == part.lower():
                    result.append(opt["value"])
                    matched = True
                    break
            if not matched:
                return None
        return result if result else None

    return None


def render_welcome() -> str:
    q = _load_questionnaire()
    return (
        f"🍽️ {q['title']}\n"
        f"{q['description']}\n"
        f"共 {len(q['steps'])} 题，回复编号即可。准备好了吗？（回复任意内容开始）"
    )


def render_done(answers: dict) -> str:
    allergens = answers.get("allergens", [])
    diet = answers.get("diet", [])
    cuisine = answers.get("cuisine", [])
    spicy_map = {0.0: "不吃辣", 0.3: "微辣", 0.7: "挺能吃辣", 1.0: "越辣越好"}
    cook_time_map = {
        "quick": "快手菜", "medium": "常规", "long": "硬菜",
    }
    disliked = answers.get("disliked", [])

    lines = ["✅ 偏好设置完成！总结："]

    if allergens:
        lines.append(f"  过敏：{', '.join(allergens)}")
    if diet:
        lines.append(f"  饮食：{', '.join(diet)}")
    if cuisine:
        lines.append(f"  偏好菜系：{', '.join(cuisine)}")
    lines.append(f"  辣度：{spicy_map.get(answers.get('spicy'), '随缘')}")
    lines.append(f"  做饭风格：{cook_time_map.get(answers.get('cook_time'), '随缘')}")
    if disliked:
        lines.append(f"  不吃：{', '.join(disliked)}")

    lines.append("\n之后随使用会自动学习口味，随时可以说\"设置口味偏好\"重新设置。")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.stdout.reconfigure(encoding="utf-8")

    rendered = render_all_questions()
    print(render_welcome())
    print("---")

    answers: dict = {}
    for item in rendered:
        print(f"\n{item['question']}")
        user = input("> ")
        result = parse_answer(item["step"], user)
        step_type = item["step"]["type"]
        if step_type == "multi_select" and result is None:
            result = []
        answers[item["step"]["id"]] = result
        print(f"  → 解析结果: {result}")

    print(f"\n{render_done(answers)}")
