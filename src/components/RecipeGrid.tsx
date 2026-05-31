import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/types';
import { useT } from '@/lib/i18n';

interface RecipeGridProps {
  recipes: Recipe[];
  emptyMessage?: string;
}

export function RecipeGrid({ recipes, emptyMessage }: RecipeGridProps) {
  const t = useT();
  if (recipes.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        <p>{emptyMessage ?? t.recipeGrid.emptyDefault}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter-mobile md:gap-gutter-desktop">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
        />
      ))}
    </div>
  );
}
