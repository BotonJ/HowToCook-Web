export interface ApiSearchResult {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  cuisine: string;
  cooking_method: string;
  image_url: string | null;
  cook_time?: string;
  ingredients?: string[];
  main_ingredients?: string[];
  tags?: string[];
  source?: string;
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

export interface DishIndex {
  id: string;
  name: string;
  difficulty: number;
  category: string;
  source: string;
  cuisine: string;
  cooking_method: string;
  cook_time: string;
  main_ingredients: string[];
  ingredients: string[];
  tags: {
    spicy?: boolean;
    allergens?: string[];
    diet?: string[];
  };
  has_duplicate?: boolean;
  language?: string; // "zh" | "en", 默认 "zh"
  image_url?: string;
}

export interface ApiRecipesResponse {
  recipes: DishIndex[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiCategory {
  id: string;
  name: string;
  count: number;
}

export interface ApiCategoriesResponse {
  categories: ApiCategory[];
  total: number;
}

export interface ApiVersionResponse {
  version: string;
  recipe_count: number;
  last_updated: string;
}

/** English recipe entry from en_index_curated.json */
export interface EnDish {
  name: string;
  difficulty: number;
  category: string;
  source: string;
  source_id?: string;
  cuisine: string;
  cuisine_zh?: string;
  cooking_method: string;
  cook_time: string;
  main_ingredients: string[];
  ingredients: string[];
  instructions?: string[];
  technique_primary?: string;
  technique_secondary?: string[];
  language: string;
  bridge_to?: string[];
  source_dataset?: string;
  tags?: {
    spicy?: boolean;
    allergens?: string[];
    diet?: string[];
  };
  epicurious_meta?: {
    description?: string;
  };
}

/** English index file envelope */
export interface EnIndexData {
  version: string;
  total: number;
  source: string;
  dishes: EnDish[];
}

/** Noodle recipe entry from noodle-recipes.json */
export interface NoodleDish {
  id: string;
  name: string;
  category: string;
  source: string;
  difficulty: number;
  cook_time: string;
  cooking_method: string;
  cuisine: string;
  main_ingredients: string[];
  ingredients: string[];
  language: string;
  description: string;
  steps_text: string;
}

/** Noodle recipes file envelope */
export interface NoodleData {
  version: string;
  total: number;
  source: string;
  dishes: NoodleDish[];
}
