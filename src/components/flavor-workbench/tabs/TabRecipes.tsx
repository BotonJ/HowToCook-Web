import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, Search } from 'lucide-react';
import { getIngredients, CATEGORY_COLORS } from '../data/ingredients';
import { getHowToCookRecipes, type HowToCookRecipe } from '../data/recipe-loader';

const MAX_SELECT = 6;
const DIFFICULTY_MAP = { 1: '★', 2: '★★', 3: '★★★' };

interface ScoredRecipe extends HowToCookRecipe {
  matchCount: number;
  exactMatch: boolean;
}

export function TabRecipes() {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (selected.length === 0 && getIngredients().length > 0) {
      setSelected([getIngredients()[0].id]);
    }
  }, [getIngredients().length]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');

  const toggleIngredient = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_SELECT
          ? [...prev, id]
          : prev
    );
  };

  const filteredIngredients = useMemo(
    () =>
      getIngredients().filter(
        (i) =>
          !ingredientSearch ||
          i.name.includes(ingredientSearch) ||
          i.nameEn.toLowerCase().includes(ingredientSearch.toLowerCase())
      ),
    [ingredientSearch]
  );

  // Match recipes: AND logic, with partial match fallback
  const { exact, partial } = useMemo(() => {
    if (selected.length === 0) return { exact: [] as ScoredRecipe[], partial: [] as ScoredRecipe[] };

    const scored = getHowToCookRecipes()
      .map((r) => {
        const matchCount = r.ingredients.filter((i) => selected.includes(i)).length;
        const exactMatch = matchCount === selected.length;
        return { ...r, matchCount, exactMatch };
      })
      .filter((r) => r.matchCount > 0) as ScoredRecipe[];

    const exactMatches = scored
      .filter((r) => r.exactMatch)
      .sort((a, b) => b.matchCount - a.matchCount);
    const partialMatches = scored
      .filter((r) => !r.exactMatch)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 6);

    return { exact: exactMatches, partial: partialMatches };
  }, [selected]);

  const selectedNames = selected.map((id) => getIngredients().find((i) => i.id === id)?.name || id);

  const filteredExact = useMemo(
    () => (recipeSearch ? exact.filter((r) => r.name.includes(recipeSearch)) : exact),
    [exact, recipeSearch]
  );
  const filteredPartial = useMemo(
    () => (recipeSearch ? partial.filter((r) => r.name.includes(recipeSearch)) : partial),
    [partial, recipeSearch]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Ingredient picker with max limit */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[#2c2825]">选择食材</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8c7168]">
              {selected.length}/{MAX_SELECT}
              {selected.length >= MAX_SELECT && (
                <span className="text-[#ba1a1a] ml-1">已达上限</span>
              )}
            </span>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([getIngredients()[0]?.id].filter(Boolean))}
                className="text-xs text-[#ae3a04] hover:underline"
              >
                清空
              </button>
            )}
          </div>
        </div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7168]" />
          <input
            type="text"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="搜索食材..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168]"
            aria-label="Search recipes by name or ingredients"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filteredIngredients.slice(0, 80).map((i) => {
            const active = selected.includes(i.id);
            const disabled = !active && selected.length >= MAX_SELECT;
            return (
              <button
                key={i.id}
                onClick={() => toggleIngredient(i.id)}
                disabled={disabled}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? CATEGORY_COLORS[i.category] : CATEGORY_COLORS[i.category] + '15',
                  color: active ? 'white' : disabled ? '#d0c8c3' : CATEGORY_COLORS[i.category],
                  boxShadow: active ? `0 2px 0 ${CATEGORY_COLORS[i.category]}80` : 'none',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {i.name}
                {active && <span className="ml-1">×</span>}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="mt-2 text-xs text-[#58413a]">
            已选：<span className="font-semibold">{selectedNames.join('、')}</span>
          </div>
        )}
      </div>

      {/* Recipe results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a]">
            匹配菜谱 ({getHowToCookRecipes().length} 道)
          </h4>
          {(exact.length > 0 || partial.length > 0) && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7168]" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="搜索菜谱..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168] w-40"
              />
            </div>
          )}
        </div>

        {selected.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-8 text-center">
            <p className="text-sm text-[#8c7168]">请选择至少一种食材</p>
          </div>
        ) : filteredExact.length === 0 && filteredPartial.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-8 text-center">
            <p className="text-sm text-[#8c7168]">没有匹配的菜谱，试试减少食材或调整筛选条件</p>
          </div>
        ) : (
          <>
            {/* Exact matches */}
            {filteredExact.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-[#4a7c59] font-semibold mb-2">
                  完全匹配（包含全部所选食材）— {filteredExact.length} 道
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredExact.map((r, i) => (
                    <RecipeCard key={r.id} recipe={r} selected={selected} delay={i * 0.05} />
                  ))}
                </div>
              </div>
            )}

            {/* Partial matches */}
            {filteredPartial.length > 0 && (
              <div>
                <div className="text-xs text-[#8c7168] font-semibold mb-2">
                  部分匹配（包含部分所选食材）— {filteredPartial.length} 道
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPartial.map((r, i) => (
                    <RecipeCard key={r.id} recipe={r} selected={selected} delay={i * 0.05} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe, selected, delay }: {
  recipe: ScoredRecipe;
  selected: string[];
  delay: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4 hover:shadow-lg transition cursor-pointer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-semibold text-[#2c2825]">{recipe.name}</h5>
        <span className="text-[10px] text-[#8c7168]">{DIFFICULTY_MAP[recipe.difficulty]}</span>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#f5ece7] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4a7c59]"
            style={{ width: `${(recipe.matchCount / recipe.ingredients.length) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-[#4a7c59] font-medium">
          {recipe.matchCount}/{recipe.ingredients.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {recipe.ingredients.map((id, idx) => {
          const ing = getIngredients().find((x) => x.id === id);
          const matched = selected.includes(id);
          // Show vocab name if available, fall back to original ingredient string
          const displayName = ing?.name || recipe.originalIngredients[idx] || id;
          return (
            <span
              key={id}
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{
                background: matched ? '#4a7c5920' : '#f5ece7',
                color: matched ? '#4a7c59' : '#8c7168',
                fontWeight: matched ? 600 : 400,
              }}
            >
              {displayName}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#8c7168]">
        <span className="flex items-center gap-1">
          <Clock size={10} /> {recipe.time}
        </span>
        {recipe.tags[0] && (
          <span className="flex items-center gap-1">
            <ChefHat size={10} /> {recipe.tags[0]}
          </span>
        )}
        {recipe.cuisine && (
          <span>{recipe.cuisine}</span>
        )}
      </div>
    </motion.div>
  );
}
