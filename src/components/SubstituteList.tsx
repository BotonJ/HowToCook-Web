import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { SubstituteEntry } from '@/hooks/useSubstituteProfiles';
import { useT } from '@/lib/i18n';

interface SubstituteListProps {
  /** The ingredient name shown in the row; used as the lookup key. */
  ingredient: string;
  /** Substitutes for this ingredient, or null if none precomputed. */
  substitutes: SubstituteEntry[] | null;
}

/**
 * Inline "替换" button + expandable top-5 substitute list for one ingredient
 * row in the recipe detail page.
 *
 * Renders nothing when there are no precomputed substitutes for the ingredient
 * (seasonings / vocab gaps) — the button simply doesn't appear, keeping the
 * ingredient list visually clean (handoff §1.3 decision #2: passive display).
 */
export function SubstituteList({ ingredient, substitutes }: SubstituteListProps) {
  const [open, setOpen] = useState(false);
  const t = useT();

  if (!substitutes || substitutes.length === 0) return null;

  return (
    <div className="border-t border-outline-variant/40 mt-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 py-1.5 text-primary hover:text-primary/80 transition-colors text-label-md font-body"
        aria-expanded={open}
        aria-label={`${t.recipe.substitute}: ${ingredient}`}
      >
        <ArrowLeftRight size={14} />
        <span>{t.recipe.substitute}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="flex flex-wrap gap-1.5 pb-2">
          {substitutes.map(s => (
            <li
              key={s.name}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary-container/40 text-on-surface-variant text-label-md font-body"
            >
              <span className="text-on-surface font-medium">{s.name}</span>
              <span className="text-outline text-label-sm">
                {s.reason === '同类替代' ? t.recipe.substituteSameCategory : t.recipe.substituteFlavorMatch}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
