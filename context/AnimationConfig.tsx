'use client';
import React, { createContext, useContext, useMemo } from 'react';
import { usePerfProfile, PerfTier } from '@/hooks/usePerfProfile';

export type AnimConfig = {
  particles: { count: number; glow: number; trail: boolean; };
  fx: { heavy: boolean };
};

const MAP: Record<PerfTier, AnimConfig> = {
  ultra: { particles: { count: 260, glow: .9, trail: true },  fx: { heavy: true } },
  high:  { particles: { count: 200, glow: .75,trail: true }, fx: { heavy: true } },
  medium:{ particles: { count: 140, glow: .6, trail: false }, fx: { heavy: false } },
  low:   { particles: { count: 100, glow: .45,trail: false }, fx: { heavy: false } },
};

const Ctx = createContext<AnimConfig>(MAP.high);
export const useAnimConfig = () => useContext(Ctx);

export const AnimationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const tier = usePerfProfile();
  const value = useMemo(()=>MAP[tier],[tier]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
