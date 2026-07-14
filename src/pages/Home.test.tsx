import { renderWithProviders, MOCK_RECIPE, MOCK_CATEGORY } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { useRecipes } from '@/hooks/useRecipes';
import { Home } from './Home';

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(() => ({
    categories: [MOCK_CATEGORY],
    recipes: [MOCK_RECIPE],
    loading: false,
    error: null,
    retry: vi.fn(),
  })),
  findRecipeById: vi.fn(),
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

vi.mock('@/components/CategoryNav', () => ({
  CategoryNav: ({ categories }: { categories: { displayName: string }[] }) => (
    <nav data-testid="category-nav">
      {categories.map((c: { displayName: string }, i: number) => (
        <span key={i}>{c.displayName}</span>
      ))}
    </nav>
  ),
}));

vi.mock('@/components/CuisineNav', () => ({
  CuisineNav: () => <nav data-testid="cuisine-nav" />,
}));

vi.mock('@/components/SourceNav', () => ({
  SourceNav: () => <nav data-testid="source-nav" />,
}));

vi.mock('@/components/McpBanner', () => ({
  McpBanner: () => <div data-testid="mcp-banner" />,
}));

vi.mock('@/components/WebsiteJsonLd', () => ({
  WebsiteJsonLd: () => null,
}));

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

const mockUseRecipes = vi.mocked(useRecipes);

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Force zh locale for consistent test output
    localStorage.setItem('htc-lang', 'zh');
    mockUseRecipes.mockReturnValue({
      categories: [MOCK_CATEGORY],
      recipes: [MOCK_RECIPE],
      loading: false,
      error: null,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useRecipes>);
  });

  it('shows loading spinner when loading', () => {
    mockUseRecipes.mockReturnValue({
      categories: [],
      recipes: [],
      loading: true,
      error: null,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useRecipes>);

    renderWithProviders(<Home />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows error message and retry button on error', () => {
    const retryFn = vi.fn();
    mockUseRecipes.mockReturnValue({
      categories: [],
      recipes: [],
      loading: false,
      error: '网络错误',
      retry: retryFn,
    } as unknown as ReturnType<typeof useRecipes>);

    renderWithProviders(<Home />);

    expect(screen.getByText('网络错误')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: '重试' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(retryFn).toHaveBeenCalled();
  });

  it('renders category nav and recipe grid in normal state', () => {
    renderWithProviders(<Home />);

    // Category nav (zh mode renders SourceNav + CategoryNav)
    expect(screen.getByTestId('category-nav')).toBeInTheDocument();
    expect(screen.getByText('荤菜')).toBeInTheDocument();

    // Recipe grid
    expect(screen.getByTestId('recipe-grid')).toBeInTheDocument();
    expect(screen.getByText('红烧肉')).toBeInTheDocument();
  });

  it('displays category display names in category navigation', () => {
    renderWithProviders(<Home />);

    expect(screen.getByText('荤菜')).toBeInTheDocument();
  });
});
