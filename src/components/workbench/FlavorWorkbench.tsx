import { useEffect, useState } from 'react';
import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';
import { WorkbenchHeader } from './WorkbenchHeader';
import { IngredientSearchBar } from './IngredientSearchBar';
import { GuideView } from './GuideView';
import { ExploreView } from './explore/ExploreView';
import { ComposeView } from './compose/ComposeView';
import { useEpicure } from '@/lib/epicure';
import { loadFlavorProfiles, isFlavorProfilesLoaded } from '@/lib/flavor-profiles';

function WorkbenchInner() {
  const epicure = useEpicure();
  const { state } = useWorkbench();
  const [flavorReady, setFlavorReady] = useState(isFlavorProfilesLoaded());

  useEffect(() => {
    if (!isFlavorProfilesLoaded()) {
      loadFlavorProfiles()
        .then(() => setFlavorReady(true))
        .catch((err) => console.error('Failed to load flavor profiles:', err));
    }
  }, []);

  const ready = epicure.loaded && flavorReady;

  return (
    <div className="space-y-6">
      <WorkbenchHeader />
      <IngredientSearchBar
        ready={ready}
        searchVocabulary={epicure.searchVocabulary}
        zhMap={epicure.zhMap}
      />
      {!ready ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <div className="animate-pulse flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            加载风味数据中...
          </div>
        </div>
      ) : state.mode === 'guide' ? (
        <GuideView />
      ) : state.mode === 'explore' ? (
        <ExploreView epicure={epicure} />
      ) : (
        <ComposeView epicure={epicure} />
      )}
    </div>
  );
}

export function FlavorWorkbench() {
  return (
    <WorkbenchProvider>
      <WorkbenchInner />
    </WorkbenchProvider>
  );
}
