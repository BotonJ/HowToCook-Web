import { useState, useEffect, useRef } from 'react';
import { cosineSimilarity, getOrComputeRecipeEmbeddings } from '@/lib/epicure/engine';

interface RecipeInfo {
  id: string;
  name: string;
  similarity: number;
}

interface ExploreRecipesProps {
  ingredient: string;
  getEmbedding: (index: number) => Float32Array | null;
  getIngredientIndex: (name: string) => number | undefined;
  zhMap: Record<string, string>;
}

// Shared module-level recipe data cache — fetched once across components
let recipeDataCache: Array<{ id: string; name: string; ingredients: string[] }> | undefined;

async function getRecipeList(): Promise<Array<{ id: string; name: string; ingredients: string[] }>> {
  if (recipeDataCache) return recipeDataCache;
  const resp = await fetch('/data/recipes.json');
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

export function ExploreRecipes({ ingredient, getEmbedding, getIngredientIndex, zhMap: _zhMap }: ExploreRecipesProps) {
  const [recipes, setRecipes] = useState<RecipeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const prevIngredient = useRef(ingredient);

  useEffect(() => {
    let cancelled = false;

    // Skip re-fetch if only ingredient changed but data is already cached
    if (prevIngredient.current !== ingredient) {
      prevIngredient.current = ingredient;
    }
    setLoading(true);

    async function load() {
      const idx = getIngredientIndex(ingredient);
      if (idx === undefined) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const ingEmb = getEmbedding(idx);
      if (!ingEmb) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const allRecipes = await getRecipeList();
      if (allRecipes.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      // Use cached embeddings — computed once globally
      const recipeEmbMap = getOrComputeRecipeEmbeddings(allRecipes);

      const scored: RecipeInfo[] = [];
      for (const r of allRecipes) {
        const rEmb = recipeEmbMap.get(r.id);
        if (!rEmb) continue;
        const sim = cosineSimilarity(ingEmb, rEmb);
        scored.push({ id: r.id, name: r.name, similarity: sim });
      }

      scored.sort((a, b) => b.similarity - a.similarity);
      if (!cancelled) {
        setRecipes(scored.slice(0, 5));
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ingredient, getEmbedding, getIngredientIndex]);

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">相关菜谱</h3>
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
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-sm">
                🍳
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{r.name}</p>
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">
                {(r.similarity * 100).toFixed(0)}%
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
