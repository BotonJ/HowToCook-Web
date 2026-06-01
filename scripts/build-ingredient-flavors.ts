import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface FlavorVector {
  sweet: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fatty: number;
}

interface FlavorProfile extends FlavorVector {
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  nRecipes: number;
}

interface RecipeCategory {
  id: string;
  recipes: Array<{
    id: string;
    ingredients: string[];
    [key: string]: unknown;
  }>;
}

// Tier 1: expert-annotated ingredients (from HTML prototype)
const EXPERT_ANNOTATIONS: Record<string, FlavorVector> = {
  chicken: { sweet: 6.7, sour: 6.5, bitter: 7.0, umami: 8.1, spicy: 4.7, fatty: 6.5 },
  pork: { sweet: 6.3, sour: 5.6, bitter: 4.7, umami: 7.1, spicy: 4.2, fatty: 3.9 },
  beef: { sweet: 6.1, sour: 6.2, bitter: 6.5, umami: 7.6, spicy: 3.7, fatty: 5.5 },
  egg: { sweet: 5.2, sour: 5.6, bitter: 4.1, umami: 6.5, spicy: 4.1, fatty: 3.0 },
  tofu: { sweet: 6.2, sour: 6.4, bitter: 4.9, umami: 7.6, spicy: 4.2, fatty: 3.6 },
  tomato: { sweet: 7.6, sour: 8.2, bitter: 7.8, umami: 7.5, spicy: 4.7, fatty: 5.9 },
  potato: { sweet: 7.1, sour: 8.1, bitter: 7.7, umami: 8.0, spicy: 4.9, fatty: 6.6 },
  carrot: { sweet: 5.2, sour: 6.1, bitter: 5.2, umami: 7.1, spicy: 4.1, fatty: 4.6 },
  cabbage: { sweet: 6.4, sour: 6.3, bitter: 4.6, umami: 7.6, spicy: 4.3, fatty: 3.4 },
  eggplant: { sweet: 6.8, sour: 6.9, bitter: 5.0, umami: 7.3, spicy: 4.8, fatty: 3.9 },
  bell_pepper: { sweet: 7.2, sour: 6.7, bitter: 5.8, umami: 7.5, spicy: 4.9, fatty: 4.9 },
  pork_belly: { sweet: 6.1, sour: 6.0, bitter: 5.0, umami: 6.3, spicy: 4.2, fatty: 4.0 },
  chicken_thigh: { sweet: 6.7, sour: 6.3, bitter: 6.8, umami: 7.1, spicy: 4.4, fatty: 5.9 },
  shiitake_mushroom: { sweet: 7.0, sour: 7.4, bitter: 3.7, umami: 7.4, spicy: 5.9, fatty: 3.2 },
  chinese_celery: { sweet: 7.2, sour: 7.3, bitter: 5.4, umami: 7.1, spicy: 5.2, fatty: 4.2 },
};

const DATA_DIR = resolve('public/data');
const OUT_PATH = resolve('public/data/epicure/ingredient-flavor-profiles.json');

function main() {
  const recipes: RecipeCategory[] = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'recipes.json'), 'utf-8')
  );
  const flavorProfiles: Record<string, FlavorVector> = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'epicure/flavor-profiles.json'), 'utf-8')
  );
  const zhToEpicure: Record<string, string> = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'epicure/zh_to_epicure.json'), 'utf-8')
  );

  // Build mapping: Chinese ingredient -> list of recipe flavor vectors
  const ingredientRecipes: Record<string, FlavorVector[]> = {};

  for (const category of recipes) {
    for (const recipe of category.recipes) {
      const flavor = flavorProfiles[recipe.id];
      if (!flavor) continue;

      for (const ing of recipe.ingredients) {
        if (!ingredientRecipes[ing]) ingredientRecipes[ing] = [];
        ingredientRecipes[ing].push(flavor);
      }
    }
  }

  // Compute derived profiles for mapped ingredients
  const derived: Record<string, FlavorProfile> = {};

  for (const [zhName, vectors] of Object.entries(ingredientRecipes)) {
    const enName = zhToEpicure[zhName];
    if (!enName) continue;

    const n = vectors.length;
    const avg: FlavorVector = {
      sweet: vectors.reduce((s, v) => s + v.sweet, 0) / n,
      sour: vectors.reduce((s, v) => s + v.sour, 0) / n,
      bitter: vectors.reduce((s, v) => s + v.bitter, 0) / n,
      umami: vectors.reduce((s, v) => s + v.umami, 0) / n,
      spicy: vectors.reduce((s, v) => s + v.spicy, 0) / n,
      fatty: vectors.reduce((s, v) => s + v.fatty, 0) / n,
    };

    derived[enName] = {
      ...avg,
      tier: n >= 3 ? 2 : 3,
      confidence: Math.min(1.0, n / 10),
      nRecipes: n,
    };
  }

  // Merge expert annotations as Tier 1
  for (const [enName, flavor] of Object.entries(EXPERT_ANNOTATIONS)) {
    derived[enName] = {
      ...flavor,
      tier: 1,
      confidence: 1.0,
      nRecipes: derived[enName]?.nRecipes ?? 0,
    };
  }

  // Add Tier 4 entries for all epicure vocab items not in derived
  const epicureVocab: Record<string, string> = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'epicure/epicure_vocab_zh.json'), 'utf-8')
  );

  for (const enName of Object.keys(epicureVocab)) {
    if (!derived[enName]) {
      derived[enName] = {
        sweet: 5.0,
        sour: 5.0,
        bitter: 5.0,
        umami: 5.0,
        spicy: 5.0,
        fatty: 5.0,
        tier: 4,
        confidence: 0,
        nRecipes: 0,
      };
    }
  }

  // Sort keys alphabetically for stable output
  const sorted: Record<string, FlavorProfile> = {};
  for (const key of Object.keys(derived).sort()) {
    sorted[key] = derived[key];
  }

  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2));

  const tiers = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const p of Object.values(sorted)) {
    tiers[p.tier]++;
  }

  console.log(`Generated ${Object.keys(sorted).length} ingredient flavor profiles:`);
  console.log(`  Tier 1 (expert): ${tiers[1]}`);
  console.log(`  Tier 2 (high confidence, >=3 recipes): ${tiers[2]}`);
  console.log(`  Tier 3 (reference, 1-2 recipes): ${tiers[3]}`);
  console.log(`  Tier 4 (mode only): ${tiers[4]}`);
  console.log(`Written to ${OUT_PATH}`);
}

main();
