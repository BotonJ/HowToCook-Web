import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, Flame, Leaf, Lightbulb, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { RecipeJsonLd } from '@/components/RecipeJsonLd';
import { withBaseUrl } from '@/lib/utils';
import { COOK_TIME_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import { useRecipeDetail } from '@/hooks/useRecipeDetail';
import { useRecipes, getFullRecipeData } from '@/hooks/useRecipes';
import type { Recipe } from '@/types';
import { useMeta } from '@/hooks/useMeta';

function renderMarkdownList(text: string) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <ul className="space-y-2 text-on-surface-variant font-body text-body-md">
      {lines.map((line, i) => {
        const indent = line.startsWith('  ');
        const cleaned = line.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        return (
          <li key={i} className={`flex gap-2 ${indent ? 'pl-6 text-on-surface-variant/80' : ''}`}>
            <span className={`mt-0.5 ${indent ? 'text-outline' : 'text-primary'}`}>{indent ? '◦' : '•'}</span>
            <span className="leading-relaxed">{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}

function renderSteps(text: string) {
  if (!text) return null;
  // Group lines by numbered steps: a new step starts with "N." at the beginning of a line
  const groups: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (/^\d+\.\s/.test(line.trimStart())) {
      if (current) groups.push(current);
      current = line.trimStart().replace(/^\d+\.\s*/, '');
    } else if (current) {
      current += '\n' + line;
    }
  }
  if (current) groups.push(current);

  return (
    <ol className="space-y-6">
      {groups.map((content, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center justify-center font-display">
              {i + 1}
            </span>
            {i < groups.length - 1 && (
              <div className="w-px flex-1 bg-outline-variant mt-2" />
            )}
          </div>
          <span className="font-body text-body-lg text-on-surface leading-relaxed pt-1 whitespace-pre-line">
            {content}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RecipeDetail() {
  const params = useParams();
  const recipeId = params['*'] || params.recipeId;
  const navigate = useNavigate();
  const { loading: recipesLoading } = useRecipes();

  const [localRecipe, setLocalRecipe] = useState<Recipe | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);
  useEffect(() => {
    if (!recipeId) { setLocalRecipe(null); setLocalLoaded(true); return; }
    let cancelled = false;
    setLocalLoaded(false);
    getFullRecipeData()
      .then(cats => {
        if (cancelled) return;
        const all = cats.flatMap(c => c.recipes);
        setLocalRecipe(all.find(r => r.id === recipeId) ?? null);
        setLocalLoaded(true);
      })
      .catch(() => { if (!cancelled) setLocalLoaded(true); });
    return () => { cancelled = true; };
  }, [recipeId]);

  // API-first detail, falls back to localRecipe on error
  const { recipe, loading: detailLoading } = useRecipeDetail(recipeId, localRecipe);

  const loading = recipesLoading || detailLoading || !localLoaded;

  useMeta({
    title: recipe?.name,
    description: recipe?.description?.slice(0, 160) || (recipe ? `${recipe.name} 的做法` : undefined),
    ogImage: recipe?.imagePath ? `https://howtocook.cn/${recipe.imagePath}` : undefined,
    ogUrl: recipe ? `https://howtocook.cn/recipe/${encodeURIComponent(recipe.name)}` : undefined,
  });

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">加载中...</p>
        </div>
      </Layout>
    );
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">菜谱未找到</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block font-body">返回首页</Link>
        </div>
      </Layout>
    );
  }

  const cleanDescription = recipe.description
    ?.replace(/^(\.jpg\)\s*)+/gm, '')
    .replace(/^\.jpg\).*$/gm, '')
    .replace(/(预估烹饪难度[：:])/g, '\n$1')
    .trim();

  return (
    <Layout>
      <RecipeJsonLd recipe={recipe} />
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Back button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/', { replace: true });
            }
          }}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-body">返回</span>
        </button>

        {/* Two-column layout on desktop, single column on mobile */}
        <div className="flex flex-col md:flex-row gap-gutter-desktop">
          {/* Left column: Image (sticky on desktop) */}
          <div className="md:w-2/5 md:sticky md:top-32 md:self-start">
            {recipe.imagePath && (
              <div className="rounded-lg overflow-hidden shadow-ambient">
                <img
                  src={withBaseUrl(recipe.imagePath)}
                  alt={recipe.name}
                  className="w-full aspect-[9/16] object-contain bg-surface-container-low"
                />
              </div>
            )}
          </div>

          {/* Right column: Content */}
          <div className="md:w-3/5 min-w-0">
            {/* Title - prominent */}
            <h1 className="font-display text-headline-xl text-on-surface tracking-tight mb-4 text-center">{recipe.name}</h1>

            {/* Description */}
            {cleanDescription && (
              <p className="text-on-surface-variant font-body text-body-lg leading-relaxed mb-8 whitespace-pre-line">{cleanDescription}</p>
            )}

            {/* Meta badges - grid layout for better readability */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {recipe.difficulty > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low">
                  <ChefHat size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">难度</div>
                    <div className="text-label-lg text-on-surface font-semibold">{DIFFICULTY_LABELS[recipe.difficulty]}</div>
                  </div>
                </div>
              )}
              {recipe.cook_time && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low">
                  <Clock size={18} className="text-tertiary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">时间</div>
                    <div className="text-label-lg text-on-surface font-semibold">{COOK_TIME_LABELS[recipe.cook_time] || recipe.cook_time}</div>
                  </div>
                </div>
              )}
              {recipe.cuisine && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low">
                  <Flame size={18} className="text-on-surface-variant flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">菜系</div>
                    <div className="text-label-lg text-on-surface font-semibold">{recipe.cuisine}</div>
                  </div>
                </div>
              )}
              {recipe.cooking_method && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low">
                  <Flame size={18} className="text-on-surface-variant flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">做法</div>
                    <div className="text-label-lg text-on-surface font-semibold">{recipe.cooking_method}</div>
                  </div>
                </div>
              )}
              {recipe.tags?.spicy && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container/40">
                  <span className="text-lg">🌶️</span>
                  <div>
                    <div className="text-label-sm text-on-surface-variant">口味</div>
                    <div className="text-label-lg text-error font-semibold">辣</div>
                  </div>
                </div>
              )}
              {recipe.tags?.diet && recipe.tags.diet.length > 0 && recipe.tags.diet.map(d => (
                <div key={d} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary-container/20">
                  <Leaf size={18} className="text-secondary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">饮食</div>
                    <div className="text-label-lg text-secondary font-semibold">{d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ingredients */}
            {recipe.ingredients_text && (
              <section className="mb-10">
                <h2 className="font-display text-headline-lg text-on-surface mb-5 pb-3 border-b border-outline-variant text-center">
                  食材
                </h2>
                <div className="space-y-1">
                  {renderMarkdownList(recipe.ingredients_text)}
                </div>
              </section>
            )}

            {/* Calculation */}
            {recipe.calculation_text && (
              <section className="mb-10">
                <h2 className="font-display text-headline-lg text-on-surface mb-5 pb-3 border-b border-outline-variant text-center">
                  用量
                </h2>
                <div className="bg-surface-container-low rounded-lg p-6">
                  {renderMarkdownList(recipe.calculation_text)}
                </div>
              </section>
            )}

            {/* Steps */}
            {recipe.steps_text && (
              <section className="mb-10">
                <h2 className="font-display text-headline-lg text-on-surface mb-5 pb-3 border-b border-outline-variant text-center">
                  步骤
                </h2>
                {renderSteps(recipe.steps_text)}
              </section>
            )}

            {/* Extra tips */}
            {recipe.extra_text && (
              <section className="mb-10">
                <div className="bg-primary-fixed/20 border border-primary-fixed rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={20} className="text-primary" />
                    <h3 className="font-display text-headline-md text-on-primary-fixed">小贴士</h3>
                  </div>
                  <div className="space-y-1">
                    {renderMarkdownList(recipe.extra_text)}
                  </div>
                </div>
              </section>
            )}

            {/* Allergens */}
            {recipe.tags?.allergens && recipe.tags.allergens.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-error" />
                  <h3 className="font-display text-headline-md text-on-surface">过敏原提示</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.allergens.map(a => (
                    <span key={a} className="px-3 py-1.5 rounded-full bg-error-container text-error text-sm font-body font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
