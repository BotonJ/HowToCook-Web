import { getIngredients } from './ingredients';

export interface HowToCookRecipe {
  id: string;
  name: string;
  ingredients: string[];         // normalized to c3v2 IDs
  originalIngredients: string[]; // raw strings for display
  difficulty: 1 | 2 | 3;
  time: string;
  tags: string[];
  category: string;
  cuisine: string;
}

let recipes: HowToCookRecipe[] = [];
let loaded = false;

const NON_INGREDIENT_PATTERNS =
  /锅|碗|容器|器[^名]|袋[^子]|烤箱|炸锅|分蛋|打蛋|搅拌|料理机|擀面|保鲜|案板|砧板|削皮|量杯|量勺|滤网|蒸笼|模具|勺子|筷子|硅胶|铲子|温度计|厨房纸|锡纸|油纸|烘焙纸|烤盘|烤架|砂锅|电饭煲|高压锅|微波炉|空气炸|滤布|裱花|烤碗|纸杯|密封|食品袋|大碗|沸水|温水|开水|凉水|冷水|纯净水|秒表|定时器/i;

function normalizeIngredient(raw: string, vocabIds: Set<string>): string[] {
  let s = raw.trim();

  // Skip obviously non-ingredient items
  if (NON_INGREDIENT_PATTERNS.test(s)) return [];
  if (s.length > 15) return [];

  // Strip markdown links: [text](url) -> text
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Strip backticks
  s = s.replace(/`/g, '');
  // Strip [可选] etc
  s = s.replace(/\[.*?\]/g, '');
  // Strip quantity prefixes: digits + optional unit
  s = s.replace(
    /^[\d.]+\s*(°C|℃|°|g|kg|ml|l|个|只|根|片|块|勺|汤匙|茶匙|杯|把|条|朵|瓣|粒|颗|张|段|克|两|钱|斤|磅|mg|cm|mm|大|小|少|适|若)?\s*/i,
    ''
  );
  // Strip leading/trailing punctuation and whitespace
  s = s.replace(/^[，。、：；,.\s]+/, '');
  s = s.replace(/[，。、：；,.\s]+$/, '');

  if (!s || s.length < 1) return [];

  // If it contains separators, split and process each part
  if (/[、，,]/.test(s) && s.length > 4) {
    const parts = s
      .split(/[、，,]/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2 && p.length <= 8);
    return parts.filter((p) => vocabIds.has(p));
  }

  // Direct vocab match
  if (vocabIds.has(s)) return [s];

  return [];
}

export async function loadHowToCookRecipes(): Promise<void> {
  if (loaded) return;

  try {
    const resp = await fetch('/data/recipes-meta.json');
    if (!resp.ok) {
      loaded = true;
      return;
    }
    const categories = await resp.json();

    // Build vocab ID set from workbench ingredients
    const vocabIds = new Set(getIngredients().map((i) => i.id));

    // Flatten all recipes from all categories
    const allRecipes: HowToCookRecipe[] = [];
    for (const cat of categories) {
      for (const r of cat.recipes || []) {
        const matchedIds: string[] = [];
        const originalIngredients: string[] = [];
        for (const raw of r.ingredients || []) {
          const ids = normalizeIngredient(raw, vocabIds);
          if (ids.length > 0) {
            matchedIds.push(...ids);
            originalIngredients.push(raw);
          }
        }

        // Only include recipes with at least 2 matched ingredients
        if (matchedIds.length >= 2) {
          const dedupedIds = [...new Set(matchedIds)];
          allRecipes.push({
            id: r.id || `${cat.id}/${r.name}`,
            name: r.name,
            ingredients: dedupedIds,
            originalIngredients: originalIngredients.slice(0, dedupedIds.length),
            difficulty: r.difficulty || 2,
            time:
              r.cook_time === 'quick'
                ? '15 min'
                : r.cook_time === 'medium'
                  ? '30 min'
                  : r.cook_time === 'slow'
                    ? '60+ min'
                    : '30 min',
            tags: [r.cuisine, r.cooking_method, cat.displayName].filter(Boolean),
            category: cat.displayName || cat.name,
            cuisine: r.cuisine || '',
          });
        }
      }
    }

    recipes = allRecipes;
  } catch {
    // Silently fail — recipes will be empty
  }
  loaded = true;
}

export function getHowToCookRecipes(): HowToCookRecipe[] {
  return recipes;
}

export function isHowToCookRecipesLoaded(): boolean {
  return loaded;
}
