import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { useEpicure } from '@/lib/epicure';
import { ExploreSkeleton } from '@/components/ExploreSkeleton';
import { PairingPanel } from '@/components/explore/PairingPanel';
import { SlerpPanel } from '@/components/explore/SlerpPanel';
import { ModePanel } from '@/components/explore/ModePanel';

export function Explore() {
  const {
    loaded,
    loading,
    error,
    getNearestNeighbors,
    slerpToCuisine,
    getClosestMode,
    searchVocabulary,
    cuisinePoles,
    zhMap,
    modeLabelsZh,
  } = useEpicure();

  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [slerpTopResult, setSlerpTopResult] = useState<string | null>(null);

  useMeta({
    title: 'Ingredient Explorer',
    description: 'Explore ingredient pairings, flavor profiles, and cuisine directions with our ingredient embedding engine.',
    ogUrl: `${SITE_URL}/explore`,
  });

  const modes = useMemo(() => {
    // When user is exploring with SLERP, show modes for the top SLERP result
    const target = slerpTopResult || selectedIngredient;
    if (!target) return [];
    return getClosestMode(target, 3);
  }, [selectedIngredient, slerpTopResult, getClosestMode]);

  if (loading) {
    return (
      <Layout>
        <ExploreSkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body mb-4">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!loaded) {
    return (
      <Layout>
        <ExploreSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-headline-xl text-on-surface">
          Ingredient Explorer
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mt-1">
          Explore ingredient pairings, flavor profiles, and cuisine directions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <PairingPanel
            getNearestNeighbors={getNearestNeighbors}
            searchVocabulary={searchVocabulary}
            zhMap={zhMap}
            onIngredientSelect={setSelectedIngredient}
            selectedIngredient={selectedIngredient}
          />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <SlerpPanel
            slerpToCuisine={slerpToCuisine}
            searchVocabulary={searchVocabulary}
            zhMap={zhMap}
            cuisinePoles={cuisinePoles}
            selectedIngredient={selectedIngredient}
            onSlerpTopResult={setSlerpTopResult}
          />
          <ModePanel
            modes={modes}
            loading={false}
            targetName={slerpTopResult || selectedIngredient}
            isSlerpResult={!!slerpTopResult}
            modeLabelsZh={modeLabelsZh}
          />
        </div>
      </div>
    </Layout>
  );
}
