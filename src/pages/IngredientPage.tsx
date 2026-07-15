import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { FlavorRadar } from '@/components/FlavorRadar';
import { useIngredientFlavor } from '@/hooks/useIngredientFlavor';
import { usePairProfiles } from '@/hooks/usePairProfiles';
import { useSubstituteProfiles } from '@/hooks/useSubstituteProfiles';
import { useRecipes } from '@/hooks/useRecipes';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import type { FlavorVector } from '@/lib/flavor-types';

const CATEGORY_LABELS: Record<string, string> = {
  meat: '肉禽',
  vegetable: '蔬菜',
  spice: '香料',
  dairy: '乳制品',
  grain: '主食',
  seafood: '水产',
  fruit: '水果',
  fermented: '发酵调味',
  other: '其他',
};

export function IngredientPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name || '');
  const t = useT();

  const { getFlavor, loading: flavorLoading } = useIngredientFlavor();
  const { getPairs, loading: pairsLoading } = usePairProfiles();
  const { getSubstitutes, loading: subLoading } = useSubstituteProfiles();
  const { recipes, loading: recipesLoading } = useRecipes();

  const flavor = getFlavor(name);
  const pairs = getPairs(name);
  const substitutes = getSubstitutes(name);

  const relatedRecipes = recipes.filter(r =>
    r.ingredients?.includes(name) || r.main_ingredients?.includes(name),
  ).slice(0, 12);

  const loading = flavorLoading || pairsLoading || subLoading || recipesLoading;

  useMeta({
    title: name ? `${name} — 食材风味` : undefined,
    description: flavor
      ? `${name}的风味数据：甜${flavor.sweet} 酸${flavor.sour} 鲜${flavor.umami} 辣${flavor.spicy}，分类${CATEGORY_LABELS[flavor.category] ?? flavor.category}`
      : undefined,
  });

  if (!name) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">未指定食材</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block font-body">返回首页</Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  if (!flavor) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-body">未找到「{name}」的风味数据</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block font-body">返回首页</Link>
        </div>
      </Layout>
    );
  }

  const radarProfile: FlavorVector = {
    sweet: flavor.sweet,
    sour: flavor.sour,
    umami: flavor.umami,
    spicy: flavor.spicy,
  };

  return (
    <Layout>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-headline-xl text-on-surface tracking-tight mb-2">{name}</h1>
          {flavor.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-label-md font-body">
              {CATEGORY_LABELS[flavor.category] ?? flavor.category}
            </span>
          )}
        </div>

        <div className="space-y-12 pb-16">
          {/* Section 1: Flavor Radar */}
          <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
            <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
              风味雷达
            </h2>
            <div className="flex justify-center">
              <FlavorRadar profile={radarProfile} size={280} interactive />
            </div>
          </section>

          {/* Section 2: Pairing Top-5 */}
          {pairs && pairs.length > 0 && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                最佳搭配
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {pairs.map(p => (
                  <Link
                    key={p.name}
                    to={`/ingredient/${encodeURIComponent(p.name)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container/40 hover:bg-primary-container/60 transition-colors text-on-surface font-body"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-outline text-label-sm">PMI {p.pmi.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Substitute Top-5 */}
          {substitutes && substitutes.length > 0 && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                替代食材
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {substitutes.map(s => (
                  <Link
                    key={s.name}
                    to={`/ingredient/${encodeURIComponent(s.name)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-container/40 hover:bg-secondary-container/60 transition-colors text-on-surface font-body"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-outline text-label-sm">
                      {s.reason === '同类替代' ? '同类' : '风味'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Related Recipes */}
          {relatedRecipes.length > 0 && (
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-ambient">
              <h2 className="font-display text-headline-lg text-on-surface mb-6 text-center">
                含此食材的菜谱
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedRecipes.map(r => (
                  <Link
                    key={r.id}
                    to={`/recipe/${r.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
                  >
                    {r.imagePath ? (
                      <img src={r.imagePath} alt={r.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary-container/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-lg">🍳</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-body text-body-md text-on-surface font-medium truncate">{r.name}</div>
                      {r.category && (
                        <div className="text-outline text-label-sm font-body">{r.category}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
