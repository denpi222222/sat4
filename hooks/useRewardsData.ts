'use client';

import { useState, useEffect } from 'react';
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { useUserNFTs } from '@/hooks/useUserNFTs';

export interface RewardInfo {
  tokenId: number;
  lockedAmount: string; // CRAA string
  canClaim: boolean;
  timeLeft: number; // secs
}

export function useRewardsData() {
  const { nfts, loading } = useUserNFTs();
  const { getBurnRecord, claimBurnRewards } = useCrazyCubeGame();
  const [rewards, setRewards] = useState<RewardInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRewards = async () => {
    if (loading || nfts.length === 0) return;
    setIsLoading(true);
    try {
      const data: RewardInfo[] = [];
      await Promise.all(
        nfts.map(async (nft: any) => {
          const rec = await getBurnRecord(String(nft.tokenId));
          if (rec) {
            data.push({
              tokenId: nft.tokenId,
              lockedAmount: rec.lockedAmount,
              canClaim: rec.canClaim,
              timeLeft: rec.timeLeft,
            });
          }
        })
      );
      setRewards(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    const id = setInterval(fetchRewards, 60000);
    return () => clearInterval(id);
  }, [loading, nfts]);

  const totalClaimable = rewards
    .filter(r => r.canClaim)
    .reduce((acc, r) => acc + parseFloat(r.lockedAmount), 0);

  const claimOne = async (tokenId: number) => {
    await claimBurnRewards(String(tokenId));
  };

  const claimAll = async () => {
    for (const r of rewards.filter(x => x.canClaim)) {
      await claimOne(r.tokenId);
    }
  };

  return { rewards, isLoading, totalClaimable, claimOne, claimAll };
}
