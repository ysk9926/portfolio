'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks which registered element sits closest to the vertical center of
 * the viewport. A narrow IntersectionObserver band around the center keeps
 * it cheap; ties inside the band are broken by measured distance.
 */
export function useScrollSpotlight(keys: readonly string[]) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const elementsRef = useRef(new Map<string, HTMLElement>());
  const intersectingRef = useRef(new Set<string>());
  const keySignature = keys.join(' ');

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) {
        el.dataset.spotlightKey = key;
        elementsRef.current.set(key, el);
      } else {
        elementsRef.current.delete(key);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const pickNearest = () => {
      const centerY = window.innerHeight / 2;
      let bestKey: string | null = null;
      let bestDistance = Infinity;
      for (const key of intersectingRef.current) {
        const el = elementsRef.current.get(key);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - centerY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = key;
        }
      }
      if (bestKey) setActiveKey(bestKey);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.spotlightKey;
          if (!key) continue;
          if (entry.isIntersecting) intersectingRef.current.add(key);
          else intersectingRef.current.delete(key);
        }
        pickNearest();
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );

    const intersecting = intersectingRef.current;
    elementsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      intersecting.clear();
    };
    // keySignature changes whenever the set of registered keys changes.
  }, [keySignature]);

  return { activeKey, register };
}
