export interface ClaimLock { until: number; txHash?: string; }
const K = (chainId:number, contract:string, wallet:string)=>`claimLocks:v1:${chainId}:${contract}:${wallet}`.toLowerCase();
export const setClaimLock = (c:number, a:string, w:string, t:string, h?:string, m=5) => {
  if (typeof window==='undefined') return;
  const k = K(c,a,w); const mp:Record<string,ClaimLock> = JSON.parse(localStorage.getItem(k)||'{}');
  const lock: ClaimLock = { until: Date.now() + m * 60_000 };
  if (h) lock.txHash = h;
  mp[String(t)] = lock;
  localStorage.setItem(k, JSON.stringify(mp));
};
export const getActiveLocks = (c:number,a:string,w:string) => {
  if (typeof window==='undefined') return {};
  const k = K(c,a,w); let mp:Record<string,ClaimLock> = JSON.parse(localStorage.getItem(k)||'{}');
  if (!mp || typeof mp !== 'object') mp = {};
  const now=Date.now(); for(const id in mp){ if(mp[id] && mp[id].until<now) delete mp[id]; } localStorage.setItem(k, JSON.stringify(mp)); return mp;
};
export const clearClaimLock = (c:number,a:string,w:string,t:string)=>{
  if (typeof window==='undefined') return; const k=K(c,a,w); let mp:Record<string,ClaimLock> = JSON.parse(localStorage.getItem(k)||'{}');
  if (!mp || typeof mp !== 'object') mp = {};
  delete mp[String(t)]; localStorage.setItem(k, JSON.stringify(mp));
};
