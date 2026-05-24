import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/dishes');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/recipes.json');
const INDEX_FILE = path.resolve(__dirname, '../../howtocook-skill/index.json');
const DISHES_DIR = path.resolve(__dirname, '../../howtocook-skill/dishes');

const CATEGORY_MAP: Record<string, string> = {
  'tips': '基础操作',
  'vegetable_dish': '素菜',
  'meat_dish': '荤菜',
  'aquatic': '水产',
  'breakfast': '早餐',
  'staple': '主食',
  'semi-finished': '半成品加工',
  'soup': '汤与粥',
  'drink': '饮料',
  'condiment': '酱料和其它材料',
  'dessert': '甜品'
};

interface IndexDish {
  name: string;
  difficulty: number;
  category: string;
  source: string;
  path: string;
  ingredients: string[];
  cuisine: string;
  cooking_method: string;
  cook_time: string;
  main_ingredients: string[];
  tags: {
    spicy: boolean;
    allergens: string[];
    diet: string[];
  };
  has_duplicate: boolean;
  id: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  imagePath?: string;
  difficulty: number;
  cuisine: string;
  cooking_method: string;
  cook_time: string;
  ingredients: string[];
  main_ingredients: string[];
  tags?: {
    spicy?: boolean;
    allergens?: string[];
    diet?: string[];
  };
  source: string;
  description?: string;
  ingredients_text?: string;
  calculation_text?: string;
  steps_text?: string;
  extra_text?: string;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
  count: number;
  recipes: Recipe[];
}

function parseMarkdownSections(content: string): {
  description: string;
  ingredients_text: string;
  calculation_text: string;
  steps_text: string;
  extra_text: string;
} {
  const lines = content.split('\n');
  let description = '';
  let ingredients_text = '';
  let calculation_text = '';
  let steps_text = '';
  let extra_text = '';

  let currentSection: string | null = null;
  let sectionLines: string[] = [];
  let foundTitle = false;

  for (const line of lines) {
    const stripped = line.trim();

    // Detect title
    if (stripped.match(/^#\s+.+的做法/)) {
      foundTitle = true;
      continue;
    }

    // Detect difficulty line - skip it
    if (stripped.includes('预估烹饪难度')) {
      // If we haven't found description yet, the lines before this are description
      if (!description && sectionLines.length > 0) {
        description = sectionLines.join('\n').trim();
        sectionLines = [];
      }
      continue;
    }

    // Detect section headers
    if (stripped.startsWith('##')) {
      // Save previous section
      if (currentSection && sectionLines.length > 0) {
        const text = sectionLines.join('\n').trim();
        switch (currentSection) {
          case 'ingredients':
            ingredients_text = text;
            break;
          case 'calculations':
            calculation_text = text;
            break;
          case 'steps':
            steps_text = text;
            break;
          case 'tips':
            extra_text = text;
            break;
        }
      }

      const section = stripped.slice(2).trim();
      if (section.includes('必备原料')) {
        currentSection = 'ingredients';
      } else if (section.includes('计算')) {
        currentSection = 'calculations';
      } else if (section.includes('操作')) {
        currentSection = 'steps';
      } else if (section.includes('附加')) {
        currentSection = 'tips';
      } else {
        currentSection = null;
      }
      sectionLines = [];
      continue;
    }

    // Collect lines for current section or description
    if (foundTitle && !currentSection && stripped && !stripped.startsWith('![')) {
      // This is description text before any section
      sectionLines.push(line);
    } else if (currentSection) {
      sectionLines.push(line);
    }
  }

  // Save last section
  if (currentSection && sectionLines.length > 0) {
    const text = sectionLines.join('\n').trim();
    switch (currentSection) {
      case 'ingredients':
        ingredients_text = text;
        break;
      case 'calculations':
        calculation_text = text;
        break;
      case 'steps':
        steps_text = text;
        break;
      case 'tips':
        extra_text = text;
        break;
    }
  } else if (!description && sectionLines.length > 0) {
    description = sectionLines.join('\n').trim();
  }

  return { description, ingredients_text, calculation_text, steps_text, extra_text };
}

function buildIndexMap(): Map<string, IndexDish> {
  const indexMap = new Map<string, IndexDish>();
  if (!fs.existsSync(INDEX_FILE)) {
    console.warn(`Index file not found: ${INDEX_FILE}`);
    return indexMap;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  for (const dish of index.dishes) {
    indexMap.set(dish.name, dish);
  }
  console.log(`Loaded ${indexMap.size} recipes from index.`);
  return indexMap;
}

function buildImageMap(): Map<string, string> {
  const imageMap = new Map<string, string>();
  if (!fs.existsSync(IMAGES_DIR)) {
    console.warn(`Images directory not found: ${IMAGES_DIR}`);
    return imageMap;
  }

  const dirs = fs.readdirSync(IMAGES_DIR).sort();
  for (const dir of dirs) {
    const dirPath = path.join(IMAGES_DIR, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const files = fs.readdirSync(dirPath).sort();
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        const name = path.basename(file, ext);
        imageMap.set(name, `images/dishes/${dir}/${file}`);
      }
    }
  }

  console.log(`Found ${imageMap.size} recipe images.`);
  return imageMap;
}

function readMarkdownFile(source: string, recipePath: string): string | null {
  const fullPath = path.join(DISHES_DIR, '..', recipePath);
  if (!fs.existsSync(fullPath)) {
    // Try relative to DISHES_DIR
    const altPath = path.join(DISHES_DIR, recipePath.replace('dishes/', ''));
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf8');
    }
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function scanRecipes(): Category[] {
  const indexMap = buildIndexMap();
  const imageMap = buildImageMap();

  // Group recipes by category
  const categoryRecipes = new Map<string, Recipe[]>();

  for (const [name, dish] of indexMap) {
    const category = dish.category;
    if (!CATEGORY_MAP[category]) {
      console.warn(`Unknown category: ${category} for recipe ${name}`);
      continue;
    }

    // Read markdown file for text content
    const markdownContent = readMarkdownFile(dish.source, dish.path);
    let textContent = {
      description: '',
      ingredients_text: '',
      calculation_text: '',
      steps_text: '',
      extra_text: ''
    };

    if (markdownContent) {
      textContent = parseMarkdownSections(markdownContent);
    } else {
      console.warn(`Could not read markdown for: ${name} (${dish.path})`);
    }

    // Build recipe with all fields
    const recipe: Recipe = {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      imagePath: imageMap.get(name),
      difficulty: dish.difficulty,
      cuisine: dish.cuisine,
      cooking_method: dish.cooking_method,
      cook_time: dish.cook_time,
      ingredients: dish.ingredients,
      main_ingredients: dish.main_ingredients,
      tags: dish.tags,
      source: dish.source,
      description: textContent.description || undefined,
      ingredients_text: textContent.ingredients_text || undefined,
      calculation_text: textContent.calculation_text || undefined,
      steps_text: textContent.steps_text || undefined,
      extra_text: textContent.extra_text || undefined
    };

    if (!categoryRecipes.has(category)) {
      categoryRecipes.set(category, []);
    }
    categoryRecipes.get(category)!.push(recipe);
  }

  // Build categories array
  const categories: Category[] = [];
  for (const [categoryId, recipes] of categoryRecipes) {
    recipes.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    categories.push({
      id: categoryId,
      name: categoryId,
      displayName: CATEGORY_MAP[categoryId],
      count: recipes.length,
      recipes
    });
  }

  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

function main() {
  const categories = scanRecipes();
  const totalRecipes = categories.reduce((acc, c) => acc + c.recipes.length, 0);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(categories, null, 2));
  console.log(`Generated ${categories.length} categories with ${totalRecipes} recipes.`);

  // Verify field completeness
  let missingFields = 0;
  for (const category of categories) {
    for (const recipe of category.recipes) {
      if (!recipe.difficulty) missingFields++;
      if (!recipe.cuisine) missingFields++;
      if (!recipe.cooking_method) missingFields++;
      if (!recipe.cook_time) missingFields++;
      if (!recipe.ingredients?.length) missingFields++;
    }
  }
  if (missingFields > 0) {
    console.warn(`Warning: ${missingFields} recipes have missing required fields.`);
  }
}

main();
