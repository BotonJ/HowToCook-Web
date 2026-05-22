import React from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/types';

interface RecipeGridProps {
  recipes: Recipe[];
}

export const RecipeGrid: React.FC<RecipeGridProps> = ({ recipes }) => {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        <p>No recipes found in this category.</p>
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
};
