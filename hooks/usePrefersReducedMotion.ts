'use client';
import { useEffect, useState } from 'react';

export default function usePrefersReducedMotion() {
  const [reduce, set] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => set(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);
  return reduce;
}
