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

// Split into two independent contexts to avoid cascade re-renders.
// DispatchContext value never changes, so consumers that only need dispatch
// (or only state) won't re-render when the other slice updates.

const DispatchContext = createContext<React.Dispatch<WorkbenchAction> | null>(null);
const StateContext = createContext<WorkbenchState | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    selected: new Set<string>(),
    mode: 'guide' as WorkbenchMode,
  });

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}

/** Subscribe to state changes only (e.g. WorkbenchHeader, FlavorWorkbench). */
export function useWorkbenchState(): WorkbenchState {
  const state = useContext(StateContext);
  if (!state) throw new Error('useWorkbenchState must be used within WorkbenchProvider');
  return state;
}

/** Subscribe to dispatch only — value never changes, so no re-renders. */
export function useWorkbenchDispatch(): React.Dispatch<WorkbenchAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('useWorkbenchDispatch must be used within WorkbenchProvider');
  return dispatch;
}

interface WorkbenchContextValue {
  state: WorkbenchState;
  dispatch: React.Dispatch<WorkbenchAction>;
}

/** Backward-compatible hook: subscribes to both state and dispatch. */
export function useWorkbench(): WorkbenchContextValue {
  const state = useWorkbenchState();
  const dispatch = useWorkbenchDispatch();
  return { state, dispatch };
}
