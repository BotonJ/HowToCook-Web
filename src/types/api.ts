export interface ApiSearchResult {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  cuisine: string;
  cooking_method: string;
  image_url: string | null;
}

export interface ApiSearchResponse {
  results: ApiSearchResult[];
  total: number;
  query: {
    q: string;
    category: string;
    cuisine: string;
    cooking_method: string;
    cook_time: string;
    limit: number;
  };
}

export interface ApiRecipeDetail {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  introduction: string | null;
  difficulty: number;
  cuisine: string;
  cooking_method: string;
  cook_time: string;
  ingredients: string[];
  optional_ingredients: string[];
  main_ingredients: string[];
  steps: string[];
  tips: string[];
  tags: {
    spicy?: boolean;
    allergens?: string[];
    diet?: string[];
  };
  source: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  count: number;
}

export interface ApiCategoriesResponse {
  categories: ApiCategory[];
}

export interface ApiVersionResponse {
  version: string;
  recipe_count: number;
  last_updated: string;
}
