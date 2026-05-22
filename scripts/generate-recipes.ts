import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/dishes');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/recipes.json');

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

function scanRecipes(): Category[] {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    return [];
  }

  const categories: Category[] = [];
  const dirs = fs.readdirSync(IMAGES_DIR);

  for (const dir of dirs) {
    const dirPath = path.join(IMAGES_DIR, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    
    // Skip if not in our mapping (e.g. tips)
    if (!CATEGORY_MAP[dir]) continue;

    const recipes: Recipe[] = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files
      
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        const name = path.basename(file, ext);
        recipes.push({
          id: `${dir}-${name}`,
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

const categories = scanRecipes();
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(categories, null, 2));
console.log(`Generated ${categories.length} categories with ${categories.reduce((acc, c) => acc + c.recipes.length, 0)} recipes.`);
