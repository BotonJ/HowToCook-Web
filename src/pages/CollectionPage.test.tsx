import { type ReactNode } from 'react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { MOCK_RECIPE, MOCK_CATEGORY } from '@/test-utils';
import { useRecipes } from '@/hooks/useRecipes';
import { CollectionPage } from './CollectionPage';
import { LangProvider } from '@/lib/i18n';

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(() => ({
    categories: [MOCK_CATEGORY],
    recipes: [MOCK_RECIPE],
    loading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useMeta', () => ({
  useMeta: vi.fn(),
}));

vi.mock('@/components/RecipeGrid', () => ({
  RecipeGrid: ({ recipes, emptyMessage }: { recipes: { name: string }[]; emptyMessage?: string }) => (
    <div data-testid="recipe-grid">
      {recipes.length === 0 && emptyMessage && <p>{emptyMessage}</p>}
      {recipes.map((r: { name: string }, i: number) => (
        <span key={i} data-testid="recipe-item">{r.name}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

const mockUseRecipes = vi.mocked(useRecipes);

/** A recipe whose id matches the 'kitchen-appliances' collection recipeIds. */
const KITCHEN_RECIPE = {
  ...MOCK_RECIPE,
  id: 'howtocook/炸薯条',
  name: '炸薯条',
  language: 'zh' as const,
};

/**
 * Render CollectionPage inside Routes so useParams() resolves collectionId.
 */
function renderCollection(collectionId: string, options?: { initialEntries?: string[] }) {
  const initialEntries = options?.initialEntries ?? [`/collection/${collectionId}`];
  localStorage.setItem('htc-lang', 'zh');

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <LangProvider>
          <Routes>
            <Route path="/collection/:collectionId" element={children} />
          </Routes>
        </LangProvider>
      </MemoryRouter>
    );
  }

  return render(<CollectionPage />, { wrapper: Wrapper });
}

describe('CollectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('htc-lang', 'zh');
    mockUseRecipes.mockReturnValue({
      categories: [MOCK_CATEGORY],
      recipes: [MOCK_RECIPE],
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useRecipes>);
  });

  it('renders without crashing with a valid collectionId', () => {
    renderCollection('kitchen-appliances');
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('displays collection title', () => {
    renderCollection('kitchen-appliances');

    expect(screen.getByText('厨电料理')).toBeInTheDocument();
  });

  it('displays recipe grid when recipes match recipeIds', () => {
    mockUseRecipes.mockReturnValue({
      categories: [MOCK_CATEGORY],
      recipes: [KITCHEN_RECIPE],
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useRecipes>);

    renderCollection('kitchen-appliances');

    expect(screen.getByTestId('recipe-grid')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-item')).toHaveTextContent('炸薯条');
  });

  it('shows empty state when no recipes match the collection recipeIds', () => {
    // MOCK_RECIPE id 'howtocook/红烧肉' is not in kitchen-appliances recipeIds
    renderCollection('kitchen-appliances');

    expect(screen.getByText('0 道菜谱')).toBeInTheDocument();
  });

  it('shows recipes when they match the collection recipeIds', () => {
    mockUseRecipes.mockReturnValue({
      categories: [MOCK_CATEGORY],
      recipes: [KITCHEN_RECIPE],
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useRecipes>);

    renderCollection('kitchen-appliances');

    expect(screen.getByText('炸薯条')).toBeInTheDocument();
    expect(screen.getByText('1 道菜谱')).toBeInTheDocument();
  });

  it('shows error message for invalid collectionId', () => {
    renderCollection('nonexistent');

    expect(screen.getByText('聚合页不存在')).toBeInTheDocument();
    expect(screen.getByText('← 返回首页')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    mockUseRecipes.mockReturnValue({
      categories: [],
      recipes: [],
      loading: true,
      error: null,
    } as unknown as ReturnType<typeof useRecipes>);

    renderCollection('kitchen-appliances');

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows error message when recipes fail to load', () => {
    mockUseRecipes.mockReturnValue({
      categories: [],
      recipes: [],
      loading: false,
      error: '网络错误',
    } as unknown as ReturnType<typeof useRecipes>);

    renderCollection('kitchen-appliances');

    expect(screen.getByText('网络错误')).toBeInTheDocument();
  });

  it('displays collection description', () => {
    renderCollection('kitchen-appliances');

    expect(screen.getByText(/不用明火也能做菜/)).toBeInTheDocument();
  });
});
