import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Languages, Search } from 'lucide-react';
import { useI18n, useT } from '@/lib/i18n';
import { useClickOutside } from '../hooks/useClickOutside';

function useCollections() {
  const t = useT();
  return useMemo(() => [
    // ── 中文专题（2026-06-02） ──────────────────────────────────────
    { id: 'air-fryer', label: t.nav.collectionLabels['air-fryer'], emoji: '🍳' },
    { id: 'microwave', label: t.nav.collectionLabels['microwave'], emoji: '📡' },
    { id: 'rice-cooker', label: t.nav.collectionLabels['rice-cooker'], emoji: '🍚' },
    { id: 'lazy-meal', label: t.nav.collectionLabels['lazy-meal'], emoji: '😴' },
    { id: 'rice-killer', label: t.nav.collectionLabels['rice-killer'], emoji: '🍚' },
    { id: 'oven', label: t.nav.collectionLabels['oven'], emoji: '🔥' },
  ], [t]);
}

export function Navbar() {
  const [showCollections, setShowCollections] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang, setLang } = useI18n();
  const t = useT();
  const COLLECTIONS = useCollections();

  useClickOutside([dropdownRef], () => setShowCollections(false), showCollections);

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-surface/90 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="container mx-auto px-4 md:px-16 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={lang === 'zh' ? '/images/logo_cn_v2.png' : '/images/logo_en_v2.png'}
            alt={t.nav.siteName}
            className="h-10 w-auto"
          />
          <span className="font-display font-bold text-headline-lg text-primary tracking-tight">
            {t.nav.siteName}
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/academy"
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-all text-label-lg hidden md:block"
          >
            {t.nav.academy}
          </Link>

          {/* 专题下拉菜单 */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCollections(!showCollections)}
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-all text-label-lg"
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
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-all text-label-lg hidden md:block"
          >
            {t.nav.explore}
          </Link>
          <Link
            to="/about"
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-all text-label-lg hidden md:block"
          >
            {t.nav.about}
          </Link>
          <Link
            to="/credits"
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-all text-label-lg hidden md:block"
          >
            {t.nav.credits}
          </Link>

          <Link
            to="/search"
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-all"
            title={t.common.search}
          >
            <Search size={18} />
          </Link>

          {/* USER_MODULE_SEAM: 未来用户菜单（auth / profile / 收藏）接入点。
              本轮不建 auth（安全面需正经做），渲染 null。见 plan §用户模块站位。
              未来：在此处 drop <UserMenu />，无需改布局。 */}

          {/* Language switcher - state toggle, no page reload */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-all"
            title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Languages size={18} />
            <span className="hidden md:inline">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>

          <a
            href="https://github.com/BotonJ/HowToCook-Web"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source code on GitHub"
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-all hidden md:block"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
