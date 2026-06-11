import { useEffect, RefObject } from 'react';

/**
 * Calls callback when user clicks outside the given element.
 * Set enabled=false to temporarily disable (e.g. when dropdown is closed).
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  callback: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function handleClick(e: MouseEvent) {
      if (refs.every(ref => ref.current && !ref.current.contains(e.target as Node))) {
        callback();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [refs, callback, enabled]);
}
