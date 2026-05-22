import React, { useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

interface CategoryNavProps {
  categories: Category[];
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ categories }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    // This is a simple implementation, a more robust one would find the active element
    // and scroll it into view.
  }, []);

  return (
    <div className="w-full bg-stone-50 border-b border-stone-200 sticky top-16 z-30">
      <div 
        ref={scrollRef}
        className="container mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-2"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) => cn(
            "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all",
            isActive 
              ? "bg-orange-500 text-white shadow-sm" 
              : "bg-white text-stone-600 border border-stone-200 hover:border-orange-200 hover:text-orange-600"
          )}
        >
          全部
        </NavLink>
        {categories.map((category) => (
          <NavLink
            key={category.id}
            to={`/category/${category.id}`}
            className={({ isActive }) => cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isActive 
                ? "bg-orange-500 text-white shadow-sm" 
                : "bg-white text-stone-600 border border-stone-200 hover:border-orange-200 hover:text-orange-600"
            )}
          >
            {category.displayName}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
