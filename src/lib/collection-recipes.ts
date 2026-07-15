/**
 * 人工选定的合集菜谱清单（形态 A）。
 * 每个合集由人工挑选，非运行时 filter 匹配。
 * id 格式：{source}/{name}
 */

export const COLLECTION_RECIPES: Record<string, string[]> = {
  // ── 🍳 厨电料理（20 道，覆盖空气炸锅/烤箱/微波炉/电饭煲） ──
  'kitchen-appliances': [
    // 空气炸锅 (5)
    'howtocook/炸薯条',
    'howtocook/甜辣烤全翅',
    'howtocook/空气炸锅面包片',
    'howtocook/空气炸锅鸡翅中',
    'howtocook/红柚蛋糕',
    // 烤箱 (5)
    'howtocook/懒人蛋挞',
    'howtocook/烤箱版巴斯克芝士蛋糕',
    'howtocook/烤鸡翅',
    'howtocook/披萨饼皮',
    'howtocook/玛格丽特饼干',
    // 微波炉 (5)
    'howtocook/微波炉荷包蛋',
    'howtocook/微波炉蒸蛋',
    'howtocook/微波炉腊肠煲仔饭',
    'howtocook/半成品意面',
    'howtocook/速冻汤圆',
    // 电饭煲 (5)
    'howtocook/电饭煲三文鱼炊饭',
    'howtocook/电饭煲蒸米饭',
    'howtocook/巴基斯坦牛肉咖喱',
    'howtocook/速冻馄饨',
    'howtocook/太阳蛋',
  ],

  // ── 😴 懒人快手（25 道，difficulty=1 + cook_time=quick，去掉纯饮品/调料） ──
  'lazy-meals': [
    // 荤菜 (2)
    '随便做/青椒炒肉丝',
    'howtocook/黔式腊肠娃娃菜',
    // 素菜 (11)
    'howtocook/凉拌油麦菜',
    'howtocook/凉拌黄瓜',
    'howtocook/清蒸南瓜',
    'howtocook/炒滑蛋',
    '随便做/炝炒莲花白',
    '随便做/酸辣豆芽',
    '随便做/醋溜白菜',
    'howtocook/皮蛋豆腐',
    '随便做/葱烧豆腐',
    '随便做/凉拌炸青椒',
    '随便做/凉菜合集（浇汁松花蛋、拍黄瓜、捞汁秋葵、老醋花生米）',
    // 早餐 (5)
    'howtocook/微波炉荷包蛋',
    'howtocook/微波炉蒸蛋',
    'howtocook/空气炸锅面包片',
    '随便做/溏心茶叶蛋',
    'howtocook/牛奶燕麦',
    // 主食 (5)
    'howtocook/意式肉酱面',
    '随便做/懒人焖饭',
    'howtocook/猪油拌饭',
    'howtocook/老干妈拌面',
    '随便做/家常炒面',
    // 汤 (2)
    'howtocook/朱雀汤',
    '随便做/疙瘩汤',
  ],

  // ── 🌶️ 下饭菜（20 道，经典米饭杀手） ──
  'rice-killer': [
    '随便做/麻婆豆腐',
    '随便做/宫保鸡丁',
    'howtocook/回锅肉',
    '随便做/鱼香肉丝',
    'howtocook/水煮牛肉',
    'howtocook/酸辣土豆丝',
    'howtocook/红烧鸡翅',
    'howtocook/红烧猪蹄',
    'howtocook/小炒黄牛肉',
    'howtocook/西红柿炒鸡蛋',
    'howtocook/青椒土豆炒肉',
    'howtocook/鱼香茄子',
    'howtocook/红烧茄子',
    'howtocook/黄焖鸡',
    '随便做/糖醋排骨',
    '随便做/番茄炖牛腩',
    '随便做/土豆炖牛肉',
    '随便做/孜然羊肉',
    '随便做/油焖鸡',
    '随便做/葱烧豆腐',
  ],

  // ── 🍜 面食专题（33 道，面食之神全选） ──
  'noodles': [
    '面食之神/八宝粥',
    '面食之神/凉皮',
    '面食之神/刀削面',
    '面食之神/千层饼',
    '面食之神/小笼包',
    '面食之神/开花馒头',
    '面食之神/戗面馒头',
    '面食之神/手擀大宽裤带面',
    '面食之神/拉条子',
    '面食之神/擀饺子皮',
    '面食之神/春饼',
    '面食之神/水煎包',
    '面食之神/水盆羊肉',
    '面食之神/汤心饺子',
    '面食之神/油泼辣子',
    '面食之神/油泼面',
    '面食之神/油酥饼',
    '面食之神/炝醋',
    '面食之神/炸酱面',
    '面食之神/烩面片',
    '面食之神/空心饼',
    '面食之神/羊肉汤',
    '面食之神/老潼关肉夹馍',
    '面食之神/老面馒头',
    '面食之神/臊子面',
    '面食之神/茄子麦饭',
    '面食之神/菠菜大油条',
    '面食之神/葱油饼',
    '面食之神/蒸花卷',
    '面食之神/金丝饼',
    '面食之神/陕西扯面',
    '面食之神/饺子',
    '面食之神/麻酱烧饼',
  ],

  // ── 🌞 夏日清凉（26 道，冷饮/甜品/凉拌/凉主食） ──
  'summer': [
    // 冷饮冰品 (12)
    'howtocook/冰粉',
    'howtocook/酸梅汤',
    'howtocook/杨枝甘露',
    '随便做/绿豆沙',
    'howtocook/龟苓膏',
    'howtocook/柠檬水',
    'howtocook/酒酿醪糟',
    'howtocook/砂糖椰子冰沙',
    'howtocook/牛油果拉西',
    'howtocook/海边落日',
    'howtocook/百香果橙子特调',
    'howtocook/冬瓜茶',
    // 清凉甜品 (5)
    'howtocook/咖啡椰奶冻',
    'howtocook/酸奶意式奶冻',
    'howtocook/奥利奥冰淇淋',
    'howtocook/草莓冰淇淋',
    'howtocook/芋泥雪媚娘',
    // 凉拌菜 (6)
    'howtocook/凉拌黄瓜',
    'howtocook/凉拌木耳',
    'howtocook/凉拌莴笋',
    'howtocook/凉拌鸡丝',
    'howtocook/凉拌豆腐',
    '随便做/凉拌炸青椒',
    // 凉主食 (3)
    'howtocook/凉皮',
    'howtocook/凉粉',
    '随便做/鸡丝凉面',
  ],
};
