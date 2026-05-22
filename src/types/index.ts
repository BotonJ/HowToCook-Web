export interface Recipe {
  id: string;
  name: string;
  category: string;
  imagePath?: string;
  difficulty: number;
  cuisine: string;
  cooking_method: string;
  cook_time: string;
  ingredients: string[];
  main_ingredients: string[];
  tags: {
    spicy: boolean;
    allergens: string[];
    diet: string[];
  };
  source: string;
  description?: string;
  ingredients_text?: string;
  calculation_text?: string;
  steps_text?: string;
  extra_text?: string;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  count: number;
  recipes: Recipe[];
}
