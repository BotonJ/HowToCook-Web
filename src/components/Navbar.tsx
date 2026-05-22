import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Languages } from 'lucide-react';

const STORAGE_KEY = 'htc-lang';

function getInitialLang(): 'zh' | 'en' {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

function applyLang(lang: 'zh' | 'en') {
  document.title = lang === 'zh' ? '做饭指北 - HowToCook' : 'Awesome Cook - HowToCook';
  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    desc.setAttribute('content', lang === 'zh'
      ? '做饭指北 — 500+ 道菜谱，按分类浏览，附 AI 生成图片。程序员也能做好饭。'
      : 'Awesome Cook — 500+ recipes with AI-generated images. Browse by category. Even programmers can cook.');
  }
}

export const Navbar: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>(getInitialLang);

  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => { applyLang(lang); }, [lang]);

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="container mx-auto px-4 md:px-margin-desktop h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg text-on-primary group-hover:bg-primary-container transition-colors">
            <ChefHat size={24} />
          </div>
          <span className="font-display font-bold text-headline-lg text-primary tracking-tight">
            {lang === 'zh' ? '做饭指北' : 'Awesome Cook'}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-label-lg"
            title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Languages size={18} />
            <span className="hidden sm:inline">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>
          <Link
            to="/about"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {lang === 'zh' ? '关于' : 'About'}
          </Link>
          <Link
            to="/credits"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            {lang === 'zh' ? '致谢' : 'Credits'}
          </Link>
          <a
            href="https://github.com/king-jingxiang/HowToCook"
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
};
