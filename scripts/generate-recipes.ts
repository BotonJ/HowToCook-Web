import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/dishes');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/recipes.json');
const INDEX_FILE = path.resolve(__dirname, '../../howtocook-skill/index.json');

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

interface Recipe {
  id: string;
  name: string;
  category: string;
  imagePath: string;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
  count: number;
  recipes: Recipe[];
}

function buildSourceMap(): Map<string, string> {
  const sourceMap = new Map<string, string>();
  if (!fs.existsSync(INDEX_FILE)) {
    console.warn(`Index file not found: ${INDEX_FILE}. Defaulting all recipes to "howtocook" source.`);
    return sourceMap;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  for (const dish of index.dishes) {
    sourceMap.set(dish.name, dish.source);
  }
  console.log(`Loaded ${sourceMap.size} recipe sources from index.`);
  return sourceMap;
}

function scanRecipes(): Category[] {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    return [];
  }

  const categories: Category[] = [];
  const dirs = fs.readdirSync(IMAGES_DIR).sort();
  const sourceMap = buildSourceMap();

  for (const dir of dirs) {
    const dirPath = path.join(IMAGES_DIR, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    
    // Skip if not in our mapping (e.g. tips)
    if (!CATEGORY_MAP[dir]) continue;

    const recipes: Recipe[] = [];
    const files = fs.readdirSync(dirPath).sort();

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files
      
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        const name = path.basename(file, ext);
        const source = sourceMap.get(name) ?? 'howtocook';
        recipes.push({
          id: `${source}/${name}`,
          name,
          category: dir,
          // Store path relative to public
          imagePath: `images/dishes/${dir}/${file}`
        });
      }
    }

    if (recipes.length > 0) {
      categories.push({
        id: dir,
        name: dir,
        displayName: CATEGORY_MAP[dir],
        count: recipes.length,
        recipes
      });
    }
  }

  return categories;
}

function main() {
  const categories = scanRecipes();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(categories, null, 2));
  console.log(`Generated ${categories.length} categories with ${categories.reduce((acc, c) => acc + c.recipes.length, 0)} recipes.`);
}

main();
