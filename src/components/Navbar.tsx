import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="container mx-auto px-4 md:px-margin-desktop h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg text-on-primary group-hover:bg-primary-container transition-colors">
            <ChefHat size={24} />
          </div>
          <span className="font-display font-bold text-headline-lg text-primary tracking-tight">
            做饭指北
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/about"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            关于
          </Link>
          <Link
            to="/credits"
            className="text-on-surface-variant hover:text-primary transition-colors text-label-lg hidden sm:block"
          >
            致谢
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
};
