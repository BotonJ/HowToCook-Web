import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILES = [
  path.join(PROJECT_ROOT, 'src/data/recipes.json'),
  path.join(PROJECT_ROOT, 'public/data/recipes.json'),
  path.join(PROJECT_ROOT, 'public/data/recipes-index.json'),
];

interface Recipe {
  id?: string;
  name: string;
  source?: string;
  category?: string;
  difficulty?: number;
}

interface Category {
  id: string;
  recipes: Recipe[];
}

let errors = 0;
let totalRecipes = 0;

function checkFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  文件不存在，跳过: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let data: Category[];
  try {
    data = JSON.parse(content);
  } catch {
    console.error(`  ❌  JSON 解析失败: ${filePath}`);
    errors++;
    return;
  }

  if (!Array.isArray(data)) {
    console.error(`  ❌  格式错误（不是数组）: ${filePath}`);
    errors++;
    return;
  }

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
    }
  }

  if (fileErrors === 0) {
    console.log(`  ✅  ${fileName}: ${fileTotal} 条通过`);
  }
  errors += fileErrors;
  totalRecipes += fileTotal;
}

console.log('=== 菜谱数据预检查 ===');
for (const f of DATA_FILES) {
  checkFile(f);
}

console.log(`\n合计: ${totalRecipes} 条菜谱`);
if (errors > 0) {
  console.error(`❌  预检查失败: ${errors} 项异常`);
  process.exit(1);
} else {
  console.log('✅  预检查全部通过');
}
