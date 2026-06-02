import { useState, useEffect } from 'react';
import type { UseEpicureResult } from '@/lib/epicure';
import type { InternationalRecipe } from '@/lib/epicure/types';
import { cosineSimilarity, getOrComputeRecipeEmbeddings } from '@/lib/epicure/engine';

interface RecipeInfo {
  id: string;
  name: string;
  similarity: number;
}

interface ClosestRecipesProps {
  ingredients: string[];
  epicure: UseEpicureResult;
}

const CUISINE_ZH: Record<string, string> = {
  african: '非洲', british: '英式', caribbean: '加勒比', chinese: '中式',
  french: '法式', german: '德式', indian: '印度', irish: '爱尔兰',
  italian: '意大利', japanese: '日式', jewish: '犹太', korean: '韩式',
  mexican: '墨西哥', moroccan: '摩洛哥', russian: '俄式', thai: '泰式',
  vietnamese: '越南',
};

// Shared module-level recipe data cache — fetched once across components
let recipeDataCache: Array<{ id: string; name: string; ingredients: string[] }> | undefined;

async function getRecipeList(): Promise<Array<{ id: string; name: string; ingredients: string[] }>> {
  if (recipeDataCache) return recipeDataCache;
  const resp = await fetch('/data/recipes-meta.json');
  if (!resp.ok) return [];
  const categories: Array<{ recipes: Array<{ id: string; name: string; ingredients: string[] }> }> =
    await resp.json();
  const all: Array<{ id: string; name: string; ingredients: string[] }> = [];
  for (const cat of categories) {
    for (const r of cat.recipes) {
      all.push(r);
    }
  }
  recipeDataCache = all;
  return all;
}

export function ClosestRecipes({ ingredients, epicure }: ClosestRecipesProps) {
  const [recipes, setRecipes] = useState<RecipeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [intlRecipes, setIntlRecipes] = useState<Array<InternationalRecipe & { matchCount: number }>>([]);
  const [intlLoading, setIntlLoading] = useState(false);
  const [intlExpanded, setIntlExpanded] = useState(false);

  // Local recipes (cosine similarity)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const vecs: Float32Array[] = [];
      for (const ing of ingredients) {
        const idx = epicure.getIngredientIndex(ing);
        if (idx !== undefined) {
          const emb = epicure.getEmbedding(idx);
          if (emb) vecs.push(emb);
        }
      }

      if (vecs.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const dims = vecs[0].length;
      const composite = new Float32Array(dims);
      for (let d = 0; d < dims; d++) {
        let sum = 0;
        for (const v of vecs) sum += v[d];
        composite[d] = sum / vecs.length;
      }

      const allRecipes = await getRecipeList();
      if (allRecipes.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      await epicure.loadPrecomputedRecipeEmbeddings(allRecipes.map((r) => r.id));
      const recipeEmbMap = getOrComputeRecipeEmbeddings(allRecipes);

      const scored: RecipeInfo[] = [];
      for (const r of allRecipes) {
        const rEmb = recipeEmbMap.get(r.id);
        if (!rEmb) continue;
        const sim = cosineSimilarity(composite, rEmb);
        scored.push({ id: r.id, name: r.name, similarity: sim });
      }

      scored.sort((a, b) => b.similarity - a.similarity);
      if (!cancelled) {
        setRecipes(scored.slice(0, 5));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ingredients, epicure]);

  // International recipes (ingredient intersection)
  useEffect(() => {
    let cancelled = false;
    setIntlLoading(true);

    async function loadIntl() {
      await epicure.loadInternationalRecipes();
      if (cancelled) return;

      // Collect recipes per ingredient, then find intersection
      const recipeSets: Map<string, Set<string>>[] = ingredients.map(() => new Map());
      const allIntl = new Map<string, InternationalRecipe & { matchCount: number }>();

      for (let i = 0; i < ingredients.length; i++) {
        const results = epicure.getInternationalRecipes(ingredients[i]);
        for (const r of results) {
          if (!recipeSets[i].has(r.cuisine)) recipeSets[i].set(r.cuisine, new Set());
          recipeSets[i].get(r.cuisine)!.add(r.id);

          const existing = allIntl.get(r.id);
          if (existing) {
            existing.matchCount = Math.max(existing.matchCount, i + 1);
          } else {
            allIntl.set(r.id, { ...r, matchCount: 1 });
          }
        }
      }

      // Count how many ingredients each recipe matches
      const matchCounts = new Map<string, number>();
      for (const r of allIntl.values()) {
        matchCounts.set(r.id, (matchCounts.get(r.id) ?? 0) + 1);
      }

      // Filter: keep recipes matching >= 2 ingredients, or all if only 1 ingredient has intl recipes
      const hasMultiMatch = Array.from(matchCounts.values()).some(c => c >= 2);
      const filtered = Array.from(allIntl.values())
        .map(r => ({ ...r, matchCount: matchCounts.get(r.id) ?? 1 }))
        .filter(r => hasMultiMatch ? r.matchCount >= 2 : true)
        .sort((a, b) => b.matchCount - a.matchCount);

      if (!cancelled) {
        setIntlRecipes(filtered.slice(0, 30));
        setIntlLoading(false);
      }
    }

    loadIntl();
    return () => { cancelled = true; };
  }, [ingredients, epicure]);

  // Group international recipes by cuisine
  const intlByCuisine = intlRecipes.reduce<Record<string, typeof intlRecipes>>((acc, r) => {
    (acc[r.cuisine] ??= []).push(r);
    return acc;
  }, {});
  const cuisineKeys = Object.keys(intlByCuisine).sort((a, b) => intlByCuisine[b].length - intlByCuisine[a].length);

  return (
    <div className="space-y-6">
      {/* Local recipes */}
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-4">最近菜谱</h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-container rounded-lg" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <p className="text-sm text-on-surface-variant">未找到相关菜谱</p>
        ) : (
          <div className="space-y-2">
            {recipes.map((r) => (
              <a
                key={r.id}
                href={`/recipe/${encodeURIComponent(r.id)}`}
                className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 transition hover:border-primary hover:bg-primary-container"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-sm">🍳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{r.name}</p>
                </div>
                <span className="text-xs text-on-surface-variant shrink-0">{(r.similarity * 100).toFixed(0)}%</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* International recipes */}
      {intlLoading ? null : intlRecipes.length > 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <button
            onClick={() => setIntlExpanded(!intlExpanded)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="font-display text-headline-sm text-on-surface">
              国际菜谱
              <span className="ml-2 text-sm font-body text-on-surface-variant">
                {intlRecipes.length} 道 · {cuisineKeys.length} 个菜系
              </span>
            </h3>
            <span className="text-on-surface-variant text-sm">
              {intlExpanded ? '▲' : '▼'}
            </span>
          </button>

          {intlExpanded && (
            <div className="mt-4 space-y-4">
              {cuisineKeys.map((cuisine) => (
                <div key={cuisine}>
                  <h4 className="text-sm font-medium text-on-surface-variant mb-2">
                    {CUISINE_ZH[cuisine] ?? cuisine}
                    <span className="ml-1 text-xs text-on-surface-variant/60">
                      ({intlByCuisine[cuisine].length})
                    </span>
                  </h4>
                  <div className="space-y-1">
                    {intlByCuisine[cuisine].slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                      >
                        {r.name}
                        {r.matchCount >= 2 && (
                          <span className="ml-2 text-xs text-primary">匹配 {r.matchCount} 种食材</span>
                        )}
                      </div>
                    ))}
                    {intlByCuisine[cuisine].length > 5 && (
                      <p className="text-xs text-on-surface-variant/60 pl-1">
                        +{intlByCuisine[cuisine].length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
