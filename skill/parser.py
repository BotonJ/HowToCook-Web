#!/usr/bin/env python3
"""HowToCook Recipe Parser — 从 .md 菜谱文件中提取结构化数据"""

import logging
import re
import sys
from typing import Optional

from utils import skill_path, parse_difficulty, render_stars

logger = logging.getLogger(__name__)


def read_recipe_file(path: str) -> Optional[dict]:
    try:
        abs_path = skill_path(path)
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return parse_recipe(content)
    except Exception as e:
        logger.warning("读取失败 %s: %s", abs_path, e)
        return None


def parse_recipe(content: str) -> dict:
    result = {
        "name": "",
        "difficulty": 3,
        "introduction": "",
        "ingredients": [],
        "optional_ingredients": [],
        "calculations": "",
        "steps": [],
        "tips": [],
    }

    lines = content.split('\n')
    current_section = None

    for line in lines:
        stripped = line.strip()

        title_match = re.match(r'^#\s+(.+?)的做法', stripped)
        if title_match:
            result["name"] = title_match.group(1)
            continue

        if '预估烹饪难度' in stripped:
            result["difficulty"] = parse_difficulty(stripped)
            continue

        if result["name"] and not result["introduction"]:
            if not stripped.startswith('#') and stripped and not stripped.startswith('!['):
                if '预估烹饪难度' not in stripped:
                    result["introduction"] = stripped
                    continue

        if stripped.startswith('##'):
            section = stripped[2:].strip()
            if '必备原料' in section:
                current_section = 'ingredients'
            elif '可选原料' in section:
                current_section = 'optional'
            elif '计算' in section:
                current_section = 'calculations'
            elif '操作' in section:
                current_section = 'steps'
            elif '附加' in section:
                current_section = 'tips'
            else:
                current_section = None
            continue

        if current_section in ('ingredients', 'optional'):
            ingredient = ""
            if stripped.startswith('- '):
                ingredient = stripped[2:].strip()
            elif stripped.startswith('* '):
                ingredient = stripped[2:].strip()
            if ingredient:
                if current_section == 'ingredients':
                    result["ingredients"].append(ingredient)
                else:
                    result["optional_ingredients"].append(ingredient)
            continue

        if current_section == 'steps':
            step_match = re.match(r'^\d+[.、]\s*(.+)', stripped)
            if step_match:
                result["steps"].append(step_match.group(1))
            continue

        if current_section == 'tips' and stripped.startswith('- '):
            tip = stripped[2:].strip()
            if tip:
                result["tips"].append(tip)
            continue

    return result


def format_recipe(recipe: dict, source: str = "", dish_id: str = "") -> str:
    stars = render_stars(recipe["difficulty"])

    output = [
        f"# {recipe['name']}的做法 {stars}\n",
        "---",
    ]

    if recipe["introduction"]:
        intro = recipe["introduction"]
        if "如果您遵循本指南的制作流程" not in intro:
            output.append(f"\n{intro}\n")

    output.append(f"\n**预估烹饪难度**：{'★' * recipe['difficulty']}{'☆' * (5 - recipe['difficulty'])}\n")

    if recipe["ingredients"]:
        output.append("\n## 必备原料和工具\n")
        for ing in recipe["ingredients"]:
            output.append(f"- {ing}\n")

    if recipe["optional_ingredients"]:
        output.append("\n### 可选原料\n")
        for ing in recipe["optional_ingredients"]:
            output.append(f"- {ing}\n")

    if recipe["steps"]:
        output.append("\n## 操作步骤\n")
        for i, step in enumerate(recipe["steps"], 1):
            output.append(f"{i}. {step}\n")

    if recipe["tips"]:
        output.append("\n## 小贴士\n")
        for tip in recipe["tips"]:
            if "如果您遵循本指南的制作流程" in tip:
                continue
            output.append(f"- {tip}\n")

    if dish_id:
        url = f"https://howtocook.cn/recipe/{dish_id}"
        output.append(f"\n---\n👉 {url}\n")

    if source:
        output.append(f"*数据来源：{source}*\n")

    return "".join(output)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) > 1:
        recipe = read_recipe_file(sys.argv[1])
        if recipe:
            print(format_recipe(recipe))
    else:
        print("用法: python parser.py <菜谱文件路径>")
