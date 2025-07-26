'use client';

import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    const checkDevice = () => {
      try {
        // First check if the device is Windows
        const isWindows = navigator.userAgent.includes('Win');

        // If it's Windows, we IMMEDIATELY say it's NOT a mobile device.
        if (isWindows) {
          setIsMobile(false);
          return; // Exit the function, no further checks needed.
        }

        // If it's NOT Windows (e.g., Android, Mac, iOS),
        // THEN we check the screen width.
        const isNarrowScreen = window.innerWidth < 768;
        setIsMobile(isNarrowScreen);
      } catch (error) {
        console.warn('Failed to check device type:', error);
        setIsMobile(false);
      }
    };

    // Perform check on load and when window size changes
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Clean up listener on unmount
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTelegram: false, isMetaMaskBrowser: false };
}

// Convenience alias to match older import signature
export const useIsMobile = useMobile;
