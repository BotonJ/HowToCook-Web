import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useRecipes } from '@/hooks/useRecipes';
import { SITE_URL } from '@/lib/constants';
import { COLLECTIONS } from '@/lib/collections';
import { useT, useBasePath } from '@/lib/i18n';

export function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const collection = collectionId ? COLLECTIONS[collectionId] : undefined;
  const { recipes, loading, error } = useRecipes();
  const t = useT();
  const base = useBasePath();

  useMeta({
    title: collection?.title,
    description: collection?.description,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: collectionId ? `${SITE_URL}/collection/${collectionId}` : SITE_URL,
  });

  const filteredRecipes = useMemo(() => {
    if (!collection) return [];
    const idSet = new Set(collection.recipeIds);
    return recipes.filter(r => idSet.has(r.id));
  }, [recipes, collection]);

  if (!collection) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body">{t.collection.notFound}</p>
          <Link to={`${base}/`} className="text-primary underline mt-2 inline-block">{t.collection.backHome}</Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-lg font-body mt-4">{t.collection.loading}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <nav className="mt-6 mb-4 px-2" aria-label="Breadcrumb">
        <Link
          to={`${base}/`}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          <span>{t.collection.backHome}</span>
        </Link>
      </nav>

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <header className="mb-8 px-2 pb-8 border-b border-outline-variant">
        <div className="flex items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="font-display text-headline-lg md:text-headline-xl text-on-surface tracking-tight">
              {collection.title}
            </h1>

            {/* Description */}
            <p className="text-body-lg text-on-surface-variant mt-1">
              {collection.description}
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-primary font-semibold text-body-lg">
            {t.collection.recipeCount(filteredRecipes.length)}
          </span>
          {filteredRecipes.length > 0 && (
            <>
              <span className="text-outline-variant">·</span>
              <span className="text-on-surface-variant text-body-md">
                {t.collection.easyToMake}
              </span>
            </>
          )}
        </div>
      </header>

      {/* ── Recipe Grid ──────────────────────────────────────────── */}
      <section className="mb-12 px-2">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-body-lg font-body">
              {t.collection.empty}
            </p>
            <Link
              to={`${base}/`}
              className="text-primary hover:underline mt-3 inline-block text-body-md"
            >
              {t.collection.backHome}
            </Link>
          </div>
        ) : (
          <RecipeGrid
            recipes={filteredRecipes}
            emptyMessage={t.collection.empty}
          />
        )}
      </section>
    </Layout>
  );
}
