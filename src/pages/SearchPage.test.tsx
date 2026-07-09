import { renderWithProviders, MOCK_RECIPE, MOCK_CATEGORY } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { useRecipes } from '@/hooks/useRecipes';
import { useSearch } from '@/hooks/useSearch';
import { SearchPage } from './SearchPage';

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(() => ({
    categories: [MOCK_CATEGORY],
    recipes: [MOCK_RECIPE],
    loading: false,
    error: null,
    retry: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(() => ({ results: null, loading: false, error: null })),
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
const mockUseSearch = vi.mocked(useSearch);

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('htc-lang', 'zh');
    mockUseRecipes.mockReturnValue({
      categories: [MOCK_CATEGORY],
      recipes: [MOCK_RECIPE],
      loading: false,
      error: null,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useRecipes>);
    mockUseSearch.mockReturnValue({
      results: null,
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useSearch>);
  });

  it('renders without crashing', () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('displays search box with placeholder', () => {
    renderWithProviders(<SearchPage />);

    const input = screen.getByPlaceholderText('搜索菜谱、食材、菜系...');
    expect(input).toBeInTheDocument();
  });

  it('displays filter sidebar with category, time and difficulty options', () => {
    renderWithProviders(<SearchPage />);

    // Category filter heading
    expect(screen.getByText('分类')).toBeInTheDocument();
    expect(screen.getByText('荤菜')).toBeInTheDocument();

    // Time filter heading
    expect(screen.getByText('时间')).toBeInTheDocument();
    // Use getAllByText since "不限" appears for both time and difficulty
    expect(screen.getAllByText('不限')).toHaveLength(2);

    // Difficulty filter heading
    expect(screen.getByText('难度')).toBeInTheDocument();
    expect(screen.getByText('新手')).toBeInTheDocument();
    expect(screen.getByText('简单')).toBeInTheDocument();
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('困难')).toBeInTheDocument();
  });

  it('updates search term when typing in search box', () => {
    renderWithProviders(<SearchPage />);

    const input = screen.getByPlaceholderText('搜索菜谱、食材、菜系...');
    fireEvent.change(input, { target: { value: '红烧' } });

    expect(input).toHaveValue('红烧');
  });

  it('shows empty message when no recipes match search', () => {
    mockUseSearch.mockReturnValue({
      results: [],
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useSearch>);

    renderWithProviders(<SearchPage />);

    const input = screen.getByPlaceholderText('搜索菜谱、食材、菜系...');
    fireEvent.change(input, { target: { value: '不存在的菜' } });

    expect(screen.getByText('未找到匹配的菜谱，试试其他关键词')).toBeInTheDocument();
  });

  it('displays recipe count in results info', () => {
    renderWithProviders(<SearchPage />);

    expect(screen.getByText('道菜谱')).toBeInTheDocument();
  });

  it('renders sort selector', () => {
    renderWithProviders(<SearchPage />);

    expect(screen.getByText('排序:')).toBeInTheDocument();
    const sortSelect = screen.getByRole('combobox');
    expect(sortSelect).toBeInTheDocument();
  });
});
