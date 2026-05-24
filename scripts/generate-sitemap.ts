import { readdirSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://howtocook.cn';
const DISHES_DIR = resolve(__dirname, '../../howtocook-skill/dishes');

function getRecipeNames(): string[] {
  const names: string[] = [];

  function scanDir(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanDir(join(dir, entry.name));
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        const name = entry.name.replace(/\.md$/, '');
        names.push(name);
      }
    }
  }

  scanDir(DISHES_DIR);
  return names;
}

function generateSitemap(names: string[]): string {
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    ...names.map(name => ({
      loc: `${SITE_URL}/recipe/${encodeURIComponent(name)}`,
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

const names = getRecipeNames();
const sitemap = generateSitemap(names);
const outPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outPath, sitemap, 'utf-8');
console.log(`Generated sitemap.xml with ${names.length} recipes`);
