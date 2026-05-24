import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/types';

interface RecipeGridProps {
  recipes: Recipe[];
  emptyMessage?: string;
}

export function RecipeGrid({ recipes, emptyMessage }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        <p>{emptyMessage ?? '该分类暂无菜谱'}</p>
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