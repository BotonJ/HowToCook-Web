/**
 * Shared test utilities for component rendering tests.
 * Wraps components with required providers (Router + i18n).
 */
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import { LangProvider } from '@/lib/i18n';

/**
 * Render a component with MemoryRouter + LangProvider.
 * Use for any component that uses react-router-dom or i18n.
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] },
) {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <LangProvider>{children}</LangProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock fetch with specific JSON responses.
 * Usage: mockFetch({ '/categories': { categories: [...] } })
 */
export function mockFetch(responses: Record<string, unknown>) {
  globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
    const u = String(url);
    for (const [pattern, body] of Object.entries(responses)) {
      if (u.includes(pattern)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response('', { status: 404 });
  }) as unknown as typeof globalThis.fetch;
}

/**
 * Minimal recipe fixture for tests.
 */
export const MOCK_RECIPE = {
  id: 'test-1',
  name: '红烧肉',
  category: 'meat',
  difficulty: 3 as const,
  cuisine: 'Hunan',
  cooking_method: 'braise',
  cook_time: 'medium' as const,
  ingredients: ['pork', 'soy sauce'],
  main_ingredients: ['pork'],
  source: 'howtocook',
  tags: {},
  language: 'zh' as const,
  description: '经典红烧肉做法',
  steps_text: '1. 切肉\n2. 炒糖色\n3. 炖煮',
};

export const MOCK_CATEGORY = {
  id: 'meat',
  name: '荤菜',
  displayName: '荤菜',
  recipes: [MOCK_RECIPE],
};
