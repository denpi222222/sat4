'use client';
import React, { useEffect, useState } from 'react';
import { getActiveLocks, clearClaimLock } from '@/utils/claim-lock';

type Props = {
  chainId: number; contract: string; wallet: string;
  checkIsClaimed?: (tokenId:string)=>Promise<boolean>;
  intervalMs?: number;
};
export const ClaimStatusBar: React.FC<Props> = ({ chainId, contract, wallet, checkIsClaimed, intervalMs=20000 }) => {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(()=>{
    let t:any; const tick=async()=>{
      const map = getActiveLocks(chainId, contract, wallet);
      const keys = Object.keys(map);
      setIds(keys);
      if (checkIsClaimed && keys.length){
        for(const id of keys){
          try{ const ok = await checkIsClaimed(id); if (ok) clearClaimLock(chainId, contract, wallet, id); } catch {}
        }
      }
      t=setTimeout(tick, intervalMs);
    }; tick(); return ()=>clearTimeout(t);
  }, [chainId, contract, wallet, intervalMs, checkIsClaimed]);

  if (!ids.length) return null;
  return (
    <div style={{position:'fixed',left:12,right:12,bottom:12,zIndex:9999,background:'rgba(10,18,32,.9)',border:'1px solid rgba(0,240,255,.25)',borderRadius:12,boxShadow:'0 6px 30px rgba(0,180,255,.25)',color:'#cfefff',padding:'10px 12px',backdropFilter:'blur(8px)'}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>Processing claim…</div>
      <div style={{fontSize:13,opacity:.92}}>Tokens: <b>{ids.join(', ')}</b>. Auto‑hide when confirmed (check every {Math.round(intervalMs/1000)}s).</div>
    </div>
  );
};
