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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // blank line
    if (!trimmed) { i++; continue; }

    // heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineMarkup(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // table
    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().match(/^\|[\s\-:|]+\|$/)) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j].trim());
        j++;
      }
      html.push(buildTable(tableLines));
      i = j;
      continue;
    }

    // blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>${quoteLines.map(l => `<p>${inlineMarkup(l)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // unordered list
    if (trimmed.match(/^[*\-]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[*\-]\s/)) {
        listItems.push(inlineMarkup(lines[i].trim().replace(/^[*\-]\s+/, '')));
        i++;
      }
      html.push(`<ul>${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`);
      continue;
    }

    // ordered list
    if (trimmed.match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        listItems.push(inlineMarkup(lines[i].trim().replace(/^\d+\.\s+/, '')));
        i++;
      }
      html.push(`<ol>${listItems.map(item => `<li>${item}</li>`).join('')}</ol>`);
      continue;
    }

    // footnote definition  * ^1: text
    if (trimmed.match(/^\*\s+\^(\d+):\s/)) {
      // render as a small note paragraph
      const fnText = trimmed.replace(/^\*\s+\^(\d+):\s*/, '');
      html.push(`<p class="footnote"><small>${inlineMarkup(fnText)}</small></p>`);
      i++;
      continue;
    }

    // regular paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('>') && !lines[i].trim().match(/^[*\-]\s/) && !lines[i].trim().match(/^\d+\.\s/)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      html.push(`<p>${inlineMarkup(paraLines.join(' '))}</p>`);
    }
  }

  return html.join('\n');
}

function inlineMarkup(text: string): string {
  let s = escapeHtml(text);
  // restore HTML entities that were in the original markdown
  s = s.replace(/&amp;deg;/g, '&deg;');
  s = s.replace(/&amp;#x2103;/g, '&#x2103;');
  // bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic *text* (but not inside <strong> or list markers)
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // inline code `text`
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // footnote refs [^1]
  s = s.replace(/\[\^(\d+)\]/g, '<sup>[$1]</sup>');
  return s;
}

function buildTable(tableLines: string[]): string {
  const parseRow = (row: string) =>
    row.split('|').slice(1, -1).map(cell => cell.trim());

  const headerCells = parseRow(tableLines[0]);
  // skip separator line (index 1)
  const bodyRows = tableLines.slice(2).map(parseRow);

  const thead = `<thead><tr>${headerCells.map(c => `<th>${inlineMarkup(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${bodyRows.map(row => `<tr>${row.map(c => `<td>${inlineMarkup(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;

  return `<table>${thead}${tbody}</table>`;
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

    const htmlContent = markdownToHtml(content);
    // strip the first <h1> since TipDetail renders title separately
    const contentWithoutH1 = htmlContent.replace(/^<h1>.*?<\/h1>\n?/, '');

    tips.push({
      slug,
      title,
      summary,
      category: CATEGORY_MAP[name] || 'technique',
      content: contentWithoutH1,
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tips, null, 2));
  console.log(`Generated ${tips.length} tips`);
}

main();
