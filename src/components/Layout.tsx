import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { ScrollRestoration } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-margin-desktop py-6">
        {children}
      </main>
      <footer className="bg-surface-container border-t border-outline-variant py-8 text-center text-on-surface-variant text-sm">
        <p>&copy; {new Date().getFullYear()} HowToCook. Open Source Project.</p>
      </footer>
    </div>
  );
}
