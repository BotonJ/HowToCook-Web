import type { ApiSearchResponse, ApiRecipeDetail } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.howtocook.cn';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
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
  if (params.q) query.set('q', params.q);
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
