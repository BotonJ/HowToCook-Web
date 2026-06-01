import { useState, useEffect } from 'react';
import type { UseEpicureResult } from '@/lib/epicure';
import { cosineSimilarity } from '@/lib/epicure/engine';

interface RecipeInfo {
  id: string;
  name: string;
  similarity: number;
}

interface ClosestRecipesProps {
  ingredients: string[];
  epicure: UseEpicureResult;
}

export function ClosestRecipes({ ingredients, epicure }: ClosestRecipesProps) {
  const [recipes, setRecipes] = useState<RecipeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      // Build composite embedding from selected ingredients
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

      const resp = await fetch('/data/recipes.json');
      if (!resp.ok) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const categories: Array<{ recipes: Array<{ id: string; name: string; ingredients: string[] }> }> =
        await resp.json();

      const allRecipes: Array<{ id: string; name: string; ingredients: string[] }> = [];
      for (const cat of categories) {
        for (const r of cat.recipes) {
          allRecipes.push(r);
        }
      }

      const recipeEmbeddings = epicure.computeRecipeEmbeddings(allRecipes);
      const scored: RecipeInfo[] = [];
      for (const re of recipeEmbeddings) {
        const sim = cosineSimilarity(composite, re.embedding);
        scored.push({ id: re.id, name: allRecipes.find((r) => r.id === re.id)?.name || re.id, similarity: sim });
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
  }, [ingredients, epicure]);

  return (
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
  );
}
