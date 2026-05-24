import type { Recipe } from '@/types';
import type { ApiRecipeDetail, ApiSearchResult, DishIndex } from '@/types/api';
import { withBaseUrl } from '@/lib/utils';

export function transformDishIndex(dish: DishIndex): Recipe {
  return {
    id: dish.id,
    name: dish.name,
    category: dish.category,
    difficulty: dish.difficulty,
    cuisine: dish.cuisine,
    cooking_method: dish.cooking_method,
    cook_time: dish.cook_time,
    ingredients: dish.ingredients,
    main_ingredients: dish.main_ingredients,
    tags: dish.tags,
    source: dish.source,
  };
}

export function transformApiRecipe(api: ApiRecipeDetail): Recipe {
  const ingredientsLines = [
    ...api.ingredients,
    ...(api.optional_ingredients?.map(i => `可选：${i}`) ?? []),
  ];

  const stepsText = api.steps
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n');

  return {
    id: api.id,
    name: api.name,
    category: api.category,
    imagePath: api.image_url
      ? api.image_url.startsWith('http')
        ? api.image_url
        : withBaseUrl(api.image_url)
      : undefined,
    difficulty: api.difficulty,
    cuisine: api.cuisine,
    cooking_method: api.cooking_method,
    cook_time: api.cook_time,
    ingredients: api.ingredients,
    main_ingredients: api.main_ingredients,
    tags: api.tags,
    source: api.source,
    description: api.introduction ?? undefined,
    ingredients_text: ingredientsLines.length > 0 ? ingredientsLines.join('\n') : undefined,
    steps_text: api.steps.length > 0 ? stepsText : undefined,
    extra_text: api.tips.length > 0 ? api.tips.join('\n') : undefined,
  };
}

export function transformSearchResult(
  result: ApiSearchResult,
  localMap: Map<string, Recipe>,
): Recipe {
  const local = localMap.get(result.id);
  if (local) return local;

  return {
    id: result.id,
    name: result.name,
    category: result.category,
    imagePath: result.image_url
      ? result.image_url.startsWith('http')
        ? result.image_url
        : withBaseUrl(result.image_url)
      : undefined,
    difficulty: result.difficulty ?? 0,
    cuisine: result.cuisine ?? '',
    cooking_method: result.cooking_method ?? '',
    cook_time: '',
    ingredients: [],
    main_ingredients: [],
    source: 'howtocook',
  };
}
