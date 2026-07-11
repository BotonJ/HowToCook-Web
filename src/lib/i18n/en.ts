/** English locale — covers all UI strings (not recipe content) */

export const en = {
  // ── Common ────────────────────────────────────────────────────────
  common: {
    loading: 'Loading...',
    loadingRecipes: 'Loading recipes...',
    retry: 'Retry',
    back: 'Back',
    backHome: '← Back to Home',
    all: 'All',
    more: 'More',
    copy: 'Copy',
    copied: 'Copied',
    search: 'Search',
    notFound: 'Not Found',
    comingSoon: 'coming soon',
  },

  // ── Navbar ────────────────────────────────────────────────────────
  nav: {
    siteName: 'HowToCook',
    academy: 'Cooking Academy',
    collections: 'Collections',
    explore: 'Flavor Workbench',
    about: 'About',
    credits: 'Credits',
    github: 'GitHub',
    collectionLabels: {
      // ── Chinese Collections (2026-06-02) ──────────────────────────────────
      'air-fryer': 'Air Fryer Series',
      'microwave': 'Microwave Quick Meals',
      'rice-cooker': 'Rice Cooker Recipes',
      'lazy-meal': 'Lazy Meals',
      'rice-killer': 'Rice Killers',
      'oven': 'Oven & Baking',
      // ── English Collections (original) ─────────────────────────────────────
      'chinese-recipes': 'Chinese Recipes',
      'chicken-recipes': 'Chicken',
      'baking': 'Baking',
      'pasta': 'Pasta',
    },
  },

  // ── Home ──────────────────────────────────────────────────────────
  home: {
    recipeCount: (n: number) => `${n} recipes`,
    searchPlaceholder: 'Search recipes...',
    emptySearch: 'No recipes found. Try different keywords.',
    emptyCategory: 'No recipes in this category.',
    category: 'Category',
    featured: 'Featured',
    recipes: (n: number) => `${n} recipes →`,
    metaDesc: 'HowToCook — The AI-powered recipe encyclopedia and cooking Skill.',
    sourceAll: 'All',
    sourceZh: 'Chinese',
    sourceEn: 'English',
    tagline: 'AI 驱动的食谱百科，让每一餐都有章可循', // TODO-i18n-en
    discoveryTitle: '探索发现', // TODO-i18n-en
    discoverySubtitle: '海量菜谱，按你的方式发现', // TODO-i18n-en
    curatedTitle: '精选合集', // TODO-i18n-en
    curatedSubtitle: '按场景策划的菜谱专题，一道一道攒出来', // TODO-i18n-en
    viewAllCollections: '查看全部合集', // TODO-i18n-en
  },

  // ── Recipe Detail ─────────────────────────────────────────────────
  recipe: {
    loading: 'Loading...',
    notFound: 'Recipe not found',
    backHome: 'Back to Home',
    back: 'Back',
    difficulty: 'Difficulty',
    time: 'Time',
    cuisine: 'Cuisine',
    method: 'Method',
    taste: 'Taste',
    spicy: 'Spicy',
    diet: 'Diet',
    flavorProfile: 'Flavor Profile',
    ingredients: 'Ingredients',
    amount: 'Amount',
    steps: 'Steps',
    tips: 'Tips',
    allergenNotice: 'Allergen Notice',
    descriptionSuffix: '',
  },

  // ── About ─────────────────────────────────────────────────────────
  about: {
    title: 'About HowToCook',
    metaTitle: 'About',
    metaDesc: 'HowToCook — AI-powered recipe platform with 500+ recipes across 17 cuisines, supporting MCP protocol.',
    intro: 'HowToCook is an AI-powered recipe platform providing precise, actionable cooking guides for everyone who cooks.',
    description1: '496 recipes covering 17 major cuisines including Sichuan, Cantonese, Shandong, and Hunan, with multi-dimensional filtering by difficulty, time, ingredients, and spice level. The preference learning system gets to know your taste the more you use it.',
    description2: 'The site also provides an MCP protocol interface, allowing AI assistants like Claude Code to directly call the recipe engine for smart recommendations and shopping list generation.',
    heroSubtitle: '从家常小炒到风味探索，AI 为你的每一餐提供精准指南。', // TODO-i18n-en
    statsTitle: '数据一览', // TODO-i18n-en
    stats: {
      recipes: '道菜谱', // TODO-i18n-en
      categories: '个分类', // TODO-i18n-en
    },
  },

  // ── Credits ───────────────────────────────────────────────────────
  credits: {
    title: 'Credits',
    metaTitle: 'Credits',
    metaDesc: 'Thanks to the HowToCook source repo, Sui Bo, Jing Gu Yuan, and other projects and creators for their contributions.',
    intro: 'Thanks to the following projects and creators for their contributions, continuously enriching HowToCook\'s recipe library.',
    visitProject: 'Visit Project →',
    items: {
      howtocook: {
        name: 'HowToCook Source Repo',
        description: 'Open-source recipe project (GitHub 100k+ stars), programmer-style recipes. Precisely quantified, steps with formulas.',
      },
      suibo: {
        name: 'Sui Bo Recipes',
        description: 'The viral state banquet chef Sui Bo, 140 easy/advanced recipes. Cook it casually, it\'s always delicious.',
      },
      jinguyuan: {
        name: 'Jing Gu Yuan',
        description: 'The first open-source dumpling restaurant Skill, signature dessert: milk fermented rice with egg.',
      },
      jingxiang: {
        name: 'king-jingxiang Recipe Images',
        description: 'Converts the original Markdown tutorials into beautifully styled recipe images using NanoBananaPro, making kitchen practice more intuitive.',
      },
    },
  },

  // ── Cooking Academy ───────────────────────────────────────────────
  tips: {
    title: 'Cooking Academy',
    metaTitle: 'Cooking Academy',
    metaDesc: 'Cooking fundamentals, technique tutorials, kitchen tips — data dashboard, content roadmap, and changelog, all in one place.',
    subtitle: 'Kitchen guide from scratch — recipes, techniques, terminology, continuously being built.',
    heroBadge: '正念烹饪', // TODO-i18n-en
    heroSubtitle: '通过基础技法、正念练习和对风味的深刻理解，掌握直觉式烹饪的艺术。', // TODO-i18n-en
    featuredTitle: '精选系列', // TODO-i18n-en
    featuredSubtitle: '正念厨房的核心知识。', // TODO-i18n-en
    startSeries: '开始学习', // TODO-i18n-en
    exploreTitle: '按学科探索', // TODO-i18n-en
    modules: (n: number) => `${n} 模块`, // TODO-i18n-en
    articles: (n: number) => `${n} 篇`, // TODO-i18n-en
    beginner: '入门', // TODO-i18n-en
    stats: {
      recipes: 'Recipes',
      terms: 'Terms',
      tutorials: 'Tutorials',
      upcoming: 'Coming Soon',
    },
    techniqueTutorials: 'Technique Tutorials',
    contentRoadmap: 'Content Roadmap',
    roadmapIntro: 'We are continuously building our content library. Here is the progress for each direction.',
    changelog: 'Changelog',
    status: {
      ready: 'Ready',
      building: 'Building',
      planned: 'Planned',
    },
    categoryLabels: {
      technique: 'Technique',
      equipment: 'Equipment',
      ingredient: 'Ingredient',
      safety: 'Safety',
    },
    roadmap: {
      techniqueTutorials: {
        title: 'Technique Tutorials',
        description: 'Stir-fry, steam, boil, marinate, blanch... 18 basic technique articles are ready',
      },
      glossary: {
        title: 'Glossary',
        description: '84 bilingual cooking terms covering knife skills, heat control, and seasoning',
      },
      recipeLibrary: {
        title: '15K Recipe Library',
        description: 'Full HowToCook open-source recipe integration, covering 17 major cuisines',
      },
      kitchenGuide: {
        title: 'Minimal Kitchen Guide',
        description: 'From pots and knives to food safety, 14-module beginner\'s manual',
      },
      videoTutorials: {
        title: 'Video Tutorials',
        description: 'Key techniques with short video demonstrations, intuitive and easy to learn',
      },
    },
    changelogEntries: {
      seoOptimization: {
        title: 'SEO Optimization Launched',
        description: 'Site-wide JSON-LD structured data, breadcrumb navigation, Open Graph tags completed.',
      },
      academyFramework: {
        title: 'Cooking Academy Framework Built',
        description: 'Added /tips route, TipDetail page, generate-tips data generation script.',
      },
      mcpBanner: {
        title: 'MCP Banner Launched',
        description: 'Homepage added Claude Code Skill installation guide with one-click copy.',
      },
      multiSource: {
        title: 'Multi-source Recipe Integration',
        description: 'Integrated Sui Bo and Jing Gu Yuan recipe data with source switching support.',
      },
      searchFeature: {
        title: 'Search Feature Launched',
        description: 'API search + local fallback, supporting real-time keyword search.',
      },
    },
  },

  // ── Tip Detail ────────────────────────────────────────────────────
  tipDetail: {
    notFoundTitle: 'Article Not Found',
    notFoundDesc: 'This article is not yet published. Please go back to the list to view published content.',
    backToAcademy: 'Back to Cooking Academy',
    defaultMetaTitle: 'Not Found',
    defaultMetaDesc: 'Cooking knowledge article',
  },

  // ── Flavor Workbench ───────────────────────────────────────────────
  explore: {
    title: 'Flavor Workbench',
    subtitle: 'Explore ingredient pairings, flavor profiles, and cuisine directions',
    metaDesc: 'Explore ingredient pairings, flavor profiles, and cuisine directions with our ingredient embedding engine.',
    searchPlaceholder: 'Search ingredients for flavor pairings...',
    searchHint: 'Search ingredients to discover flavor pairings',
    pairings: 'Pairings',
    cuisineExplore: 'Cuisine Explorer',
    seedPlaceholder: 'Select a seed ingredient...',
    cuisineDirection: 'Cuisine Direction',
    cuisineDirectionHint: 'Select a target cuisine. The system will shift from the seed ingredient toward the typical flavor direction of that cuisine.',
    blendAngle: 'Blend Angle',
    angleHint: '0° = keep original flavor, 90° = fully shift toward target cuisine. Larger angles recommend ingredients more characteristic of the target cuisine.',
    angleOriginal: '(original ingredient)',
    angleSlight: '(slight shift, flavor close to original)',
    angleMedium: '(medium shift, blending target cuisine traits)',
    angleLarge: '(large shift, approaching target cuisine flavor)',
    flavorCharacteristics: 'Flavor Characteristics',
    selectIngredient: 'Select an ingredient to view its flavor characteristics',
    exploreResult: 'Explore result: ',
    flavorAttribution: 'Flavor Attribution',
  },

  // ── MCP Banner ────────────────────────────────────────────────────
  mcp: {
    bannerText: 'Deploy the recipe engine locally with one command',
    instructions: 'Instructions',
    whatIsThis: 'What is this command for?',
    whatIsThisDesc: 'Download the HowToCook Skill locally. You can query recipes anytime through Claude Code, Hermes, Open Claw, and other Agents. The Skill leverages the Agent\'s own capabilities to provide recipe recommendations, ingredient purchase suggestions, and more. It automatically pairs with the server backend and silently pulls updates when the site adds new recipes or we improve the Skill. Check cycle: 7 days.',
    supportedPlatforms: 'Supported Platforms',
    supportedPlatformsDesc: 'Claude Code, Hermes, Open Claw, other Agents. If you have WeChat, Feishu, Telegram, or other messaging channels configured, you can also receive messages on your phone.',
    howToUse: 'How to use after copying?',
    howToUseDesc: '① Send to an Agent for automatic installation, then use normally',
    howToUseJoke: '② Yell "MOM!!!"',
    noAgent: 'No Agent or network?',
    noAgentDesc: 'Data can be used locally, or visit https://howtocook.cn',
    skillUpdate: 'How does the Skill update?',
    skillUpdateDesc: 'The Skill automatically pairs with the site backend\'s MCP. When the site adds recipes or we improve the Skill\'s functionality, it will automatically fetch updates, download silently, and won\'t take up much local space.',
  },

  // ── PWA ───────────────────────────────────────────────────────────
  pwa: {
    addToHome: 'Add to Home Screen',
  },

  // ── Flavor Dimensions ─────────────────────────────────────────────
  flavor: {
    sweet: 'Sweet',
    sour: 'Sour',
    umami: 'Umami',
    spicy: 'Spicy',
  },

  // ── Constants (difficulty / cook time / categories) ────────────────
  constants: {
    difficulty: ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'],
    cookTime: {
      quick: 'Quick (<15 min)',
      medium: 'Medium (15-45 min)',
      long: 'Long (45-90 min)',
      very_long: 'Slow (>90 min)',
    },
    cookTimeShort: {
      quick: 'Quick',
      medium: 'Medium',
      long: 'Long',
      very_long: 'Slow',
    },
    categories: {
      meat_dish: 'Meat',
      vegetable_dish: 'Vegetable',
      staple: 'Staple',
      aquatic: 'Seafood',
      breakfast: 'Breakfast',
      soup: 'Soup',
      drink: 'Drink',
      dessert: 'Dessert',
      'semi-finished': 'Semi-finished',
      condiment: 'Condiment',
    },
  },

  // ── SEO ───────────────────────────────────────────────────────────
  seo: {
    siteName: 'HowToCook',
    alternateName: 'HowToCook',
    defaultMetaDesc: 'HowToCook — The AI-powered recipe encyclopedia and cooking Skill.',
  },

  // ── JSON-LD ───────────────────────────────────────────────────────
  jsonLd: {
    siteName: 'HowToCook',
    alternateName: 'HowToCook',
    defaultCuisine: 'Chinese',
    homeBreadcrumb: 'Home',
  },

  // ── Error Messages ────────────────────────────────────────────────
  error: {
    generic: 'Failed to load',
    recipeLoad: 'Failed to load recipe',
    networkError: 'Network error. Please check your connection and try again.',
    notFound: 'Page Not Found',
    somethingWrong: 'Something went wrong.',
    backHome: 'Back to Home',
  },

  // ── SourceNav ─────────────────────────────────────────────────────
  sourceNav: {
    all: 'All',
    suibianzuo: 'Sui Bian Zuo',
    noodleGod: 'Noodle God',
  },

  // ── CategoryNav ───────────────────────────────────────────────────
  categoryNav: {
    all: 'All',
  },

  // ── RecipeGrid ────────────────────────────────────────────────────
  recipeGrid: {
    emptyDefault: 'No recipes in this category.',
  },

  // ── CollectionPage ────────────────────────────────────────────────
  collection: {
    loading: 'Loading...',
    empty: 'No recipes found in this collection.',
    error: 'Failed to load',
    notFound: 'Collection not found',
    backHome: '← Back to Home',
    recipeCount: (n: number) => `${n} 道菜谱`, // TODO-i18n-en
    easyToMake: '简单易做', // TODO-i18n-en
  },
} as const;
