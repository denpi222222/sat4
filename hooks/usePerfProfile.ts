import { useEffect, useMemo, useState } from 'react';
import { isDesktop, isMobile } from '@/utils/ua';

export type PerfTier = 'ultra'|'high'|'medium'|'low';

function getForcedTier(): PerfTier | null {
  if (typeof window==='undefined') return null;
  try {
    const q = new URLSearchParams(location.search).get('anim');
    if (q && ['ultra','high','medium','low'].includes(q)) {
      localStorage.setItem('anim:forceTier', q);
      return q as PerfTier;
    }
    const s = localStorage.getItem('anim:forceTier');
    if (s && ['ultra','high','medium','low'].includes(s)) return s as PerfTier;
  } catch {}
  return null;
}

function measureFps(durationMs=500): Promise<number> {
  return new Promise((resolve) => {
    let frames=0, start=performance.now();
    function loop(now:number){ frames++; if (now-start>=durationMs) resolve((frames*1000)/(now-start)); else requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  });
}

export function usePerfProfile(): PerfTier {
  const [tier, setTier] = useState<PerfTier>(() => {
    const forced = getForcedTier();
    if (forced) return forced;
    // По умолчанию: ДЕСКТОП — ultra, МОБИЛКА — high
    return isDesktop() ? 'ultra' : 'high';
  });

  useEffect(() => {
    const forced = getForcedTier();
    if (forced) { setTier(forced); return; }

    let cancelled=false;
    (async () => {
      try {
        // Быстрый прогон FPS. На десктопе почти всегда будет 60/120.
        const fps = await measureFps(600);
        let t: PerfTier = tier;
        if (isDesktop()) {
          // На ПК оставляем «ultra», понижаем только если совсем плохо.
          t = fps >= 40 ? 'ultra' : (fps >= 32 ? 'high' : 'medium');
        } else {
          // На мобилках плавно: новые айфоны/флагманы -> high, иначе medium/low.
          t = fps >= 55 ? 'high' : (fps >= 38 ? 'medium' : 'low');
        }
        if (!cancelled) setTier(t);
      } catch {}
    })();
    return () => { cancelled=true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tier;
}
