import { readdirSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://howtocook.cn';
const DISHES_DIR = resolve(__dirname, '../../howtocook-skill/dishes');

const CATEGORY_IDS = [
  'meat_dish', 'vegetable_dish', 'staple', 'aquatic', 'breakfast',
  'soup', 'drink', 'dessert', 'semi-finished', 'condiment',
];

interface RecipeEntry {
  id: string;
  name: string;
}

function getRecipes(): RecipeEntry[] {
  const recipes: RecipeEntry[] = [];

  function scanDir(dir: string, source = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const nextSource = source || entry.name;
        scanDir(join(dir, entry.name), nextSource);
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        const name = entry.name.replace(/\.md$/, '');
        const id = source ? `${source}/${name}` : name;
        recipes.push({ id, name });
      }
    }
  }

  scanDir(DISHES_DIR);
  return recipes;
}

function generateSitemap(recipes: RecipeEntry[]): string {
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/credits`, priority: '0.3', changefreq: 'monthly' },
    ...CATEGORY_IDS.map(cat => ({
      loc: `${SITE_URL}/category/${cat}`,
      priority: '0.6',
      changefreq: 'weekly',
    })),
    ...recipes.map(r => ({
      loc: `${SITE_URL}/recipe/${encodeURIComponent(r.id)}`,
      priority: '0.7',
      changefreq: 'weekly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

const recipes = getRecipes();
const sitemap = generateSitemap(recipes);
const outPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outPath, sitemap, 'utf-8');
console.log(`Generated sitemap.xml with ${recipes.length} recipes`);
