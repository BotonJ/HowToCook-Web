import { useMemo } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { RadarChart } from './RadarChart';
import { ComposeDimBars } from './ComposeDimBars';
import { FlavorComment } from './FlavorComment';
import { BalanceDetection } from './BalanceDetection';
import { ClosestRecipes } from './ClosestRecipes';
import { Suggestions } from './Suggestions';
import type { UseEpicureResult } from '@/lib/epicure';

interface ComposeViewProps {
  epicure: UseEpicureResult;
}

export function ComposeView({ epicure }: ComposeViewProps) {
  const { state, dispatch } = useWorkbench();
  const ingredients = useMemo(() => Array.from(state.selected), [state.selected]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <RadarChart ingredients={ingredients} />
        <div className="space-y-6">
          <ComposeDimBars ingredients={ingredients} />
          <FlavorComment ingredients={ingredients} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BalanceDetection ingredients={ingredients} />
        <Suggestions
          ingredients={ingredients}
          onAdd={(id) => dispatch({ type: 'ADD', ingredient: id })}
        />
      </div>
      <ClosestRecipes ingredients={ingredients} epicure={epicure} />
    </div>
  );
}
