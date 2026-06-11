/**
 * 烹饪学院内容转换脚本
 * 将 cook_mvp 的 MD 文件转换为 tips.json 格式
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Tip {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

const SOURCE_DIR = '/Users/dor/Projects/cook_mvp';
const OUTPUT_FILE = join(__dirname, '../src/data/cooking-academy.json');

// Module definitions (0-9)
const MODULES = [
  { file: '00_overview.md', slug: 'mvp-overview', category: 'overview' },
  { file: '01_pots.md', slug: 'pots', category: 'equipment' },
  { file: '02_knives.md', slug: 'knives', category: 'equipment' },
  { file: '03_cutting_boards.md', slug: 'cutting-boards', category: 'equipment' },
  { file: '04_utensils.md', slug: 'utensils', category: 'equipment' },
  { file: '05_seasonings.md', slug: 'seasonings', category: 'ingredient' },
  { file: '06_storage_cleaning.md', slug: 'storage-cleaning', category: 'safety' },
  { file: '07_tableware.md', slug: 'tableware', category: 'equipment' },
  { file: '08_stove_energy.md', slug: 'stove-energy', category: 'equipment' },
  { file: '09_safety.md', slug: 'safety', category: 'safety' },
];

// Extract title from markdown
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

// Extract summary (first paragraph after title)
function extractSummary(content: string): string {
  const lines = content.split('\n');
  let afterTitle = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      afterTitle = true;
      continue;
    }
    if (afterTitle && line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      return line.trim().substring(0, 150);
    }
  }

  return '';
}

// Convert a single module
function convertModule(file: string, slug: string, category: string): Tip | null {
  try {
    const content = readFileSync(join(SOURCE_DIR, file), 'utf-8');
    const title = extractTitle(content);
    const summary = extractSummary(content);

    return {
      slug,
      title,
      summary,
      category,
      content,
    };
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
    return null;
  }
}

// Main
function main() {
  const tips: Tip[] = [];

  for (const module of MODULES) {
    const tip = convertModule(module.file, module.slug, module.category);
    if (tip) {
      tips.push(tip);
    }
  }

  console.log(`Converted ${tips.length} modules`);

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(tips, null, 2));

  console.log(`Written to ${OUTPUT_FILE}`);
}

main();
