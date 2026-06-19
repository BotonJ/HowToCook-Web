#!/usr/bin/env python3
"""HowToCook Meal Planner — 购物清单 + 时间预算推荐 + 一周菜单生成"""

import logging
import random
import re
import sys
from typing import Optional

from utils import render_stars

logger = logging.getLogger(__name__)

_TEMPLATE_DISH_NAME = "{菜名}"


def _import_deps():
    from search import load_index, search_dishes, recommend_dish
    return load_index, search_dishes, recommend_dish


def load_index_local() -> dict:
    """Load the recipe index, API-first with local fallback.

    Delegates to ``search.load_index()`` so the planner shares the same
    data path as search/recommend: remote version probe, 7-day mtime-cached
    local index, and the ``HOWTOCOOK_AUTO_SYNC`` env gate. The historical
    name is kept for backward compatibility with existing callers/tests.
    """
    from search import load_index
    return load_index()


def get_dishes_by_names(names: list[str], index: dict) -> list[dict]:
    name_map = {d['name']: d for d in index['dishes']}
    return [name_map[name] for name in names if name in name_map]


def get_dish_ingredients(dish: dict, index: dict) -> list[str]:
    return dish.get('ingredients', [])


def group_ingredients(ingredients: list[str]) -> dict[str, list[str]]:
    categories: dict[str, list[str]] = {
        '肉禽类': [], '水产类': [], '蔬菜类': [],
        '蛋奶豆制品': [], '主食粮杂': [], '调料香料': [], '其他': [],
    }

    keywords = {
        '肉禽类': ['肉', '鸡', '鸭', '鹅', '猪', '牛', '羊', '排骨', '肘子', '香肠', '腊肠', '鹌鹑'],
        '水产类': ['鱼', '虾', '蟹', '带鱼', '鲈鱼', '鲤鱼', '鲢鱼', '鲍鱼', '海参', '鳝', '鳗'],
        '蔬菜类': ['菜', '青椒', '辣椒', '土豆', '茄子', '番茄', '西红柿', '黄瓜', '南瓜', '冬瓜', '萝卜', '白菜', '菠菜', '芹菜', '洋葱', '蒜', '姜', '葱', '香菇', '蘑菇', '木耳'],
        '蛋奶豆制品': ['蛋', '鸡蛋', '鹌鹑蛋', '牛奶', '豆腐', '豆浆', '奶', '芝士'],
        '主食粮杂': ['米', '面', '粉', '面条', '饺子', '包子', '面包', '糯米', '淀粉', '面粉'],
        '调料香料': ['盐', '糖', '酱油', '醋', '酒', '花雕', '料酒', '油', '胡椒', '花椒', '大料', '桂皮', '香油', '蚝油', '豆瓣', '辣椒'],
    }

    for ing in ingredients:
        ing_clean = re.sub(r'\d+[g克ml毫升斤两]', '', ing).strip()
        ing_clean = re.sub(r'[^一-鿿\w]', '', ing_clean)

        placed = False
        for cat, kws in keywords.items():
            for kw in kws:
                if kw in ing_clean:
                    categories[cat].append(ing)
                    placed = True
                    break
            if placed:
                break
        if not placed:
            categories['其他'].append(ing)

    return {k: v for k, v in categories.items() if v}


def generate_shopping_list(dish_names: list[str]) -> str:
    index = load_index_local()
    dishes = get_dishes_by_names(dish_names, index)

    if not dishes:
        return f"❌ 未找到以下菜谱：{', '.join(dish_names)}"

    all_ingredients = []
    for dish in dishes:
        all_ingredients.extend(get_dish_ingredients(dish, index))

    grouped = group_ingredients(all_ingredients)

    lines = [f"# 🛒 购物清单（共 {len(dish_names)} 道菜）\n"]
    lines.append(f"**菜谱：** {', '.join(d['name'] for d in dishes)}\n")
    lines.append("---\n")

    for cat, ings in grouped.items():
        lines.append(f"### {cat}\n")
        for ing in sorted(set(ings)):
            lines.append(f"- [ ] {ing}\n")
        lines.append("\n")

    return ''.join(lines)


# ─────────────────────────────────────────
# 时间预算推荐
# ─────────────────────────────────────────

TIME_PROFILES = {
    "快速": {
        "max_difficulty": 2,
        "description": "⏱️ 30分钟内搞定，适合工作日晚餐",
    },
    "周末": {
        "max_difficulty": 4,
        "description": "🛋️ 周末有空，做点有挑战的",
    },
    "请客": {
        "max_difficulty": 5,
        "description": "🍽️ 请客用，要有排面",
    },
}

DEFAULT_TIME_ESTIMATE = {
    1: "10-20分钟", 2: "20-40分钟", 3: "40-80分钟",
    4: "60-120分钟", 5: "90-180分钟+",
}


def _local_candidates_by_difficulty(category: str, max_diff: int) -> list[dict]:
    """本地 fallback：按难度上界过滤，附加 time_estimate。"""
    index = load_index_local()
    candidates = []
    for d in index['dishes']:
        if d['name'] == _TEMPLATE_DISH_NAME:
            continue
        diff = d.get('difficulty', 3)
        if diff <= max_diff:
            if category and d.get('category') != category:
                continue
            candidates.append({**d, 'time_estimate': DEFAULT_TIME_ESTIMATE.get(diff, "未知")})
    return candidates


def recommend_by_time_budget(profile_key: str = "", custom_difficulty: int = 0, category: str = "") -> str:
    if profile_key and profile_key in TIME_PROFILES:
        profile = TIME_PROFILES[profile_key]
        max_diff = profile['max_difficulty']
        hint = profile['description']
    else:
        max_diff = custom_difficulty or 3
        hint = f"⭐ 难度{max_diff}以内"

    # === API 优先（候选覆盖 KV 全量，含英文菜） ===
    from search import _recommend_via_api
    api_results = _recommend_via_api(category=category, difficulty_max=max_diff, limit=200)
    if api_results is not None:
        from cuisine_map import normalize_dish  # 唯一挂载点：英文维度→中文词表
        candidates = [
            {**normalize_dish(d),
             "time_estimate": DEFAULT_TIME_ESTIMATE.get(d.get("difficulty", 3), "未知")}
            for d in api_results if d.get("name") != _TEMPLATE_DISH_NAME
        ]
    else:
        # === 本地 fallback（原逻辑） ===
        candidates = _local_candidates_by_difficulty(category, max_diff)

    if not candidates:
        return "❌ 没有找到符合条件的菜谱"

    selected = random.sample(candidates, min(4, len(candidates)))

    lines = [f"# ⏱️ 推荐：{hint}\n"]
    if profile_key and profile_key in TIME_PROFILES:
        lines.append(f"*{TIME_PROFILES[profile_key]['description']}*\n")
    lines.append(f"找到 {len(candidates)} 道符合条件，随机推荐4道：\n")
    lines.append("---\n")

    for d in selected:
        stars = render_stars(d['difficulty'])
        src_label = '🔵隋卞做' if d.get('source') in ('suibian', '随便做') else '🟢howtocook'
        lines.append(f"**{d['name']}** {stars}\n")
        lines.append(f"  {d.get('time_estimate', '')} | {src_label}\n")
        ings = d.get('ingredients', [])[:4]
        if ings:
            lines.append(f"  主要食材：{', '.join(ings)}\n")
        lines.append("\n")

    lines.append("---\n")
    lines.append(f"*说明：{', '.join(TIME_PROFILES.keys())} 或指定难度如 快速/周末/请客，或说 随便推荐*")

    return ''.join(lines)


# ─────────────────────────────────────────
# 一周菜单生成
# ─────────────────────────────────────────

MEAL_TIMES = ['早餐', '午餐', '晚餐']
CATEGORY_POOLS = {
    '早餐': ['breakfast', 'staple'],
    '午餐': ['meat_dish', 'vegetable_dish', 'staple'],
    '晚餐': ['meat_dish', 'aquatic', 'soup', 'vegetable_dish', 'staple'],
}


def _is_suibian(d: dict) -> bool:
    return d.get('source') in ('suibian', '随便做')


def generate_weekly_menu(people: int = 2, days: int = 7, avoid: list[str] = None) -> str:
    index = load_index_local()
    avoid = avoid or []

    all_dishes = [d for d in index['dishes'] if d['name'] != _TEMPLATE_DISH_NAME]
    avoid_lower = [a.lower() for a in avoid]
    filtered = [d for d in all_dishes if not any(a in d['name'].lower() for a in avoid_lower)]

    def pick(meal_type: str, used_names: set) -> Optional[dict]:
        pools = CATEGORY_POOLS.get(meal_type, CATEGORY_POOLS['午餐'])
        candidates = [d for d in filtered if d.get('category') in pools and d['name'] not in used_names]
        if not candidates:
            return None
        how = [d for d in candidates if not _is_suibian(d)]
        if how:
            return random.choice(how)
        return random.choice(candidates)

    WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    menu = []
    used_names: set[str] = set()

    for day_idx in range(min(days, 7)):
        day_name = WEEKDAYS[day_idx]
        day_menu = [f"### {day_name}\n"]

        for meal in MEAL_TIMES:
            dish = pick(meal, used_names)
            if dish:
                used_names.add(dish['name'])
                stars = '⭐' * dish['difficulty']
                src = '🔵' if _is_suibian(dish) else '🟢'
                day_menu.append(f"**{meal}**：{src}{dish['name']} {stars}\n")
                ings = dish.get('ingredients', [])[:3]
                if ings:
                    day_menu.append(f"  主要：{', '.join(ings)}\n")
            else:
                day_menu.append(f"**{meal}**：🥡外卖 / 自己决定\n")

        menu.append(''.join(day_menu))
        menu.append("\n")

    shop_dishes = [d for d in filtered if d['name'] in used_names]
    all_ings = []
    for d in shop_dishes:
        all_ings.extend(get_dish_ingredients(d, index))

    grouped = group_ingredients(all_ings)

    output = [
        f"# 📅 一周菜单（{people}人份，共{min(days, 7)}天）\n",
        f"*每天早中晚三餐，共{len(used_names)}道菜*\n",
        "---\n",
    ]
    output.extend(menu)
    output.append("---\n\n## 🛒 所需食材一览\n")
    for cat, ings in grouped.items():
        unique = sorted(set(ings))
        output.append(f"**{cat}**：{', '.join(unique)}\n")

    output.append(f"\n*共约 {len(set(all_ings))} 种食材*\n")
    output.append("\n---\n")
    output.append("*🟢 howtocook（精确量化）优先 + 🔵 隋卞做补充*\n")
    output.append("*如需更换菜品请告诉我，我可以重新生成*")

    return ''.join(output)


# ─────────────────────────────────────────
# CLI 入口
# ─────────────────────────────────────────

def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) < 2:
        print("用法:")
        print("  python planner.py list                      # 查看所有菜谱数量")
        print("  python planner.py shop 菜名1 菜名2 ...       # 生成购物清单")
        print("  python planner.py quick                      # 快速推荐（30分钟内）")
        print("  python planner.py weekend                   # 周末推荐")
        print("  python planner.py guest                      # 请客推荐")
        print("  python planner.py diff N                     # 指定难度N以内推荐")
        print("  python planner.py week [人数] [天数] [忌口]  # 生成一周菜单")
        print("  python planner.py week 3 5 香菜,虾            # 3人5天，忌口香菜虾")
        sys.exit(0)

    cmd = sys.argv[1]
    args = sys.argv[2:]

    if cmd == 'list':
        index = load_index_local()
        total = len([d for d in index['dishes'] if d['name'] != _TEMPLATE_DISH_NAME])
        how = len([d for d in index['dishes'] if d.get('source') not in ('suibian', '随便做')])
        sui = len([d for d in index['dishes'] if d.get('source') in ('suibian', '随便做')])
        print(f"📊 总菜谱数：{total}")
        print(f"   🟢 howtocook：{how} 道")
        print(f"   🔵 隋卞做：{sui} 道")

    elif cmd == 'shop':
        if not args:
            print("❌ 请提供菜名，如：python planner.py shop 红烧带鱼 麻婆豆腐")
            sys.exit(1)
        print(generate_shopping_list(args))

    elif cmd in ('quick', '快速'):
        print(recommend_by_time_budget("快速"))

    elif cmd in ('weekend', '周末'):
        print(recommend_by_time_budget("周末"))

    elif cmd in ('guest', '请客'):
        print(recommend_by_time_budget("请客"))

    elif cmd == 'diff':
        diff = int(args[0]) if args else 3
        print(recommend_by_time_budget(custom_difficulty=diff))

    elif cmd in ('week', '一周', '菜单'):
        people = int(args[0]) if args else 2
        days = int(args[1]) if len(args) > 1 else 7
        avoid = args[2].split(',') if len(args) > 2 else []
        print(generate_weekly_menu(people, days, avoid))

    else:
        print(f"❌ 未知命令：{cmd}")


if __name__ == '__main__':
    main()
