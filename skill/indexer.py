#!/usr/bin/env python3
"""HowToCook Recipe Indexer — 遍历数据源目录，生成合并的 index.json"""

import json
import logging
import re
from pathlib import Path
from typing import Optional

from schema import (
    extract_cook_time,
    extract_cooking_method,
    extract_cuisine,
    extract_main_ingredients,
    extract_tags,
)
from utils import parse_difficulty, match_by_keywords

logger = logging.getLogger(__name__)


# ─── 分类逻辑 ────────────────────────────────────────────

DIR_CATEGORY_MAP = {
    "meat_dish": "meat_dish",
    "vegetable_dish": "vegetable_dish",
    "breakfast": "breakfast",
    "staple": "staple",
    "soup": "soup",
    "drink": "drink",
    "dessert": "dessert",
    "aquatic": "aquatic",
    "condiment": "condiment",
    "semi-finished": "semi-finished",
    "jinguyuan": "drink",
}

SUIBIAN_CATEGORY_MAP: dict[str, str] = {
    "东坡肘子": "meat_dish", "九转大肠": "meat_dish", "宫保鸡丁": "meat_dish",
    "糖醋里脊": "meat_dish", "辣子鸡": "meat_dish", "滑溜里脊": "meat_dish",
    "烤羊排": "meat_dish", "番茄炖牛腩": "meat_dish", "清炖狮子头": "meat_dish",
    "红烧狮子头": "meat_dish", "葱烧蹄筋": "meat_dish", "椒麻腰花": "meat_dish",
    "油爆双脆": "meat_dish", "抬格子": "meat_dish", "红烧肘子": "meat_dish",
    "锅烧肘子": "meat_dish", "白卤肘子": "meat_dish", "柴把鸡": "meat_dish",
    "油焖鸡": "meat_dish", "剁椒蒸鸡": "meat_dish", "糯香猪手": "meat_dish",
    "熏酱猪蹄": "meat_dish", "三不沾": "meat_dish", "干炸丸子": "meat_dish",
    "万能辣卤": "meat_dish", "黑粉炸鸡（黑暗料理）": "meat_dish",
    "板栗扒白菜": "vegetable_dish", "炝拌菜心": "vegetable_dish",
    "炝炒莲花白": "vegetable_dish", "葱烧腐竹": "vegetable_dish",
    "酸萝卜炒百叶": "vegetable_dish", "酸辣小黄瓜": "vegetable_dish",
    "酸辣豆芽": "vegetable_dish", "醋溜白菜": "vegetable_dish",
    "醋溜木须": "vegetable_dish",
    "家常锅巴": "staple", "洋芋擦擦": "staple", "糗糕": "staple",
    "菜蟒": "staple", "黄金馒头片": "staple",
    "芫爆蛰头": "aquatic",
    "绿豆沙": "dessert",
    "凉拌炸青椒": "vegetable_dish",
    "凉菜合集（浇汁松花蛋、拍黄瓜、捞汁秋葵、老醋花生米）": "vegetable_dish",
    "国宴菜翡翠虾球": "aquatic",
    "东北饭店锅包肉": "meat_dish",
    "团圆十锦": "meat_dish",
    "麻辣香锅": "meat_dish",
    "金谷园牛奶醪糟鸡蛋": "drink",
    "宫保鸡丁豆沙粽": "staple",
    "八宝葫芦鸭": "meat_dish",
    "烧椒猪肝": "meat_dish",
    "鱼骨汆鱼丸": "aquatic",
    "河南蒸菜": "vegetable_dish",
    "剁椒炒鸡蛋": "breakfast",
    "溏心茶叶蛋": "breakfast",
    "酸甜荷包蛋": "breakfast",
    "醋炒蛋": "breakfast",
    "香煎金钱蛋": "breakfast",
    "炸萝卜丸子": "meat_dish",
    "红薯丸子": "dessert",
    "炝锅面": "staple",
    "鸡丝凉面": "staple",
    "糊辣椒拌面": "staple",
    "辣皮子拌面": "staple",
}

CATEGORY_KEYWORDS_POSITIVE: dict[str, list[str]] = {
    "aquatic": ["鱼", "虾", "蟹", "鳝", "鳗", "鲈", "鲤", "鲢", "鲍鱼", "海参"],
    "meat_dish": ["排骨", "肉", "鸡翅", "鸡腿", "牛肉", "羊肉", "猪蹄", "肘子", "香肠", "腊肠", "肥牛"],
    "breakfast": ["早餐", "吐司", "三明治", "燕麦"],
    "dessert": ["蛋糕", "冰淇淋", "布丁", "饼干", "面包", "冰沙", "奶冻", "雪媚娘"],
    "soup": ["汤", "羹"],
    "drink": ["饮料", "奶茶", "咖啡", "果汁", "酒", "鸡尾酒", "莫吉托", "柠檬水"],
    "vegetable_dish": ["蔬菜", "豆腐", "土豆", "茄子", "黄瓜", "白菜", "西兰花", "花菜"],
    "staple": ["饭", "面条", "饺子", "包子", "馒头", "饼", "年糕", "炒面", "捞面", "焖饭"],
    "condiment": ["辣子", "糖浆", "果酱"],
}

CATEGORY_NEGATIVE: dict[str, list[str]] = {
    "aquatic": ["鱼香", "鱼骨"],
    "breakfast": [],
    "soup": ["酸梅汤", "金汤力", "胡辣汤"],
}

SKIP_NAMES = ["交接计划", "standard", "template", "readme", "标准", "模板", "示例"]


def get_category_howtocook(path_str: str) -> str:
    parts = Path(path_str).parts
    for part in parts:
        if part in DIR_CATEGORY_MAP:
            return DIR_CATEGORY_MAP[part]
    return "other"


def get_category_suibian(name: str, path_str: str) -> str:
    if name in SUIBIAN_CATEGORY_MAP:
        return SUIBIAN_CATEGORY_MAP[name]

    text = name + path_str
    return match_by_keywords(text, CATEGORY_KEYWORDS_POSITIVE, CATEGORY_NEGATIVE) or "other"


def get_category(path_str: str, source: str, name: str) -> str:
    if source == "howtocook":
        return get_category_howtocook(path_str)
    return get_category_suibian(name, path_str)


# ─── 菜谱信息提取 ───────────────────────────────────────────

def _extract_name_from_content(content: str) -> str:
    match = re.search(r'^#\s+(.+?)的做法', content, re.MULTILINE)
    return match.group(1) if match else ""


def _parse_ingredients(lines: list[str]) -> list[str]:
    ingredients = []
    in_ingredients = False
    for line in lines:
        stripped = line.strip()
        # Stop collecting at optional ingredients sub-section
        if stripped.startswith('### 可选原料'):
            in_ingredients = False
            continue
        if ('必备原料' in stripped) and ('##' in stripped or stripped.startswith('###')):
            in_ingredients = True
            continue
        if stripped.startswith('##') and not stripped.startswith('###'):
            in_ingredients = False
            continue
        if in_ingredients and (stripped.startswith('- ') or stripped.startswith('* ') or stripped.startswith('+ ')):
            ingredient = stripped[2:].strip()
            ingredient = re.sub(r'\d+[g克ml毫升个只条片块]+.*$', '', ingredient)
            ingredient = re.sub(r'[（(][^）)]*[）)]$', '', ingredient)
            ingredient = re.sub(r'^主料：|^调味料：|^辅料：', '', ingredient)
            if ingredient:
                ingredients.append(ingredient)
    return ingredients


def _enrich_dish(dish: dict) -> dict:
    ings = dish["ingredients"]
    return {
        **dish,
        "cuisine": extract_cuisine(dish["name"], ings),
        "cooking_method": extract_cooking_method(dish["name"], ings),
        "cook_time": extract_cook_time(dish["difficulty"]),
        "main_ingredients": extract_main_ingredients(ings),
        "tags": extract_tags(dish),
    }


def extract_dish_info(file_path: str, source: str, category: str, base_dir: Path, content: Optional[str] = None) -> Optional[dict]:
    try:
        if content is None:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

        rel_path = str(Path(file_path).resolve().relative_to(base_dir.resolve()))
        lines = content.split('\n')
        name = _extract_name_from_content(content)
        if not name:
            return None

        difficulty = 3
        for line in lines:
            if '预估烹饪难度' in line:
                difficulty = parse_difficulty(line)
                break

        dish = {
            "name": name,
            "difficulty": difficulty,
            "category": category,
            "source": source,
            "path": rel_path,
            "ingredients": _parse_ingredients(lines),
        }
        return _enrich_dish(dish)

    except (OSError, UnicodeDecodeError, KeyError) as e:
        logger.warning("处理失败 %s: %s", file_path, e)
        return None


# ─── 目录索引 ─────────────────────────────────────────────────

def index_directory(directory: Path, source: str, base_dir: Path) -> list:
    dishes = []

    if not directory.exists():
        logger.warning("目录不存在: %s", directory)
        return dishes

    md_files = list(directory.rglob("*.md"))
    logger.info("  找到 %d 个 .md 文件", len(md_files))

    for md_file in md_files:
        if any(x in md_file.name for x in SKIP_NAMES):
            continue

        content: Optional[str] = None
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            name = _extract_name_from_content(content) or md_file.stem
        except (OSError, UnicodeDecodeError):
            name = md_file.stem

        category = get_category(str(md_file), source, name)

        dish = extract_dish_info(str(md_file), source, category, base_dir, content)
        if dish:
            dishes.append(dish)

    return dishes


# ─── 主函数 ───────────────────────────────────────────────────

def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    script_dir = Path(__file__).parent
    sources = {
        "howtocook": script_dir / "dishes" / "howtocook",
        "随便做": script_dir / "dishes" / "随便做",
        "金谷园": script_dir / "dishes" / "金谷园",
    }

    all_dishes: list[dict] = []

    logger.info("开始索引菜谱...")

    for source_name, source_path in sources.items():
        logger.info("\n索引数据源: %s", source_name)
        logger.info("路径: %s", source_path)

        if not source_path.exists():
            logger.info("路径不存在，跳过")
            continue

        dishes = index_directory(source_path, source_name, script_dir)
        logger.info("找到 %d 个菜谱", len(dishes))
        all_dishes.extend(dishes)

    seen_names: dict[str, int] = {}
    for dish in all_dishes:
        name = dish["name"]
        seen_names[name] = seen_names.get(name, 0) + 1

    all_dishes = sorted(
        [{**dish, "has_duplicate": seen_names[dish["name"]] > 1} for dish in all_dishes],
        key=lambda x: x.get("name", ""),
    )

    index = {
        "version": "2.0",
        "total": len(all_dishes),
        "sources": list(sources.keys()),
        "dishes": all_dishes,
    }

    index_path = Path(__file__).parent / "index.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    logger.info("\n索引完成！共 %d 个菜谱", len(all_dishes))
    logger.info("索引文件: %s", index_path)

    source_counts: dict[str, int] = {}
    cat_counts: dict[str, int] = {}
    other_dishes: list[str] = []
    no_ingredients: list[str] = []
    for dish in all_dishes:
        src = dish.get("source", "?")
        source_counts[src] = source_counts.get(src, 0) + 1
        cat = dish.get("category", "?")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        if cat == "other":
            other_dishes.append(dish["name"])
        if not dish.get("ingredients"):
            no_ingredients.append(dish["name"])

    logger.info("\n各数据源统计:")
    for src, count in sorted(source_counts.items()):
        logger.info("  %s: %d 道", src, count)

    logger.info("\n各分类统计:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        logger.info("  %s: %d 道", cat, count)

    if other_dishes:
        logger.info("\ncategory=other (%d 道):", len(other_dishes))
        for n in other_dishes:
            logger.info("  %s", n)

    if no_ingredients:
        logger.info("\n缺失食材 (%d 道):", len(no_ingredients))
        for n in no_ingredients:
            logger.info("  %s", n)


if __name__ == "__main__":
    main()