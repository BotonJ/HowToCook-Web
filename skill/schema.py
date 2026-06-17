#!/usr/bin/env python3
"""HowToCook Recipe Schema — 枚举定义、映射规则、标签提取"""

from utils import match_by_keywords
from diet import get_diet, DietResult

# ─── 菜系 ───────────────────────────────────────────────

CUISINES = [
    "川菜", "粤菜", "鲁菜", "苏菜", "浙菜", "闽菜", "湘菜", "徽菜",
    "东北", "西北", "京菜", "客家", "日式", "韩式", "东南亚", "西式",
    "家常", "其他",
]

CUISINE_KEYWORDS: dict[str, list[str]] = {
    "川菜": ["麻辣", "水煮", "鱼香", "宫保", "回锅", "毛血旺", "担担", "夫妻肺片", "辣子鸡", "口水鸡", "麻婆", "泡椒", "酸菜鱼", "蒜泥白肉"],
    "粤菜": ["白灼", "煲仔", "蒸鱼", "烧鹅", "叉烧", "肠粉", "虾饺", "煲汤", "老火汤", "豆豉鲮鱼"],
    "鲁菜": ["葱烧", "九转", "糖醋里脊", "爆炒", "锅包肉", "溜肉段", "拔丝", "糟溜"],
    "湘菜": ["剁椒", "小炒肉", "辣椒炒肉", "湘西", "腊肉", "血粑"],
    "东北": ["地三鲜", "锅包肉", "炖", "酱骨架", "酸菜", "溜肉段", "尖椒干豆腐", "大骨"],
    "西北": ["大盘鸡", "拉条子", "手抓", "羊肉泡馍", "biangbiang", "油泼面", "孜然", "烤羊"],
    "苏菜": ["狮子头", "松鼠桂鱼", "大煮干丝", "盐水鸭", "叫花鸡", "文思豆腐"],
    "浙菜": ["东坡肉", "西湖醋鱼", "龙井虾仁", "叫花鸡", "宋嫂鱼羹"],
    "闽菜": ["佛跳墙", "荔枝肉", "沙茶", "蚵仔煎", "面线糊"],
    "徽菜": ["臭鳜鱼", "毛豆腐", "徽州", "黄山"],
    "京菜": ["北京烤鸭", "京酱肉丝", "炸酱面", "涮羊肉"],
    "客家": ["酿豆腐", "盐焗鸡", "梅菜扣肉", "盆菜"],
    "日式": ["日式", "寿司", "刺身", "味噌", "天妇罗", "丼饭", "咖喱饭", "肥牛丼", "照烧"],
    "韩式": ["韩式", "泡菜", "拌饭", "辣炒", "部队锅"],
    "东南亚": ["泰式", "越南", "冬阴功", "咖喱", "椰奶", "手标红茶"],
    "西式": ["披萨", "意面", "牛排", "焗饭", "奶油", "培根", "通心粉", "司康", "巴斯克"],
}

# ─── 烹饪方式 ────────────────────────────────────────────

COOKING_METHODS: dict[str, list[str]] = {
    "炒": ["炒", "爆", "溜", "小炒", "滑", "干锅", "干煸", "鱼香", "宫保", "糖醋", "麻辣", "酸辣", "口水", "麻婆", "香辣", "辣子"],
    "炖煮": [
        "炖", "煮", "煲", "焖", "卤", "煨", "红烧", "酱",
        "汤", "羹", "粥", "烩", "砂锅", "汆", "涮", "关东煮",
        "扣", "扒", "柱候", "回锅",
    ],
    "蒸": ["蒸", "酿"],
    "烤": ["烤", "焗"],
    "煎炸": ["炸", "煎", "煸", "烙", "锅包", "酥", "脆皮", "虎皮"],
    "凉拌": ["凉拌", "拌", "炝", "白灼", "捞", "擂"],
    "烘焙": ["蛋糕", "饼干", "面包", "蛋挞", "司康", "戚风", "松饼", "玛格丽特", "雪花酥"],
    "饮品": [
        "奶茶", "冰沙", "鸡尾酒", "莫吉托", "柠檬水",
        "咖啡", "特调",
    ],
    "调味": [
        "咖喱", "葱烧", "蒜蓉", "蒜香",
        "椒盐", "椒麻", "照烧", "芥末", "蚝油", "黑椒", "豉汁", "腐乳",
        "怪味", "陈皮",
        "油泼", "蒲烧", "葱油", "孜然", "咸蛋黄",
        "拔丝", "反沙",
    ],
    "微波": ["微波"],
}

# 饮品关键词排除：菜名含这些子串时，不判定为饮品
_DRINK_EXCLUDE_PATTERNS = [
    "蛋", "鸡", "鸭", "鱼", "虾", "肉", "排骨", "猪", "牛", "羊",
    "馄饨", "饺子", "包子", "面", "饭", "粥",
]

# 菜名优先覆盖（绕过关键词匹配）
COOKING_METHOD_OVERRIDES: dict[str, str] = {
    "茶叶蛋": "炖煮",
    "溏心茶叶蛋": "炖煮",
    "可乐鸡翅": "炖煮",
    "啤酒鸭": "炖煮",
    "乡村啤酒鸭": "炖煮",
    "新疆大盘鸡": "炖煮",
    "猪皮冻": "炖煮",
    "阳朔啤酒鱼": "炖煮",
    "金谷园牛奶醪糟鸡蛋": "炖煮",
    "醪糟小汤圆": "炖煮",
    "速冻馄饨": "炖煮",
    "速冻水饺": "煎炸",
    "咖啡椰奶冻": "其他",
    "酸奶意式奶冻": "其他",
    "龟苓膏": "其他",
    "冰粉": "其他",
    "奥利奥冰淇淋": "其他",
    "草莓冰淇淋": "其他",
}

# ─── 烹饪时间（基于难度反推） ──────────────────────────────

DIFFICULTY_TO_TIME = {1: "quick", 2: "quick", 3: "medium", 4: "long", 5: "very_long"}

TIME_LABELS = {"quick": "<15分钟", "medium": "15-30分钟", "long": "30-60分钟", "very_long": ">60分钟"}

# ─── 主要食材归类 ─────────────────────────────────────────

MAIN_INGREDIENT_GROUPS: dict[str, list[str]] = {
    "鸡肉": ["鸡腿", "鸡翅", "鸡胸", "鸡爪", "鸡丁", "鸡丝", "鸡块"],
    "猪肉": ["猪肉", "五花肉", "排骨", "猪蹄", "肘子", "肉末", "肉糜", "肉馅", "猪肉丝", "猪肉片", "猪肉里脊", "猪里脊", "猪肝", "猪心", "猪大肠", "猪血", "猪排", "猪骨", "猪皮", "培根"],
    "牛肉": ["牛腩", "牛肉", "牛排", "牛里脊", "肥牛"],
    "羊肉": ["羊排", "羊肉", "羊腩"],
    "鱼虾": ["鱼", "虾", "蟹", "鳝", "鳗", "鲍鱼", "海参", "生蚝", "蛏", "蛤", "鲈", "鲤", "鲢", "鳜", "翘嘴", "田螺", "小龙虾", "罗氏虾"],
    "蛋奶": ["鸡蛋", "蛋液", "蛋黄", "蛋白", "牛奶", "奶酪", "芝士", "黄油", "酸奶", "奶油"],
    "豆腐": ["豆腐", "豆干", "腐竹", "豆皮", "油豆腐", "内酯豆腐"],
    "蔬菜": ["白菜", "包菜", "生菜", "菠菜", "油麦菜", "莴笋", "芹菜", "西兰花", "花菜", "茄子", "青椒", "辣椒", "黄瓜", "冬瓜", "南瓜", "丝瓜", "苦瓜", "西红柿", "番茄", "萝卜", "胡萝卜", "洋葱", "莲藕", "土豆", "山药", "芋头", "红薯", "豆角", "四季豆", "毛豆", "荷兰豆", "豌豆", "空心菜", "娃娃菜", "菜心", "茼蒿", "苋菜"],
    "菌菇": ["香菇", "蘑菇", "金针菇", "杏鲍菇", "平菇", "茶树菇", "木耳", "银耳"],
    "主食": ["米饭", "面条", "面粉", "馒头", "饺子", "包子", "饼", "年糕", "米粉", "意面", "挂面", "方便面", "荞麦面"],
    "水果": ["草莓", "芒果", "柠檬", "橙子", "苹果", "香蕉", "菠萝", "奇异果", "百香果", "椰子"],
    "饮品原料": ["奶茶", "咖啡", "可可", "椰浆", "椰奶", "鸡尾酒"],
    "调味品": ["酱油", "醋", "蚝油", "豆瓣酱", "豆豉", "腐乳", "辣椒酱", "番茄酱", "甜面酱", "沙茶酱"],
    "坚果干货": ["花生", "核桃", "杏仁", "腰果", "枸杞", "红枣", "莲子", "桂圆", "百合", "薏米", "银杏"],
}

# ─── 过敏原映射 ───────────────────────────────────────────

ALLERGEN_MAP: dict[str, list[str]] = {
    "花生": ["花生", "花生米", "花生碎", "花生酱"],
    "海鲜": ["虾", "蟹", "鱼", "蛤", "蛏", "蚝", "海参", "鲍鱼", "鳝", "鳗", "鲈", "鲤", "鲢", "鳜", "小龙虾", "罗氏虾", "田螺"],
    "麸质": ["面粉", "面条", "馒头", "饺子皮", "包子皮", "饼", "面包", "意面", "挂面", "方便面"],
    "乳制品": ["牛奶", "奶油", "芝士", "奶酪", "黄油", "酸奶"],
    "鸡蛋": ["鸡蛋", "蛋", "蛋液", "蛋黄", "蛋白", "皮蛋", "咸蛋"],
    "大豆": ["豆腐", "豆干", "腐竹", "豆皮", "酱油", "豆瓣酱", "豆豉"],
}

# ─── 烹饪方式排除词 ────────────────────────────────────────

COOKING_METHOD_NEGATIVES: dict[str, list[str]] = {
    "煎炸": ["轰炸机"],
}

# ─── 提取函数 ─────────────────────────────────────────────


def extract_cuisine(name: str, ingredients: list[str]) -> str:
    text = name + "".join(ingredients)
    return match_by_keywords(text, CUISINE_KEYWORDS) or "家常"


def extract_cooking_method(name: str, ingredients: list[str]) -> str:
    # 1. 菜名覆盖优先
    for pattern, method in COOKING_METHOD_OVERRIDES.items():
        if pattern in name:
            return method

    # 2. 菜名关键词匹配（饮品需排除非饮品菜名）
    result = match_by_keywords(name, COOKING_METHODS, COOKING_METHOD_NEGATIVES)
    if result == "饮品" and any(p in name for p in _DRINK_EXCLUDE_PATTERNS):
        result = ""  # 排除误判，继续看食材
    if result:
        return result

    # 3. 食材关键词匹配（仅当菜名无匹配时）
    if ingredients:
        result = match_by_keywords(",".join(ingredients), COOKING_METHODS, COOKING_METHOD_NEGATIVES)
        if result:
            return result

    return "其他"


def extract_cook_time(difficulty: int) -> str:
    return DIFFICULTY_TO_TIME.get(difficulty, "medium")


def extract_main_ingredients(ingredients: list[str]) -> list[str]:
    tags = set()
    text = ",".join(ingredients)
    for group, keywords in MAIN_INGREDIENT_GROUPS.items():
        for kw in keywords:
            if kw in text:
                tags.add(group)
                break
    return sorted(tags)


def extract_allergens(ingredients: list[str]) -> list[str]:
    found = []
    text = ",".join(ingredients)
    for allergen, keywords in ALLERGEN_MAP.items():
        for kw in keywords:
            if kw in text:
                found.append(allergen)
                break
    return sorted(found)


def detect_spicy(ingredients: list[str], name: str) -> bool:
    spicy_indicators = ["辣椒", "干辣椒", "小米辣", "花椒", "麻椒", "泡椒", "剁椒", "辣酱", "辣椒油", "辣子", "豆瓣酱", "芥末", "胡椒"]
    text = name + ",".join(ingredients)
    return any(kw in text for kw in spicy_indicators)


# ─── 饮食检测 ────────────────────────────────────────────

_MEAT_KEYWORDS = [
    "鸡", "鸭", "鹅", "猪", "牛", "羊", "鱼", "虾", "蟹",
    "肉", "排骨", "肘子", "猪蹄", "鳝", "鳗", "海参", "鲍鱼",
]

_MEAT_EXCLUDES = ["肉桂", "肉豆蔻"]


def _detect_diet(name: str, ingredients: list[str]) -> list[str]:
    """兼容旧接口：返回 tags 列表。内部调用 diet 模块。"""
    result = get_diet(name, ingredients)
    return result.tags


def detect_diet_detail(name: str, ingredients: list[str], dish_id: str = "") -> DietResult:
    """新接口：返回完整 DietResult（tags/level/confidence/source）。"""
    return get_diet(name, ingredients, dish_id)


def extract_tags(dish: dict) -> dict:
    ingredients = dish.get("ingredients", [])
    name = dish.get("name", "")
    return {
        "spicy": detect_spicy(ingredients, name),
        "allergens": extract_allergens(ingredients),
        "diet": _detect_diet(name, ingredients),
    }
