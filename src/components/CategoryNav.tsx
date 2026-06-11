import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { useT, useBasePath } from '@/lib/i18n';

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const t = useT();
  const base = useBasePath();
  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant sticky top-20 z-30">
      <div
        className="container mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-2"
      >
        <NavLink
          to={`${base}/`}
          end
          className={({ isActive }) => cn(
            "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all",
            isActive
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:border-primary/30 hover:text-primary"
          )}
        >
          {t.categoryNav.all}
        </NavLink>
        {categories.map((category) => (
          <NavLink
            key={category.id}
            to={`${base}/category/${category.id}`}
            className={({ isActive }) => cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:border-primary/30 hover:text-primary"
            )}
          >
            {category.displayName}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
