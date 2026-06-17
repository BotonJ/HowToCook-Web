import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface Recipe {
  id?: string;
  name: string;
  source?: string;
  category?: string;
  difficulty?: number;
  cuisine?: string;
  cooking_method?: string;
  cook_time?: string;
  ingredients?: string[];
}

interface Category {
  id: string;
  recipes: Recipe[];
}

const DATA_FILES: { file: string; required: boolean }[] = [
  // Public data is what the deployed website actually fetches at runtime.
  { file: path.join(PROJECT_ROOT, 'public/data/recipes-meta.json'), required: true },
  { file: path.join(PROJECT_ROOT, 'public/data/recipes-detail.json'), required: true },
  // src/data is used by local scripts; keep it in sync with public/data.
  { file: path.join(PROJECT_ROOT, 'src/data/recipes-meta.json'), required: true },
  { file: path.join(PROJECT_ROOT, 'src/data/recipes-detail.json'), required: true },
];

let errors = 0;
let totalRecipes = 0;

function loadCategories(filePath: string): Category[] | null {
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌  文件不存在: ${filePath}`);
    errors++;
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    const data = JSON.parse(content) as Category[];
    if (!Array.isArray(data)) {
      console.error(`  ❌  格式错误（不是数组）: ${filePath}`);
      errors++;
      return null;
    }
    return data;
  } catch {
    console.error(`  ❌  JSON 解析失败: ${filePath}`);
    errors++;
    return null;
  }
}

function checkFile(filePath: string) {
  const data = loadCategories(filePath);
  if (!data) return;

  const fileName = path.basename(filePath);
  let fileErrors = 0;
  let fileTotal = 0;

  for (const cat of data) {
    if (!cat.recipes) continue;
    for (const recipe of cat.recipes) {
      fileTotal++;

      // 检查 id 存在且为 source/name 格式
      if (!recipe.id || typeof recipe.id !== 'string') {
        console.error(`  ❌  [${fileName}] 缺少 id: ${recipe.name}`);
        fileErrors++;
        continue;
      }
      if (recipe.id.split('/').length !== 2) {
        console.error(`  ❌  [${fileName}] id 格式错误: ${recipe.id} (应为 source/name)`);
        fileErrors++;
      }

      // 检查必填字段
      if (!recipe.name) {
        console.error(`  ❌  [${fileName}] 缺少 name (id: ${recipe.id})`);
        fileErrors++;
      }
      if (!recipe.difficulty) {
        console.error(`  ❌  [${fileName}] 缺少 difficulty (id: ${recipe.id})`);
        fileErrors++;
      }
      if (!recipe.cuisine) {
        console.error(`  ❌  [${fileName}] 缺少 cuisine (id: ${recipe.id})`);
        fileErrors++;
      }
      if (!recipe.cooking_method) {
        console.error(`  ❌  [${fileName}] 缺少 cooking_method (id: ${recipe.id})`);
        fileErrors++;
      }
      if (!recipe.cook_time) {
        console.error(`  ❌  [${fileName}] 缺少 cook_time (id: ${recipe.id})`);
        fileErrors++;
      }
      if (!recipe.ingredients?.length) {
        console.error(`  ❌  [${fileName}] 缺少 ingredients (id: ${recipe.id})`);
        fileErrors++;
      }
    }
  }

  if (fileErrors === 0) {
    console.log(`  ✅  ${fileName}: ${fileTotal} 条通过`);
  }
  errors += fileErrors;
  totalRecipes += fileTotal;
}

function checkSync(srcPath: string, publicPath: string) {
  const srcData = loadCategories(srcPath);
  const publicData = loadCategories(publicPath);
  if (!srcData || !publicData) return;

  const srcIds = srcData.flatMap(c => c.recipes.map(r => r.id)).sort();
  const publicIds = publicData.flatMap(c => c.recipes.map(r => r.id)).sort();

  if (srcIds.length !== publicIds.length || srcIds.some((id, i) => id !== publicIds[i])) {
    console.error(`  ❌  src/data 与 public/data 不同步: ${path.basename(srcPath)}`);
    errors++;
  } else {
    console.log(`  ✅  src/data 与 public/data 同步: ${path.basename(srcPath)} (${srcIds.length} 条)`);
  }
}

console.log('=== 菜谱数据预检查 ===');
for (const { file } of DATA_FILES) {
  checkFile(file);
}

console.log('\n=== 数据同步检查 ===');
checkSync(
  path.join(PROJECT_ROOT, 'src/data/recipes-meta.json'),
  path.join(PROJECT_ROOT, 'public/data/recipes-meta.json'),
);
checkSync(
  path.join(PROJECT_ROOT, 'src/data/recipes-detail.json'),
  path.join(PROJECT_ROOT, 'public/data/recipes-detail.json'),
);

console.log(`\n合计: ${totalRecipes} 条菜谱（按文件累加）`);
if (errors > 0) {
  console.error(`❌  预检查失败: ${errors} 项异常`);
  process.exit(1);
} else {
  console.log('✅  预检查全部通过');
}
