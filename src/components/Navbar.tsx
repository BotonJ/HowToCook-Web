import { Link } from 'react-router-dom';
import { Languages, Search } from 'lucide-react';
import { useI18n, useT } from '@/lib/i18n';

export function Navbar() {
  const { lang, setLang } = useI18n();
  const t = useT();

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

          {/* /explore link hidden per handoff decision #10 — route + component
              preserved (deep-linkable), only the nav entry is removed. */}
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
