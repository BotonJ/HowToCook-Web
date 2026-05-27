import type { Recipe } from '@/types';
import { SITE_URL } from '@/lib/constants';

const COOK_TIME_ISO: Record<string, string> = {
  quick: 'PT15M',
  medium: 'PT30M',
  long: 'PT60M',
  very_long: 'PT90M',
};

const DIET_SCHEMA: Record<string, string> = {
  '素食': 'https://schema.org/VegetarianDiet',
  '清真': 'https://schema.org/KosherDiet',
  '低碳': 'https://schema.org/LowCalorieDiet',
};

function parseSteps(text: string) {
  const groups: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (/^\d+\.\s/.test(line.trimStart())) {
      if (current) groups.push(current);
      current = line.trimStart().replace(/^\d+\.\s*/, '');
    } else if (/^[-*]\s/.test(line.trimStart())) {
      if (current) groups.push(current);
      current = line.trimStart().replace(/^[-*]\s*/, '');
    } else if (current) {
      current += '\n' + line;
    }
  }
  if (current) groups.push(current);
  return groups.map(text => ({ '@type': 'HowToStep', text: text.trim() }));
}

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  const recipeUrl = `${SITE_URL}/recipe/${encodeURIComponent(recipe.id)}`;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description || `${recipe.name} 的做法`,
    url: recipeUrl,
    image: recipe.imagePath ? `${SITE_URL}/${recipe.imagePath}` : undefined,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine || '中国菜',
    keywords: [recipe.name, recipe.cuisine, recipe.cooking_method].filter(Boolean).join(', '),
    recipeIngredient: recipe.ingredients || [],
    author: {
      '@type': 'Organization',
      name: '做饭指北',
      url: SITE_URL,
    },
    ...(recipe.cook_time && {
      cookTime: COOK_TIME_ISO[recipe.cook_time] || 'PT30M',
    }),
    ...(recipe.steps_text && {
      recipeInstructions: parseSteps(recipe.steps_text),
    }),
    ...(recipe.difficulty > 0 && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'CNY',
        value: recipe.difficulty <= 2 ? '低' : recipe.difficulty <= 3 ? '中' : '高',
      },
    }),
    ...(recipe.tags?.diet && recipe.tags.diet.length > 0 && {
      suitableForDiet: recipe.tags.diet
        .map(d => DIET_SCHEMA[d])
        .filter(Boolean)
        .join(', '),
    }),
    publisher: {
      '@type': 'Organization',
      name: '做饭指北',
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/<\/script>/gi, '<\\/script>') }}
    />
  );
}
