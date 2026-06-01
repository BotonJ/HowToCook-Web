/**
 * 面食菜谱转换脚本
 * 将掌管面食的神的 MD 文件转换为 HowToCook Recipe 格式
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Recipe {
  id: string;
  name: string;
  category: string;
  source: string;
  difficulty: number;
  cook_time: string;
  cooking_method: string;
  cuisine: string;
  main_ingredients: string[];
  ingredients: string[];
  language: string;
  description?: string;
  steps_text?: string;
  extra_text?: string;
}

const SOURCE_DIR = '/Users/dor/Projects/recipe-work/samples/掌管面食的神';
const OUTPUT_FILE = join(__dirname, '../public/data/noodle-recipes.json');

// Map difficulty stars to number
function parseDifficulty(text: string): number {
  const stars = (text.match(/★/g) || []).length;
  return Math.min(stars, 5);
}

// Extract cook time from content
function parseCookTime(content: string): string {
  if (content.includes('分钟') || content.includes('min')) return 'quick';
  if (content.includes('小时') || content.includes('hour')) return 'long';
  return 'medium';
}

// Extract main ingredients
function parseMainIngredients(content: string): string[] {
  const ingredients: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('面粉') || line.includes('面')) {
      ingredients.push('flour');
      break;
    }
  }

  return ingredients;
}

// Extract ingredients list
function parseIngredients(content: string): string[] {
  const ingredients: string[] = [];
  const lines = content.split('\n');
  let inIngredientSection = false;

  for (const line of lines) {
    if (line.includes('必备原料') || line.includes('原料')) {
      inIngredientSection = true;
      continue;
    }
    if (inIngredientSection && line.startsWith('##')) {
      break;
    }
    if (inIngredientSection && line.startsWith('-')) {
      const item = line.replace(/^-\s*/, '').trim();
      if (item && !item.includes('主料') && !item.includes('辅料') && !item.includes('调味料')) {
        ingredients.push(item);
      }
    }
  }

  return ingredients;
}

// Extract steps
function parseSteps(content: string): string {
  const lines = content.split('\n');
  let steps = '';
  let inStepSection = false;

  for (const line of lines) {
    if (line.includes('## 操作') || line.includes('## 步骤') || line.includes('### 简易版本')) {
      inStepSection = true;
      continue;
    }
    if (inStepSection && (line.startsWith('## ') || line.startsWith('### 油泼辣子'))) {
      break;
    }
    if (inStepSection && line.trim()) {
      steps += line + '\n';
    }
  }

  return steps.trim();
}

// Extract recipe name from filename
function extractName(filename: string): string {
  // BV1BY2DBdEBh_油泼面.md -> 油泼面
  const match = filename.match(/_(.+)\.md$/);
  return match ? match[1] : filename.replace('.md', '');
}

// Convert a single MD file to Recipe
function convertRecipe(filename: string): Recipe | null {
  try {
    const content = readFileSync(join(SOURCE_DIR, filename), 'utf-8');
    const name = extractName(filename);

    // Skip non-recipe files
    if (filename === '视频链接索引.md') return null;

    // Extract difficulty
    const difficultyMatch = content.match(/预估烹饪难度：(★+)/);
    const difficulty = difficultyMatch ? parseDifficulty(difficultyMatch[1]) : 2;

    return {
      id: `noodle/${name}`,
      name,
      category: 'staple',
      source: 'noodle-god',
      difficulty,
      cook_time: parseCookTime(content),
      cooking_method: 'boil',
      cuisine: 'chinese',
      main_ingredients: parseMainIngredients(content),
      ingredients: parseIngredients(content),
      language: 'zh',
      description: content.match(/<!-- (.+?) -->/)?.[1] || '',
      steps_text: parseSteps(content),
    };
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
    return null;
  }
}

// Main
function main() {
  const files = readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));
  const recipes: Recipe[] = [];

  for (const file of files) {
    const recipe = convertRecipe(file);
    if (recipe) {
      recipes.push(recipe);
    }
  }

  console.log(`Converted ${recipes.length} recipes`);

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify({
    version: '1.0',
    total: recipes.length,
    source: 'noodle-god',
    dishes: recipes
  }, null, 2));

  console.log(`Written to ${OUTPUT_FILE}`);
}

main();
