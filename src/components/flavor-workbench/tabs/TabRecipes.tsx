import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, X, Plus, Search } from 'lucide-react';
import {
  getIngredients, getRecipes, getSubstitutions, getCommonAllergens,
  CATEGORY_COLORS, getScenarioExplanations,
} from '../data/ingredients';

const MAX_SELECT = 6;
const DIFFICULTY_MAP = { 1: '★', 2: '★★', 3: '★★★' };

type Scenario = 'allergy' | 'vegan' | 'keto' | 'lowfat';
const SCENE_INFO: Record<Scenario, { label: string; icon: string; color: string }> = {
  allergy: { label: '过敏', icon: '⚠️', color: '#ba1a1a' },
  vegan: { label: '素食', icon: '🌱', color: '#4a7c59' },
  keto: { label: '生酮', icon: '🥑', color: '#7c4a7c' },
  lowfat: { label: '减脂', icon: '💪', color: '#4a7c8c' },
};

export function TabRecipes() {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (selected.length === 0 && getIngredients().length > 0) {
      setSelected([getIngredients()[0].id]);
    }
  }, [getIngredients().length]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState('');
  const [showAllergenPicker, setShowAllergenPicker] = useState(false);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');

  const toggleIngredient = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_SELECT ? [...prev, id] : prev
    );
  };

  const filteredIngredients = useMemo(
    () => getIngredients().filter(i =>
      !ingredientSearch || i.name.includes(ingredientSearch) || i.nameEn.toLowerCase().includes(ingredientSearch.toLowerCase())
    ),
    [ingredientSearch]
  );

  const toggleAllergen = (id: string) => {
    setExcludedAllergens(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addCustomAllergen = () => {
    const name = customAllergen.trim();
    if (name && !excludedIngredients.includes(name)) {
      setExcludedIngredients(prev => [...prev, name]);
      setCustomAllergen('');
    }
  };

  // Collect all excluded ingredient ids from allergens
  const allergenExcludedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const allergenId of excludedAllergens) {
      const allergen = getCommonAllergens().find(a => a.id === allergenId);
      if (allergen) allergen.relatedIngredients.forEach(i => ids.add(i));
    }
    return ids;
  }, [excludedAllergens]);

  // Scenario-based exclusions
  const scenarioExcludedIds = useMemo(() => {
    if (!scenario) return new Set<string>();
    if (scenario === 'vegan') {
      return new Set(getIngredients().filter(i => ['meat', 'seafood', 'dairy'].includes(i.category)).map(i => i.id));
    }
    if (scenario === 'keto') {
      return new Set(['rice', 'noodle', 'corn', 'potato']);
    }
    return new Set<string>();
  }, [scenario]);

  // Match recipes: AND logic, with partial match fallback
  const { exact, partial } = useMemo(() => {
    if (selected.length === 0) return { exact: [], partial: [] };

    const allExcluded = new Set([...allergenExcludedIds, ...excludedIngredients]);

    const scored = getRecipes().map(r => {
      // Check if recipe contains excluded ingredients
      const hasExcluded = r.ingredients.some(i => allExcluded.has(i));
      if (hasExcluded) return null;

      // Check scenario exclusions
      const hasScenarioExcluded = r.ingredients.some(i => scenarioExcludedIds.has(i));
      if (hasScenarioExcluded) return null;

      // AND: recipe must contain ALL selected ingredients
      const matchCount = r.ingredients.filter(i => selected.includes(i)).length;
      const exactMatch = matchCount === selected.length;

      return { ...r, matchCount, exactMatch };
    }).filter(Boolean) as Array<{
      id: string; name: string; ingredients: string[]; difficulty: 1 | 2 | 3;
      time: string; tags: string[]; matchCount: number; exactMatch: boolean;
    }>;

    const exactMatches = scored.filter(r => r.exactMatch).sort((a, b) => b.matchCount - a.matchCount);
    const partialMatches = scored
      .filter(r => !r.exactMatch && r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 6);

    return { exact: exactMatches, partial: partialMatches };
  }, [selected, allergenExcludedIds, excludedIngredients, scenarioExcludedIds]);

  const subs = useMemo(() => {
    if (!scenario) return [];
    return getSubstitutions().filter(s => {
      if (s.scenario !== scenario) return false;
      return s.replace === selected[0] || s.with === selected[0];
    });
  }, [scenario, selected]);

  const selectedNames = selected.map(id => getIngredients().find(i => i.id === id)?.name || id);

  const filteredExact = useMemo(
    () => recipeSearch ? exact.filter(r => r.name.includes(recipeSearch)) : exact,
    [exact, recipeSearch]
  );
  const filteredPartial = useMemo(
    () => recipeSearch ? partial.filter(r => r.name.includes(recipeSearch)) : partial,
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
              {selected.length >= MAX_SELECT && <span className="text-[#ba1a1a] ml-1">已达上限</span>}
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
            onChange={e => setIngredientSearch(e.target.value)}
            placeholder="搜索食材..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filteredIngredients.slice(0, 80).map(i => {
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

      {/* Scenario tags with explanations */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-3">
          饮食场景筛选
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(SCENE_INFO) as Scenario[]).map(s => {
            const info = SCENE_INFO[s];
            const active = scenario === s;
            return (
              <button
                key={s}
                onClick={() => {
                  if (s === 'allergy' && !active) {
                    setShowAllergenPicker(true);
                  } else if (s === 'allergy' && active) {
                    setShowAllergenPicker(false);
                    setExcludedAllergens([]);
                  }
                  setScenario(active ? null : s);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5"
                style={{
                  background: active ? info.color : info.color + '15',
                  color: active ? 'white' : info.color,
                  boxShadow: active ? `0 3px 0 ${info.color}80` : 'none',
                }}
              >
                <span>{info.icon}</span>
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Scenario explanation */}
        {scenario && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-3 rounded-lg bg-[#f5ece7] text-xs text-[#58413a] leading-relaxed"
          >
            {getScenarioExplanations()[scenario]}
          </motion.div>
        )}

        {/* Allergen picker (shown when 过敏 is active) */}
        <AnimatePresence>
          {showAllergenPicker && scenario === 'allergy' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 mb-3">
                {getCommonAllergens().map(a => {
                  const active = excludedAllergens.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAllergen(a.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? '#ba1a1a' : '#ba1a1a15',
                        color: active ? 'white' : '#ba1a1a',
                        boxShadow: active ? '0 2px 0 #ba1a1a80' : 'none',
                      }}
                    >
                      {a.icon} {a.name}
                    </button>
                  );
                })}
              </div>
              {/* Custom allergen input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAllergen}
                  onChange={e => setCustomAllergen(e.target.value)}
                  placeholder="自定义过敏源..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#e0c0b5] text-xs outline-none focus:border-[#ae3a04]"
                  onKeyDown={e => e.key === 'Enter' && addCustomAllergen()}
                />
                <button
                  onClick={addCustomAllergen}
                  className="px-3 py-1.5 rounded-lg bg-[#f5ece7] text-xs text-[#58413a] hover:bg-[#e9e1dc] transition flex items-center gap-1"
                >
                  <Plus size={12} /> 添加
                </button>
              </div>
              {/* Show excluded list */}
              {(excludedAllergens.length > 0 || excludedIngredients.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {excludedAllergens.map(id => {
                    const a = getCommonAllergens().find(x => x.id === id);
                    return a ? (
                      <span key={id} className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] flex items-center gap-1">
                        {a.icon} {a.name}
                        <X size={10} className="cursor-pointer" onClick={() => toggleAllergen(id)} />
                      </span>
                    ) : null;
                  })}
                  {excludedIngredients.map(name => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] flex items-center gap-1">
                      {name}
                      <X size={10} className="cursor-pointer" onClick={() => setExcludedIngredients(prev => prev.filter(x => x !== name))} />
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipe results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a]">
            🍳 匹配菜谱
          </h4>
          {(exact.length > 0 || partial.length > 0) && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7168]" />
              <input
                type="text"
                value={recipeSearch}
                onChange={e => setRecipeSearch(e.target.value)}
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
                  ✓ 完全匹配（包含全部所选食材）— {filteredExact.length} 道
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

      {/* Substitution recommendations */}
      {subs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-3">
            🔄 替代建议
          </h4>
          <div className="flex flex-col gap-2">
            {subs.map((s, i) => {
              const info = SCENE_INFO[s.scenario];
              const otherId = s.replace === selected[0] ? s.with : s.replace;
              const other = getIngredients().find(x => x.id === otherId);
              return (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#f5ece7]">
                  <span className="text-sm">{info.icon}</span>
                  <div className="text-xs text-[#2c2825]">
                    {s.reason}
                    {other && <span className="text-[#8c7168] ml-1">（推荐：{other.name}）</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, selected, delay }: {
  recipe: { id: string; name: string; ingredients: string[]; difficulty: 1 | 2 | 3; time: string; tags: string[]; matchCount: number };
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
        {recipe.ingredients.map(id => {
          const ing = getIngredients().find(x => x.id === id);
          const matched = selected.includes(id);
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
              {ing?.name || id}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#8c7168]">
        <span className="flex items-center gap-1"><Clock size={10} /> {recipe.time}</span>
        <span className="flex items-center gap-1"><ChefHat size={10} /> {recipe.tags[0]}</span>
      </div>
    </motion.div>
  );
}
