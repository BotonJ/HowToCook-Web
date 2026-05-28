import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TIPS_DIR = path.resolve(__dirname, '../../howtocook-skill/dishes/tips');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/tips.json');

// 填充后格式: { '中文文件名': 'english-slug' }
const SLUG_MAP: Record<string, string> = {
  '油温判断技巧': 'oil-temperature',
  '食品安全': 'food-safety',
  '食材相克与禁忌': 'food-compatibility',
  '去腥': 'removing-fishy-smell',
};
const CATEGORY_MAP: Record<string, string> = {
  '油温判断技巧': 'technique',
  '食品安全': 'safety',
  '食材相克与禁忌': 'safety',
  '去腥': 'ingredient',
};

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function extractSummary(content: string): string {
  const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('```'));
  return lines[0]?.trim().slice(0, 120) || '';
}

function main() {
  if (!fs.existsSync(TIPS_DIR)) {
    console.warn(`Tips directory not found: ${TIPS_DIR}`);
    fs.writeFileSync(OUTPUT_FILE, '[]');
    return;
  }

  if (Object.keys(SLUG_MAP).length === 0) {
    console.log('SLUG_MAP is empty — generating empty tips.json');
    fs.writeFileSync(OUTPUT_FILE, '[]');
    return;
  }

  const tips: TipMeta[] = [];

  for (const file of fs.readdirSync(TIPS_DIR).sort()) {
    if (!file.endsWith('.md')) continue;

    const name = file.replace(/\.md$/, '');
    const slug = SLUG_MAP[name];
    if (!slug) continue;

    const content = fs.readFileSync(path.join(TIPS_DIR, file), 'utf8');
    const title = extractTitle(content) || name;
    const summary = extractSummary(content);

    tips.push({
      slug,
      title,
      summary,
      category: CATEGORY_MAP[name] || 'technique',
      content,
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tips, null, 2));
  console.log(`Generated ${tips.length} tips`);
}

main();
