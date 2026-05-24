import type { ApiSearchResponse, ApiRecipeDetail, ApiCategory, ApiRecipesResponse, DishIndex } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.howtocook.cn';

async function fetchApi<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchRecipes(params: {
  q?: string;
  category?: string;
  cuisine?: string;
  cooking_method?: string;
  cook_time?: string;
  limit?: number;
}): Promise<ApiSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) {
    const sanitized = params.q.trim().slice(0, 200).replace(/[\x00-\x1f]/g, '');
    if (sanitized) query.set('q', sanitized);
  }
  if (params.category) query.set('category', params.category);
  if (params.cuisine) query.set('cuisine', params.cuisine);
  if (params.cooking_method) query.set('cooking_method', params.cooking_method);
  if (params.cook_time) query.set('cook_time', params.cook_time);
  if (params.limit) query.set('limit', String(params.limit));
  return fetchApi<ApiSearchResponse>(`/search?${query.toString()}`);
}

export async function getRecipeDetail(id: string): Promise<ApiRecipeDetail> {
  return fetchApi<ApiRecipeDetail>(`/recipe/${encodeURIComponent(id)}`);
}

export async function fetchAllRecipes(): Promise<DishIndex[]> {
  const data = await fetchApi<ApiRecipesResponse>('/recipes');
  return data.recipes;
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const data = await fetchApi<{ categories: ApiCategory[]; total: number }>('/categories');
  return data.categories;
}
