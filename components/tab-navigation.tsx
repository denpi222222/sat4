'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';
import {
  Flame,
  Heart,
  Coins,
  Bell,
  Skull,
  Info,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';

/**
 * Under-the-hood fix for navigation hangs:
 *  - remove manual isNavigating/targetPath/setTimeout flags
 *  - use React.useTransition()
 *  - preserve visual 1:1
 */
export const TabNavigation = React.memo(function TabNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile } = useMobile();

  const [isPending, startTransition] = React.useTransition();

  const tr = (key: string, fallback: string) => t(key, fallback);

  const tabs = useMemo(
    () => [
      { path: '/ping', label: tr('tabs.ping', 'Ping'), icon: <Bell className="w-4 h-4 mr-1" /> },
      { path: '/breed', label: tr('tabs.breed', 'Breeding'), icon: <Heart className="w-4 h-4 mr-1" /> },
      { path: '/burn', label: tr('tabs.burn', 'Burn'), icon: <Flame className="w-4 h-4 mr-1" /> },
      { path: '/graveyard', label: tr('tabs.graveyard', 'Graveyard'), icon: <Skull className="w-4 h-4 mr-1" /> },
      { path: '/rewards', label: tr('tabs.rewards', 'Rewards'), icon: <Coins className="w-4 h-4 mr-1" /> },
      { path: '/bridge', label: tr('tabs.bridge', 'Bridge'), icon: <ArrowRightLeft className="w-4 h-4 mr-1" /> },
      { path: '/info', label: 'Info', icon: <Info className="w-4 h-4 mr-1" /> },
    ],
    [t]
  );

  useEffect(() => {
    // safe prefetch
    // @ts-ignore
    if (typeof router.prefetch === 'function') {
      tabs.forEach((tab) => {
        try {
          // @ts-ignore
          router.prefetch(tab.path);
        } catch {}
      });
    }
  }, [router, tabs]);

  const go = (path: string) => {
    if (pathname === path) return;
    startTransition(() => {
      router.push(path);
    });
  };

  // Hide on mobile devices - mobile navigation is handled by MobileNavigation component
  if (isMobile) return null;

  return (
    <div className="flex justify-center mb-6">
      <div className="crypto-card bg-card/50 backdrop-blur-md rounded-2xl p-1.5 shadow-xl max-w-full overflow-hidden">
        <div className="flex space-x-0.5 md:space-x-1 lg:space-x-1.5 flex-nowrap justify-center min-w-0">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            const showSpinner = isPending && !isActive;

            return (
              <motion.div
                key={tab.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`relative transition-all duration-200 text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-1 md:py-1.5 whitespace-nowrap ${
                    isActive
                      ? `neon-button neon-outline`
                      : `text-foreground/70 hover:text-foreground hover:bg-card/50`
                  } ${showSpinner ? 'opacity-70' : ''}`}
                  onClick={() => go(tab.path)}
                  disabled={showSpinner}
                >
                  {showSpinner ? (
                    <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 animate-spin" />
                  ) : (
                    <span className="mr-1">
                      {React.cloneElement(tab.icon, { 
                        className: "w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" 
                      })}
                    </span>
                  )}
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                  <span className="relative z-10 sm:hidden">{tab.label.slice(0, 3)}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/20 to-primary/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
