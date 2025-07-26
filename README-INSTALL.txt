Вкратце, что делать:
1) Добавить в app/globals.css:
   @import '@/styles/patch-globals.css';

2) Обернуть приложение:
   import PageFade from '@/components/PageFade';
   import { AnimationProvider } from '@/context/AnimationConfig';
   // ...
   <AnimationProvider>
     <PageFade>{children}</PageFade>
     {/* глобальная плашка */}
     {/* <ClaimStatusBar chainId={apeChain.id} contract={GAME_CONTRACT_ADDRESS} wallet={address||'0x0'} checkIsClaimed={...}/> */}
   </AnimationProvider>

3) В public/index/head (app/layout.tsx) подключить:
   <script src="/js/boot-desktop-trusted-types.js" defer></script>
   (Tinyfill уже можно оставить как у тебя, он не ломает CSP)

4) При клике Claim:
   import { setClaimLock } from '@/utils/claim-lock';
   const tx = await claimBurnRewards(tokenId);
   setClaimLock(apeChain.id, GAME_CONTRACT_ADDRESS, address!, String(tokenId), tx?.hash, 5);

5) Сила анимаций:
   - Десктоп — по умолчанию ULTRA.
   - Мобилки — HIGH/ MEDIUM/ LOW по FPS‑замеру (~0.6с).
   - Ручной оверрайд: ?anim=ultra | localStorage.setItem('anim:forceTier','ultra')
