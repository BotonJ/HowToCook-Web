import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, Flame, Leaf, Lightbulb, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { FlavorRadar } from '@/components/FlavorRadar';
import { RecipeJsonLd } from '@/components/RecipeJsonLd';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';
import { SubstituteList } from '@/components/SubstituteList';
import { toAbsoluteUrl } from '@/lib/utils';
import { SITE_URL } from '@/lib/constants';
import { useRecipeDetail } from '@/hooks/useRecipeDetail';
import { useSubstituteProfiles, type SubstituteEntry } from '@/hooks/useSubstituteProfiles';
import { useT, useBasePath } from '@/lib/i18n';
import { findRecipeById } from '@/hooks/useRecipes';
import type { Recipe } from '@/types';
import { useMeta } from '@/hooks/useMeta';

/**
 * Render the ingredients markdown list, attaching an inline "替换" button to
 * any line whose cleaned text is a known ingredient in the substitute map.
 *
 * Ingredient lines from the API are plain names ("大葱", "姜"); the substitute
 * button appears below the row only when a precomputed profile exists for that
 * name. Lines that don't match (quantities, free text, seasonings excluded by
 * the precompute) render unchanged — passive display, no noise.
 */
function renderIngredientsList(
  text: string,
  getSubstitutes: (name: string) => SubstituteEntry[] | null,
) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <ul className="space-y-1 text-on-surface-variant font-body text-body-md">
      {lines.map((line, i) => {
        const indent = line.startsWith('  ');
        const cleaned = line.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        const subs = getSubstitutes(cleaned);
        return (
          <li key={i} className={`${indent ? 'pl-6 text-on-surface-variant/80' : ''}`}>
            <div className="flex gap-2">
              <span className={`mt-0.5 ${indent ? 'text-outline' : 'text-primary'}`}>{indent ? '◦' : '•'}</span>
              <span className="leading-relaxed">{cleaned}</span>
            </div>
            {subs && subs.length > 0 && (
              <div className="pl-5">
                <SubstituteList ingredient={cleaned} substitutes={subs} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

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
  // Group lines by step boundaries:
  // - Numbered: "N. xxx" or "N、xxx"
  // - Bullet: "- xxx" or "* xxx"
  const groups: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    const trimmed = line.trimStart();
    const isNumbered = /^\d+[.、]\s/.test(trimmed);
    const isBullet = /^[-*]\s/.test(trimmed);
    if (isNumbered || isBullet) {
      if (current) groups.push(current);
      current = trimmed.replace(/^\d+[.、]\s*/, '').replace(/^[-*]\s*/, '');
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
  const rawId = params['*'] || params.recipeId;
  // Sanitize URL parameter: strip control characters and limit length
  // eslint-disable-next-line no-control-regex
  const recipeId = rawId?.replace(/[\x00-\x1f]/gu, '').slice(0, 200) || '';
  const navigate = useNavigate();
  const base = useBasePath();
  const t = useT();
  // Lazy-load the substitute profiles JSON once per session (module-cached).
  // The fetch fires on detail-page mount; the ingredient list renders first
  // and the "替换" buttons appear once the data arrives.
  const { getSubstitutes } = useSubstituteProfiles();

  const [localRecipe, setLocalRecipe] = useState<Recipe | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);
  useEffect(() => {
    if (!recipeId) { setLocalRecipe(null); setLocalLoaded(true); return; }
    let cancelled = false;
    setLocalLoaded(false);
    findRecipeById(recipeId)
      .then(r => {
        if (cancelled) return;
        setLocalRecipe(r);
        setLocalLoaded(true);
      })
      .catch(() => { if (!cancelled) setLocalLoaded(true); });
    return () => { cancelled = true; };
  }, [recipeId]);

  // Only call API after local data is ready, so fallback is always valid
  const { recipe, loading: detailLoading } = useRecipeDetail(
    localLoaded ? recipeId : undefined,
    localRecipe,
  );

  const loading = !localLoaded || (localLoaded && detailLoading);

  useMeta({
    title: recipe?.name,
    description: recipe?.description?.slice(0, 160) || (recipe ? `${recipe.name}${t.recipe.descriptionSuffix}` : undefined),
    ogImage: recipe?.imagePath ? toAbsoluteUrl(recipe.imagePath) : undefined,
    ogUrl: recipe ? `${SITE_URL}/recipe/${encodeURIComponent(recipe.id)}` : undefined,
  });

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">{t.recipe.notFound}</p>
          <Link to={`${base}/`} className="text-primary hover:underline mt-4 inline-block font-body">{t.recipe.backHome}</Link>
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
      <BreadcrumbJsonLd categoryName={recipe.category} recipeName={recipe.name} />
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
          <span className="text-sm font-body">{t.recipe.back}</span>
        </button>

        {/* Hero Section: grid-cols-12, image col-span-7, info col-span-5 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16">
          {/* Hero Image */}
          <div className="md:col-span-7 h-[400px] md:h-[560px] rounded-2xl overflow-hidden shadow-ambient bg-surface-container">
            {recipe.imagePath ? (
              <img
                src={recipe.imagePath}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-container/40 via-surface to-tertiary-container/30 flex items-center justify-center">
                <ChefHat size={64} className="text-primary/30" />
              </div>
            )}
          </div>

          {/* Right: Title, Description, Meta Grid */}
          <div className="md:col-span-5 flex flex-col justify-center">
            <h1 className="font-display text-headline-xl text-on-surface tracking-tight mb-4">{recipe.name}</h1>

            {cleanDescription && (
              <p className="text-on-surface-variant font-body text-body-lg leading-relaxed mb-8 whitespace-pre-line">{cleanDescription}</p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3">
              {recipe.difficulty > 0 && (
                <div className="bg-surface-container-low rounded-lg p-4 flex items-center gap-2">
                  <ChefHat size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.difficulty}</div>
                    <div className="text-label-lg text-on-surface font-semibold">{t.constants.difficulty[recipe.difficulty]}</div>
                  </div>
                </div>
              )}
              {recipe.cook_time && (
                <div className="bg-surface-container-low rounded-lg p-4 flex items-center gap-2">
                  <Clock size={18} className="text-tertiary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.time}</div>
                    <div className="text-label-lg text-on-surface font-semibold">{(t.constants.cookTime as Record<string, string>)[recipe.cook_time] || recipe.cook_time}</div>
                  </div>
                </div>
              )}
              {recipe.cuisine && (
                <div className="bg-surface-container-low rounded-lg p-4 flex items-center gap-2">
                  <Flame size={18} className="text-on-surface-variant flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.cuisine}</div>
                    <div className="text-label-lg text-on-surface font-semibold">{recipe.cuisine}</div>
                  </div>
                </div>
              )}
              {recipe.cooking_method && (
                <div className="bg-surface-container-low rounded-lg p-4 flex items-center gap-2">
                  <Flame size={18} className="text-on-surface-variant flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.method}</div>
                    <div className="text-label-lg text-on-surface font-semibold">{recipe.cooking_method}</div>
                  </div>
                </div>
              )}
              {recipe.tags?.spicy && (
                <div className="bg-error-container/40 rounded-lg p-4 flex items-center gap-2">
                  <span className="text-lg">🌶️</span>
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.taste}</div>
                    <div className="text-label-lg text-error font-semibold">{t.recipe.spicy}</div>
                  </div>
                </div>
              )}
              {recipe.tags?.diet && recipe.tags.diet.length > 0 && recipe.tags.diet.map(d => (
                <div key={d} className="bg-secondary-container/20 rounded-lg p-4 flex items-center gap-2">
                  <Leaf size={18} className="text-secondary flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface-variant">{t.recipe.diet}</div>
                    <div className="text-label-lg text-secondary font-semibold">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12 pb-16">
          {/* Flavor Radar */}
          {recipe.flavorProfile && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                {t.recipe.flavorProfile}
              </h2>
              <div className="flex justify-center">
                <FlavorRadar profile={recipe.flavorProfile} size={280} interactive />
              </div>
            </section>
          )}

          {/* Ingredients */}
          {recipe.ingredients_text && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                {t.recipe.ingredients}
              </h2>
              <div className="space-y-1">
                {renderIngredientsList(recipe.ingredients_text, getSubstitutes)}
              </div>
            </section>
          )}

          {/* Calculation */}
          {recipe.calculation_text && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                {t.recipe.amount}
              </h2>
              <div className="space-y-1">
                {renderMarkdownList(recipe.calculation_text)}
              </div>
            </section>
          )}

          {/* Steps */}
          {recipe.steps_text && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                {t.recipe.steps}
              </h2>
              {renderSteps(recipe.steps_text)}
            </section>
          )}

          {/* Chef's Note (小贴士) */}
          {recipe.extra_text && (
            <section className="bg-primary/10 border border-primary/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-primary" />
                <h3 className="font-display text-headline-md text-on-surface">{t.recipe.tips}</h3>
              </div>
              <div className="space-y-1">
                {renderMarkdownList(recipe.extra_text)}
              </div>
            </section>
          )}

          {/* Allergens */}
          {recipe.tags?.allergens && recipe.tags.allergens.length > 0 && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-error" />
                <h3 className="font-display text-headline-md text-on-surface">{t.recipe.allergenNotice}</h3>
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
    </Layout>
  );
}
