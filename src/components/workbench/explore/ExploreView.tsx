import { useMemo } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { FlavorProfileBars } from './FlavorProfileBars';
import { ClusterPanel } from './ClusterPanel';
import { FlavorWheel } from './FlavorWheel';
import { CuisineExplorer } from './CuisineExplorer';
import { CooccurrencePanel } from './CooccurrencePanel';
import { ExploreRecipes } from './ExploreRecipes';
import type { UseEpicureResult } from '@/lib/epicure';

interface ExploreViewProps {
  epicure: UseEpicureResult;
}

export function ExploreView({ epicure }: ExploreViewProps) {
  const { state, dispatch } = useWorkbench();
  const ingredient = useMemo(() => Array.from(state.selected)[0], [state.selected]);

  if (!ingredient) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <FlavorProfileBars ingredient={ingredient} />
          <ClusterPanel
            ingredient={ingredient}
            getClosestMode={epicure.getClosestMode}
            modeLabelsZh={epicure.modeLabelsZh}
            zhMap={epicure.zhMap}
          />
        </div>
        <FlavorWheel
          ingredient={ingredient}
          getNearestNeighbors={epicure.getNearestNeighbors}
          zhMap={epicure.zhMap}
          onSelect={(id) => dispatch({ type: 'SET', ingredients: [id] })}
        />
      </div>
      <CuisineExplorer
        ingredient={ingredient}
        slerpToCuisine={epicure.slerpToCuisine}
        cuisinePoles={epicure.cuisinePoles}
        zhMap={epicure.zhMap}
        onSelect={(id) => dispatch({ type: 'SET', ingredients: [id] })}
      />
      <CooccurrencePanel
        ingredient={ingredient}
        epicure={epicure}
        onSelect={(id) => dispatch({ type: 'SET', ingredients: [id] })}
      />
      <ExploreRecipes
        ingredient={ingredient}
        getEmbedding={epicure.getEmbedding}
        getIngredientIndex={epicure.getIngredientIndex}
        zhMap={epicure.zhMap}
        epicure={epicure}
      />
    </div>
  );
}
