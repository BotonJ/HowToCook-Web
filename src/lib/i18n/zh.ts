/** 中文 locale — 覆盖所有 UI 字符串（非菜谱内容） */

export const zh = {
  // ── 通用 ──────────────────────────────────────────────────────────
  common: {
    loading: '加载中...',
    loadingRecipes: '加载菜谱中...',
    retry: '重试',
    back: '返回',
    backHome: '← 返回首页',
    all: '全部',
    more: '更多',
    copy: '复制',
    copied: '已复制',
    search: '搜索',
    notFound: '未找到',
    comingSoon: 'coming soon',
  },

  // ── 导航栏 ────────────────────────────────────────────────────────
  nav: {
    siteName: '做饭指北',
    academy: '烹饪学院',
    collections: '专题',
    explore: '风味工作台',
    about: '关于',
    credits: '致谢',
    github: 'GitHub',
    collectionLabels: {
      // ── 中文专题（2026-06-02） ──────────────────────────────────
      'air-fryer': '空气炸锅系列',
      'microwave': '微波炉快手菜',
      'rice-cooker': '电饭煲料理',
      'lazy-meal': '懒人菜谱',
      'rice-killer': '下饭菜',
      'oven': '烤箱烘焙',
      // ── 英文专题（保留原有） ─────────────────────────────────────
      // 'chinese-recipes': '中国菜谱',
      // 'chicken-recipes': '鸡肉类',
      // 'baking': '烘焙',
      // 'air-fryer-en': '空气炸锅',
      // 'pasta': '意面',
    },
  },

  // ── 首页 ──────────────────────────────────────────────────────────
  home: {
    recipeCount: (n: number) => `${n} 道菜`,
    searchPlaceholder: '输入关键词搜索菜谱',
    emptySearch: '未找到匹配的菜谱，试试其他关键词',
    emptyCategory: '该分类暂无菜谱',
    category: '分类',
    featured: '精选推荐',
    recipes: (n: number) => `${n} recipes →`,
    metaDesc: '做饭指北 — 世界首个 AI 驱动的食谱百科与烹饪 Skill。',
    sourceAll: '全部',
    sourceZh: '中文',
    sourceEn: 'English',
    tagline: 'AI 驱动的食谱百科，让每一餐都有章可循',
    discoveryTitle: '探索发现',
    discoverySubtitle: '海量菜谱，按你的方式发现',
    curatedTitle: '精选合集',
    curatedSubtitle: '按场景策划的菜谱专题，一道一道攒出来',
    viewAllCollections: '查看全部合集',
  },

  // ── 菜谱详情 ──────────────────────────────────────────────────────
  recipe: {
    loading: '加载中...',
    notFound: '菜谱未找到',
    backHome: '返回首页',
    back: '返回',
    difficulty: '难度',
    time: '时间',
    cuisine: '菜系',
    method: '做法',
    taste: '口味',
    spicy: '辣',
    diet: '饮食',
    flavorProfile: '风味画像',
    ingredients: '食材',
    amount: '用量',
    steps: '步骤',
    tips: '小贴士',
    allergenNotice: '过敏原提示',
    descriptionSuffix: '的做法',
  },

  // ── 关于页 ────────────────────────────────────────────────────────
  about: {
    title: '关于 HowToCook',
    metaTitle: '关于',
    metaDesc: 'HowToCook — AI 驱动的菜谱平台，500+ 道菜谱覆盖 17 大菜系，支持 MCP 协议接口。',
    intro: 'HowToCook 是一个 AI 驱动的菜谱平台，为所有下厨的人提供精确、可执行的烹饪指南。',
    description1: '496 道菜谱，覆盖川、粤、鲁、湘等 17 大菜系，支持按难度、时间、食材、辣度等多维度筛选。通过偏好学习系统，越用越懂你的口味。',
    description2: '本站同时提供 MCP 协议接口，支持 Claude Code 等 AI 助手直接调用菜谱引擎，实现智能推荐和购物清单生成。',
    heroSubtitle: '从家常小炒到风味探索，AI 为你的每一餐提供精准指南。',
    statsTitle: '数据一览',
    stats: {
      recipes: '道菜谱',
      categories: '个分类',
    },
  },

  // ── 致谢页 ────────────────────────────────────────────────────────
  credits: {
    title: '致谢',
    metaTitle: '致谢',
    metaDesc: '感谢 HowToCook 源仓库、随便做、金谷园等项目和创作者的贡献。',
    intro: '感谢以下项目和创作者的贡献，让 HowToCook 的菜谱库不断丰富。',
    visitProject: '访问项目 →',
    items: {
      howtocook: {
        name: 'HowToCook 源仓库',
        description: '开源菜谱项目（GitHub 100k+ stars），程序员风格菜谱。精确量化，步骤带公式。',
      },
      suibo: {
        name: '随便做',
        description: '火遍全网的国宴大厨隋坡，140 道简易/进阶菜谱。随便一做，怎么都好吃。',
      },
      jinguyuan: {
        name: '金谷园',
        description: '第一个开源的饺子馆 Skill，招牌甜品牛奶醪糟鸡蛋。',
      },
      jingxiang: {
        name: 'king-jingxiang 菜谱图片版',
        description: '基于 NanoBananaPro 将原版 Markdown 教程全量转化为精美菜谱图片，让厨房实操更加直观。',
      },
    },
  },

  // ── 烹饪学院 ──────────────────────────────────────────────────────
  tips: {
    title: '烹饪学院',
    metaTitle: '烹饪学院',
    metaDesc: '烹饪基础知识、技法教程、厨房技巧 — 数据仪表盘、内容路线图、更新日志，一站式了解建设进展。',
    subtitle: '从零开始的厨房指南 — 菜谱、技法、术语，持续建设中。',
    heroBadge: '正念烹饪',
    heroSubtitle: '通过基础技法、正念练习和对风味的深刻理解，掌握直觉式烹饪的艺术。',
    featuredTitle: '精选系列',
    featuredSubtitle: '正念厨房的核心知识。',
    startSeries: '开始学习',
    exploreTitle: '按学科探索',
    modules: (n: number) => `${n} 模块`,
    articles: (n: number) => `${n} 篇`,
    beginner: '入门',
    stats: {
      recipes: '道菜谱',
      terms: '个术语',
      tutorials: '篇教程',
      upcoming: '待上线',
    },
    techniqueTutorials: '技法教程',
    contentRoadmap: '内容路线图',
    roadmapIntro: '我们正在持续建设内容库，以下是各方向的进展。',
    changelog: '更新日志',
    status: {
      ready: '已就绪',
      building: '建设中',
      planned: '规划中',
    },
    categoryLabels: {
      technique: '技法',
      equipment: '工具',
      ingredient: '食材',
      safety: '安全',
    },
    roadmap: {
      techniqueTutorials: {
        title: '技法教程',
        description: '炒、蒸、煮、腌、焯水… 18 篇基础技法文章已就绪',
      },
      glossary: {
        title: '术语词典',
        description: '84 个中英对照烹饪术语，涵盖刀工、火候、调味',
      },
      recipeLibrary: {
        title: '15K 菜谱库',
        description: 'HowToCook 开源菜谱全量接入，覆盖 17 大菜系',
      },
      kitchenGuide: {
        title: '最小厨房指南',
        description: '从锅具刀具到食品安全，14 模块入门手册',
      },
      videoTutorials: {
        title: '视频教程',
        description: '关键技法配短视频演示，直观易学',
      },
    },
    changelogEntries: {
      seoOptimization: {
        title: 'SEO 优化上线',
        description: '全站 JSON-LD 结构化数据、面包屑导航、Open Graph 标签完善。',
      },
      academyFramework: {
        title: '烹饪学院框架搭建',
        description: '新增 /tips 路由、TipDetail 详情页、generate-tips 数据生成脚本。',
      },
      mcpBanner: {
        title: 'MCP Banner 上线',
        description: '首页新增 Claude Code Skill 安装引导，一键复制安装命令。',
      },
      multiSource: {
        title: '多源菜谱接入',
        description: '接入「随便做」和「金谷园」菜谱数据，支持来源切换。',
      },
      searchFeature: {
        title: '搜索功能上线',
        description: 'API 搜索 + 本地 fallback，支持关键词实时搜索。',
      },
    },
  },

  // ── 技法详情 ──────────────────────────────────────────────────────
  tipDetail: {
    notFoundTitle: '未找到文章',
    notFoundDesc: '该文章尚未上线，请返回列表查看已发布的内容。',
    backToAcademy: '返回烹饪学院',
    defaultMetaTitle: '未找到',
    defaultMetaDesc: '烹饪知识文章',
  },

  // ── 风味工作台 ──────────────────────────────────────────────────────
  explore: {
    title: '风味工作台',
    subtitle: '探索食材搭配、风味特征和菜系方向',
    metaDesc: 'Explore ingredient pairings, flavor profiles, and cuisine directions with our ingredient embedding engine.',
    searchPlaceholder: '搜索食材发现风味搭配...',
    searchHint: '搜索食材以发现风味搭配',
    pairings: '的搭配',
    cuisineExplore: '菜系探索',
    seedPlaceholder: '选择种子食材...',
    cuisineDirection: '菜系方向',
    cuisineDirectionHint: '选择目标菜系，系统会从种子食材出发，向该菜系的典型风味方向偏移',
    blendAngle: '混合角度',
    angleHint: '0° = 保持原食材风味，90° = 完全偏向目标菜系。角度越大，推荐的食材越有目标菜系的特色',
    angleOriginal: '（原始食材）',
    angleSlight: '（轻微偏移，风味接近原食材）',
    angleMedium: '（中等偏移，融入目标菜系特色）',
    angleLarge: '（大幅偏移，接近目标菜系风味）',
    flavorCharacteristics: '风味特征',
    selectIngredient: '选择食材查看其风味特征',
    exploreResult: '探索结果：',
    flavorAttribution: '的风味归属',
  },

  // ── MCP Banner ────────────────────────────────────────────────────
  mcp: {
    bannerText: '将菜谱引擎一键部署到本地',
    instructions: '使用说明',
    whatIsThis: '❓ 这个命令的用途是？',
    whatIsThisDesc: '下载 HowToCook Skill 到本地，可以通过 Claude Code、Hermes、Open Claw 等 Agent 随时查询菜谱，并依赖 Agent 自身的能力为你提供食谱推荐，食材购买建议等功能。Skill 将自动配对服务器后端，当网站数据有更新的时候，静默拉取下载或功能更新。检查周期为 7 天。',
    supportedPlatforms: '💻 支持的平台',
    supportedPlatformsDesc: 'Claude Code、Hermes、Open Claw、其他 Agent。如果配置了微信、飞书、Telegram 等信息渠道，也可以在手机上收到消息。',
    howToUse: '💡 复制后如何使用？',
    howToUseDesc: '① 发送给 Agent 自动安装，即可正常使用',
    howToUseJoke: '② 大喊"妈！！！"',
    noAgent: '🌐 没有 Agent 或网络？',
    noAgentDesc: '数据可以本地使用，或访问 https://howtocook.cn',
    skillUpdate: '🔄 Skill 如何更新',
    skillUpdateDesc: 'Skill 自动配对网站后端的 MCP，当网站增加了菜谱，或者我们对 Skill 的功能进行了完善的时候，Skill 会自动获取更新，静默下载，并且不会占用大量本地空间。',
  },

  // ── PWA ───────────────────────────────────────────────────────────
  pwa: {
    addToHome: '添加到主屏幕',
  },

  // ── 风味维度 ──────────────────────────────────────────────────────
  flavor: {
    sweet: '甜',
    sour: '酸',
    bitter: '苦',
    umami: '鲜',
    spicy: '辣',
    fat: '脂肪', salty: '咸', aromatic: '香',
  },

  // ── 分类 / 难度 / 时间 ────────────────────────────────────────────
  constants: {
    difficulty: ['', '新手', '简单', '中等', '困难', '大师'],
    cookTime: {
      quick: '快手（<15 分钟）',
      medium: '适中（15-45 分钟）',
      long: '较长（45-90 分钟）',
      very_long: '慢工（>90 分钟）',
    },
    cookTimeShort: {
      quick: '快手',
      medium: '适中',
      long: '较长',
      very_long: '慢工',
    },
    categories: {
      meat_dish: '荤菜',
      vegetable_dish: '素菜',
      staple: '主食',
      aquatic: '水产',
      breakfast: '早餐',
      soup: '汤粥',
      drink: '饮品',
      dessert: '甜品',
      'semi-finished': '半成品',
      condiment: '酱料',
    },
  },

  // ── SEO ───────────────────────────────────────────────────────────
  seo: {
    siteName: '做饭指北',
    alternateName: 'HowToCook',
    defaultMetaDesc: '做饭指北 — 世界首个 AI 驱动的食谱百科与烹饪 Skill。',
  },

  // ── JSON-LD ───────────────────────────────────────────────────────
  jsonLd: {
    siteName: '做饭指北',
    alternateName: 'HowToCook',
    defaultCuisine: '中国菜',
    homeBreadcrumb: '首页',
  },

  // ── 错误信息 ──────────────────────────────────────────────────────
  error: {
    generic: '加载失败',
    recipeLoad: '加载菜谱失败',
    networkError: '网络错误，请检查连接后重试',
    notFound: '页面未找到',
    somethingWrong: '页面加载异常，请',
    backHome: '返回首页',
  },

  // ── SourceNav ─────────────────────────────────────────────────────
  sourceNav: {
    all: '全部',
    suibianzuo: '随便做',
    noodleGod: '面食之神',
  },

  // ── CategoryNav ───────────────────────────────────────────────────
  categoryNav: {
    all: '全部',
  },

  // ── RecipeGrid ────────────────────────────────────────────────────
  recipeGrid: {
    emptyDefault: '该分类暂无菜谱',
  },

  // ── CollectionPage ────────────────────────────────────────────────
  collection: {
    loading: '加载中...',
    empty: '该合集暂无菜谱',
    error: '加载失败',
    notFound: '聚合页不存在',
    backHome: '← 返回首页',
    recipeCount: (n: number) => `${n} 道菜谱`,
    easyToMake: '简单易做',
  },
} as const;
