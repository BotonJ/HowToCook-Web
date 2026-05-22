import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recipe } from '@/types';
import { withBaseUrl } from '@/lib/utils';
import { COOK_TIME_SHORT, CATEGORY_LABELS } from '@/lib/constants';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const cookTimeLabel = COOK_TIME_SHORT[recipe.cook_time];
  const isSpicy = recipe.tags?.spicy;
  const categoryLabel = CATEGORY_LABELS[recipe.category] || recipe.category;

  if (!recipe.imagePath) {
    return (
      <Link to={`/recipe/${recipe.id}`}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ y: -5 }}
          className="group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-lg shadow-ambient hover:shadow-lg transition-shadow duration-300 aspect-[9/16] bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 flex flex-col items-center justify-center p-6">
            <h3 className="font-display font-bold text-headline-lg text-on-surface text-center leading-tight mb-3">
              {recipe.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {cookTimeLabel && (
                <span className="bg-surface/80 backdrop-blur-sm text-on-surface text-label-sm px-3 py-1 rounded-full">
                  {cookTimeLabel}
                </span>
              )}
              {recipe.cuisine && (
                <span className="bg-surface/80 backdrop-blur-sm text-on-surface-variant text-label-sm px-3 py-1 rounded-full">
                  {recipe.cuisine}
                </span>
              )}
              {isSpicy && (
                <span className="bg-surface/80 backdrop-blur-sm text-label-sm px-3 py-1 rounded-full">
                  🌶️ 辣
                </span>
              )}
            </div>
            <p className="text-label-sm text-on-surface-variant">{categoryLabel}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/recipe/${recipe.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5 }}
        className="group cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest shadow-ambient hover:shadow-lg transition-shadow duration-300">
          <div className="aspect-[9/16] bg-surface-container relative">
            <img
              src={withBaseUrl(recipe.imagePath)}
              alt={recipe.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

          </div>

          <div className="p-3 flex items-center gap-2">
            <h3 className="font-display font-semibold text-on-surface text-base truncate min-w-0">
              {recipe.name}
            </h3>
            <div className="flex shrink-0 gap-1.5">
              {cookTimeLabel && (
                <span className="bg-surface/80 text-on-surface text-xs px-2 py-0.5 rounded-full border border-outline-variant">
                  {cookTimeLabel}
                </span>
              )}
              {isSpicy && (
                <span className="bg-surface/80 text-xs px-2 py-0.5 rounded-full border border-outline-variant">
                  🌶️
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant px-3 pb-3 -mt-1">{categoryLabel}</p>
        </div>
      </motion.div>
    </Link>
  );
};
