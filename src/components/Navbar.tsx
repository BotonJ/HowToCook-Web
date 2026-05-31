import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ChevronDown } from 'lucide-react';
import { useT } from '@/lib/i18n';

function useCollections() {
  const t = useT();
  return useMemo(() => [
    { id: 'chinese-recipes', label: t.nav.collectionLabels['chinese-recipes'], emoji: '🥢' },
    { id: 'chicken-recipes', label: t.nav.collectionLabels['chicken-recipes'], emoji: '🍗' },
    { id: 'baking', label: t.nav.collectionLabels['baking'], emoji: '🍞' },
    { id: 'air-fryer', label: t.nav.collectionLabels['air-fryer'], emoji: '🍟' },
    { id: 'pasta', label: t.nav.collectionLabels['pasta'], emoji: '🍝' },
  ], [t]);
}

export function Navbar() {
  const [showCollections, setShowCollections] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const COLLECTIONS = useCollections();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCollections(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="container mx-auto px-4 md:px-margin-desktop h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg text-on-primary group-hover:bg-primary-container transition-colors">
            <ChefHat size={24} />
          </div>
          <span className="font-display font-bold text-headline-lg text-primary tracking-tight">
            {t.nav.siteName}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/academy"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {t.nav.academy}
          </Link>

          {/* 专题下拉菜单 */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCollections(!showCollections)}
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-label-lg"
            >
              {t.nav.collections}
              <ChevronDown size={16} className={`transition-transform ${showCollections ? 'rotate-180' : ''}`} />
            </button>
            {showCollections && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50">
                {COLLECTIONS.map((col) => (
                  <Link
                    key={col.id}
                    to={`/collection/${col.id}`}
                    onClick={() => setShowCollections(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span>{col.emoji}</span>
                    <span>{col.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/explore"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {t.nav.explore}
          </Link>
          <Link
            to="/about"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {t.nav.about}
          </Link>
          <Link
            to="/credits"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {t.nav.credits}
          </Link>
          <a
            href="https://github.com/BotonJ/HowToCook-Web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
