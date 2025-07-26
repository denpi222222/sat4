'use client';
import { useEffect } from 'react';

/**
 * Safe, no nonce, under CSP 'script-src self'.
 */
export default function ViewportFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const setViewportHeight = () => {
      try {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      } catch (error) {
        console.warn('ViewportFix: Failed to set viewport height', error);
      }
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);
  return null;
}
