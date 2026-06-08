import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Scenario } from './mockData';

// ─── Tab Types ─────────────────────────────────────────────────────────────

export type TabId = 'overview' | 'pairing' | 'recipe';

interface WorkbenchV2State {
  /** Currently selected ingredient (English or Chinese key) */
  selectedIngredient: string;
  /** Active tab */
  activeTab: TabId;
  /** Enabled scenario filters */
  activeScenarios: Set<Scenario>;
  /** Whether SLERP Lab panel is expanded */
  slerpExpanded: boolean;
}

type Action =
  | { type: 'SET_INGREDIENT'; ingredient: string }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'TOGGLE_SCENARIO'; scenario: Scenario }
  | { type: 'TOGGLE_SLERP' };

function reducer(state: WorkbenchV2State, action: Action): WorkbenchV2State {
  switch (action.type) {
    case 'SET_INGREDIENT':
      return { ...state, selectedIngredient: action.ingredient };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'TOGGLE_SCENARIO': {
      const next = new Set(state.activeScenarios);
      if (next.has(action.scenario)) {
        next.delete(action.scenario);
      } else {
        next.add(action.scenario);
      }
      return { ...state, activeScenarios: next };
    }
    case 'TOGGLE_SLERP':
      return { ...state, slerpExpanded: !state.slerpExpanded };
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────

const StateContext = createContext<WorkbenchV2State | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

const DEFAULT_STATE: WorkbenchV2State = {
  selectedIngredient: '鸡肉',
  activeTab: 'overview',
  activeScenarios: new Set<Scenario>(),
  slerpExpanded: false,
};

export function WorkbenchV2Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

function useStateOnce(): WorkbenchV2State {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useWorkbenchV2State must be used within WorkbenchV2Provider');
  return ctx;
}

function useDispatchOnce(): React.Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useWorkbenchV2Dispatch must be used within WorkbenchV2Provider');
  return ctx;
}

/** Select ingredient and switch to overview tab */
export function useWorkbenchV2() {
  const state = useStateOnce();
  const dispatch = useDispatchOnce();

  const selectIngredient = useCallback(
    (ingredient: string) => dispatch({ type: 'SET_INGREDIENT', ingredient }),
    [dispatch],
  );

  const setTab = useCallback(
    (tab: TabId) => dispatch({ type: 'SET_TAB', tab }),
    [dispatch],
  );

  const toggleScenario = useCallback(
    (scenario: Scenario) => dispatch({ type: 'TOGGLE_SCENARIO', scenario }),
    [dispatch],
  );

  const toggleSlerp = useCallback(
    () => dispatch({ type: 'TOGGLE_SLERP' }),
    [dispatch],
  );

  return {
    ...state,
    selectIngredient,
    setTab,
    toggleScenario,
    toggleSlerp,
  };
}