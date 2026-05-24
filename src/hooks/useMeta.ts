import { useEffect, useRef } from 'react';

interface MetaOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
}

export function useMeta({ title, description, ogImage, ogUrl }: MetaOptions) {
  const trackedRef = useRef<Element[]>([]);

  useEffect(() => {
    const tracked: Element[] = (trackedRef.current = []);
    const fullTitle = title ? `${title} - 做饭指北` : '做饭指北 - HowToCook';
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
        tracked.push(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }

    setMeta('og:title', fullTitle, true);
    setMeta('twitter:title', fullTitle);

    if (ogImage) {
      setMeta('og:image', ogImage, true);
    }

    if (ogUrl) {
      setMeta('og:url', ogUrl, true);
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
        tracked.push(canonical);
      }
      canonical.setAttribute('href', ogUrl);
    }

    return () => {
      for (const el of tracked) {
        el.remove();
      }
    };
  }, [title, description, ogImage, ogUrl]);
}