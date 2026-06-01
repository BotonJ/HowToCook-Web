/**
 * SLERP result interpretation — generates Chinese-language copy
 * explaining what the flavor journey means at a given angle.
 */

const CUISINE_ZH: Record<string, string> = {
  East_Asian: '东亚',
  Southeast_Asian: '东南亚',
  South_Asian: '南亚',
  Mediterranean: '地中海',
  Western_Atlantic: '西洋',
  Eastern_European: '东欧',
  Latin_American: '拉美',
};

/** Tips keyed by cuisine — short, actionable cooking advice. */
const CUISINE_TIPS: Record<string, string[]> = {
  East_Asian: [
    '可以尝试用酱油、姜和米酒来调味',
    '搭配米饭或面条效果最佳',
    '少许芝麻油能提升整体风味层次',
  ],
  Southeast_Asian: [
    '试试加入鱼露、青柠汁和香茅',
    '搭配椰浆或糯米非常和谐',
    '新鲜香草（如泰国罗勒）是点睛之笔',
  ],
  South_Asian: [
    '姜黄、孜然和芫荽籽是经典组合',
    '搭配烤饼或印度香饭都很合适',
    '少许酸奶可以平衡辛香料的强度',
  ],
  Mediterranean: [
    '橄榄油、大蒜和迷迭香是百搭底味',
    '适合搭配意面、烤蔬菜或法棍面包',
    '挤几滴柠檬汁能让风味更明亮',
  ],
  Western_Atlantic: [
    '黄油和黑胡椒是经典西式底味',
    '搭配土豆泥或烤蔬菜很协调',
    '少许红酒醋可以提升层次感',
  ],
  Eastern_European: [
    '酸奶油和莳萝是东欧料理的灵魂',
    '搭配黑面包或土豆菜肴很地道',
    '烟熏辣椒粉能增添温暖的色泽和风味',
  ],
  Latin_American: [
    '青柠、香菜和辣椒是拉美风味三剑客',
    '搭配玉米饼或黑豆饭都很棒',
    '少许烟熏辣椒粉带来迷人的烟熏感',
  ],
};

/** Descriptions for each angle range. */
const ANGLE_BANDS = [
  {
    min: 0,
    max: 15,
    describe: (seed: string, cuisine: string) =>
      `保留了${seed}的核心风味，只是略微偏向${cuisine}方向。这个阶段适合在不改变食材本味的前提下，试探性地引入一丝异域气息。`,
  },
  {
    min: 15,
    max: 30,
    describe: (seed: string, cuisine: string) =>
      `从${seed}出发，轻度融入了${cuisine}的特色元素。两种风味体系开始产生微妙的化学反应，既有熟悉的基底，又能感受到新的风味暗示。`,
  },
  {
    min: 30,
    max: 45,
    describe: (seed: string, cuisine: string) =>
      `在${seed}和${cuisine}之间找到了一个有趣的平衡点。两种风味体系势均力敌，既不过分保守也不过于激进，是探索跨界搭配的甜区。`,
  },
  {
    min: 45,
    max: 60,
    describe: (seed: string, cuisine: string) =>
      `明显偏向${cuisine}的方向，${seed}的特征已退居二线。这个角度推荐的食材更适合用来做${cuisine}风味的菜，同时能隐约感受到原始食材的基底。`,
  },
  {
    min: 60,
    max: 75,
    describe: (seed: string, cuisine: string) =>
      `深度探索${cuisine}的风味腹地，${seed}更多是作为灵感起点而非主角。推荐的食材已经非常贴近${cuisine}料理的常用选手。`,
  },
  {
    min: 75,
    max: 90,
    describe: (seed: string, cuisine: string) =>
      `接近${cuisine}的核心风味区域。虽然起点是${seed}，但推荐结果已完全融入${cuisine}的食材谱系，适合做地道的${cuisine}料理。`,
  },
];

/** Title generation based on angle intensity. */
function generateTitle(cuisineZh: string, angle: number): string {
  if (angle <= 15) return `${cuisineZh}风味轻触`;
  if (angle <= 30) return `${cuisineZh}风味初探`;
  if (angle <= 45) return `${cuisineZh}跨界融合`;
  if (angle <= 60) return `${cuisineZh}风味偏向`;
  if (angle <= 75) return `${cuisineZh}深度探索`;
  return `${cuisineZh}核心风味`;
}

/**
 * Pick a deterministic tip from the cuisine's tip pool,
 * using a simple hash of seed name so different seeds get different tips.
 */
function pickTip(cuisineKey: string, seedName: string): string {
  const tips = CUISINE_TIPS[cuisineKey];
  if (!tips || tips.length === 0) return '尝试将推荐食材融入日常烹饪，发现新的搭配可能。';
  let hash = 0;
  for (let i = 0; i < seedName.length; i++) {
    hash = (hash * 31 + seedName.charCodeAt(i)) | 0;
  }
  return tips[Math.abs(hash) % tips.length];
}

export interface SlerpInterpretation {
  title: string;
  description: string;
  tip: string;
}

export function generateSlerpInterpretation(params: {
  seedName: string;
  seedNameZh: string;
  cuisineKey: string;
  cuisineLabel: string;
  angle: number;
  topResults: Array<{ name: string; nameZh: string; score: number }>;
}): SlerpInterpretation {
  const { seedName, seedNameZh, cuisineKey, angle } = params;
  const cuisineZh = CUISINE_ZH[cuisineKey] ?? params.cuisineLabel;
  const displaySeed = seedNameZh || seedName.replace(/_/g, ' ');

  const band = ANGLE_BANDS.find((b) => angle >= b.min && angle < b.max)
    ?? ANGLE_BANDS[ANGLE_BANDS.length - 1];

  return {
    title: generateTitle(cuisineZh, angle),
    description: band.describe(displaySeed, cuisineZh),
    tip: pickTip(cuisineKey, seedName),
  };
}
