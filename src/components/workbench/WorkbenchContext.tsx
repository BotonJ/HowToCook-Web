import { createContext, useContext, useReducer, type ReactNode } from 'react';

export type WorkbenchMode = 'guide' | 'explore' | 'compose';

interface WorkbenchState {
  selected: Set<string>;
  mode: WorkbenchMode;
}

type WorkbenchAction =
  | { type: 'ADD'; ingredient: string }
  | { type: 'REMOVE'; ingredient: string }
  | { type: 'TOGGLE'; ingredient: string }
  | { type: 'CLEAR' }
  | { type: 'SET'; ingredients: string[] };

function deriveMode(selected: Set<string>): WorkbenchMode {
  if (selected.size === 0) return 'guide';
  if (selected.size === 1) return 'explore';
  return 'compose';
}

function reducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'ADD': {
      const next = new Set(state.selected);
      next.add(action.ingredient);
      return { selected: next, mode: deriveMode(next) };
    }
    case 'REMOVE': {
      const next = new Set(state.selected);
      next.delete(action.ingredient);
      return { selected: next, mode: deriveMode(next) };
    }
    case 'TOGGLE': {
      const next = new Set(state.selected);
      if (next.has(action.ingredient)) {
        next.delete(action.ingredient);
      } else {
        next.add(action.ingredient);
      }
      return { selected: next, mode: deriveMode(next) };
    }
    case 'CLEAR': {
      return { selected: new Set(), mode: 'guide' };
    }
    case 'SET': {
      const next = new Set(action.ingredients);
      return { selected: next, mode: deriveMode(next) };
    }
    default:
      return state;
  }
}

interface WorkbenchContextValue {
  state: WorkbenchState;
  dispatch: React.Dispatch<WorkbenchAction>;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    selected: new Set<string>(),
    mode: 'guide' as WorkbenchMode,
  });

  return (
    <WorkbenchContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return ctx;
}
