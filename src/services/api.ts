import type { ApiSearchResponse, ApiRecipeDetail, ApiCategory, ApiRecipesResponse, DishIndex } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.howtocook.cn';

async function fetchApi<T>(path: string, externalSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  // Link external signal so caller can cancel too
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out, please try again later');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function searchRecipes(params: {
  q?: string;
  category?: string;
  cuisine?: string;
  cooking_method?: string;
  cook_time?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<ApiSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) {
    const sanitized = params.q.trim().slice(0, 200).replace(/[\x00-\x1f]/gu, ''); // eslint-disable-line no-control-regex
    if (sanitized) query.set('q', sanitized);
  }
  if (params.category) query.set('category', params.category);
  if (params.cuisine) query.set('cuisine', params.cuisine);
  if (params.cooking_method) query.set('cooking_method', params.cooking_method);
  if (params.cook_time) query.set('cook_time', params.cook_time);
  if (params.limit) query.set('limit', String(params.limit));
  return fetchApi<ApiSearchResponse>(`/search?${query.toString()}`, params.signal);
}

export async function getRecipeDetail(id: string, signal?: AbortSignal): Promise<ApiRecipeDetail> {
  return fetchApi<ApiRecipeDetail>(`/recipe/${encodeURIComponent(id)}`, signal);
}

export async function fetchAllRecipes(): Promise<DishIndex[]> {
  // Fetch all recipes from the paginated API. Use a large page size so the
  // ~700-recipe index typically fits in a single request, but loop to handle
  // future growth or an API-enforced smaller cap.
  const PAGE_SIZE = 2000;
  const allRecipes: DishIndex[] = [];
  let page = 1;

  while (true) {
    const data = await fetchApi<ApiRecipesResponse>(
      `/recipes?page=${page}&limit=${PAGE_SIZE}`,
    );
    const pageRecipes = data.recipes ?? [];
    if (pageRecipes.length === 0) break;

    allRecipes.push(...pageRecipes);

    // Stop when we've fetched the full dataset or the last page.
    if (pageRecipes.length < PAGE_SIZE) break;
    if (allRecipes.length >= (data.pagination?.total ?? data.total ?? 0)) break;

    page += 1;
    // Safety cap to avoid runaway requests if the API misbehaves.
    if (page > 20) {
      console.warn('[fetchAllRecipes] pagination safety cap reached');
      break;
    }
  }

  return allRecipes;
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const data = await fetchApi<{ categories: ApiCategory[]; total: number }>('/categories');
  return data.categories;
}
