import type { Recipe } from '@/types';

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  const siteUrl = 'https://howtocook.cn';
  const recipeUrl = `${siteUrl}/recipe/${encodeURIComponent(recipe.name)}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description || `${recipe.name} 的做法`,
    url: recipeUrl,
    image: recipe.imagePath ? `${siteUrl}/${recipe.imagePath}` : undefined,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine || '中国菜',
    keywords: [recipe.name, recipe.cuisine, recipe.cooking_method].filter(Boolean).join(', '),
    recipeIngredient: recipe.ingredients || [],
    ...(recipe.difficulty > 0 && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'CNY',
        value: recipe.difficulty <= 2 ? '低' : recipe.difficulty <= 3 ? '中' : '高',
      },
    }),
    ...(recipe.tags?.allergens && recipe.tags.allergens.length > 0 && {
      suitableForDiet: recipe.tags.diet?.map(d => `https://schema.org/${d}Diet`).join(', '),
    }),
    publisher: {
      '@type': 'Organization',
      name: '做饭指北',
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/<\/script>/gi, '<\\/script>') }}
    />
  );
}
