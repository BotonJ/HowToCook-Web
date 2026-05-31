import { Link } from 'react-router-dom';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Recipe } from '@/types';
import { withBaseUrl } from '@/lib/utils';
import { COOK_TIME_SHORT, CATEGORY_LABELS } from '@/lib/constants';
import { FlavorMini } from '@/components/FlavorMini';
import { useT, useBasePath } from '@/lib/i18n';

/** Shared entrance/hover animation for recipe cards (no `layout` — too expensive with many cards). */
const cardMotionProps: HTMLMotionProps<'div'> = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9 },
  whileHover: { y: -5 },
};

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const cookTimeLabel = COOK_TIME_SHORT[recipe.cook_time];
  const isSpicy = recipe.tags?.spicy;
  const categoryLabel = CATEGORY_LABELS[recipe.category] || recipe.category;
  const t = useT();
  const base = useBasePath();

  if (!recipe.imagePath) {
    return (
      <Link to={`${base}/recipe/${recipe.id}`}>
        <motion.div {...cardMotionProps} className="group cursor-pointer">
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
                  🌶️ {t.recipe.spicy}
                </span>
              )}
            </div>
            {recipe.flavorProfile && (
              <div className="flex justify-center mb-3">
                <FlavorMini profile={recipe.flavorProfile} />
              </div>
            )}
            <p className="text-label-sm text-on-surface-variant">{categoryLabel}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`${base}/recipe/${recipe.id}`}>
      <motion.div {...cardMotionProps} className="group cursor-pointer">
        <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest shadow-ambient hover:shadow-lg transition-shadow duration-300">
          <div className="aspect-[9/16] bg-surface-container relative">
            <img
              src={withBaseUrl(recipe.imagePath)}
              alt={recipe.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

          </div>

          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">{categoryLabel}</p>
              {recipe.flavorProfile && <FlavorMini profile={recipe.flavorProfile} />}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
