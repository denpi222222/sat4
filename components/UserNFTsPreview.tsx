'use client';

import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import { getTokenIdAsDecimal } from '@/hooks/useUserNFTs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import {
  useReadContract,
  useAccount,
  useConnect,
  usePublicClient,
} from 'wagmi';
import { formatEther } from 'viem';
import type { NFT as NFTType } from '@/types/nft';
import { getRarityColor, getRarityLabel } from '@/lib/rarity';
import { useNFTContractInfo } from '@/hooks/useNFTContractInfo';
import { Loader2, Star, Zap, Clock, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { apeChain } from '@/config/chains';

// Import address from config instead of hardcoding
const GAME_CONTRACT_ADDRESS = apeChain.contracts.gameProxy.address;

const GAME_ABI_MINIMAL = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'nftState',
    outputs: [
      { internalType: 'uint8', name: 'currentStars', type: 'uint8' },
      { internalType: 'uint256', name: 'lockedCRAA', type: 'uint256' },
      { internalType: 'uint256', name: 'lastPingTime', type: 'uint256' },
      { internalType: 'uint256', name: 'lastBreedTime', type: 'uint256' },
      { internalType: 'bool', name: 'isInGraveyard', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'nftData',
    outputs: [
      { internalType: 'uint8', name: 'rarity', type: 'uint8' },
      { internalType: 'uint8', name: 'initialStars', type: 'uint8' },
      { internalType: 'bool', name: 'isActivated', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pingInterval',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'breedCooldown',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper to show duration in human friendly form
const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

// Convert ipfs://... to https gateway
const resolveImageSrc = (url?: string) => {
  if (!url) return '/favicon.ico';
  if (url.startsWith('ipfs://')) {
    const path = url.slice(7);
    return `https://nftstorage.link/ipfs/${path}`;
  }
  if (url.startsWith('https://')) {
    return url;
  }
  return '/favicon.ico';
};

export function UserNFTsPreview() {
  const { t } = useTranslation();
  const { isConnected: connected, address: account } = useAccount();
  const { connect, connectors } = useConnect();
  const { nfts: userNFTs, isLoading, error } = useAlchemyNfts();

  // Determine how many NFTs to show based on screen width (5 on mobile, 6 on md, 7 on lg+)
  const [displayCount, setDisplayCount] = useState(6);

  // Read global pingInterval & breedCooldown once (hooks must be unconditional)
  const { data: pingIntervalData } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_ABI_MINIMAL,
    functionName: 'pingInterval',
    query: { enabled: true },
  });

  const { data: breedCooldownData } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_ABI_MINIMAL,
    functionName: 'breedCooldown',
    query: { enabled: true },
  });

  const pingInterval = pingIntervalData ? Number(pingIntervalData) : null;
  const breedCooldown = breedCooldownData ? Number(breedCooldownData) : null;

  useEffect(() => {
    const calculateCount = () => {
      if (typeof window === 'undefined') return 6;

      const w = window.innerWidth;
      if (w < 640) {
        return 5;
      } else if (w < 1024) {
        return 8;
      }
      return 10;
    };

    // Initial calculation
    setDisplayCount(calculateCount());

    // Re-calculate on resize
    const handleResize = () => setDisplayCount(calculateCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!connected) {
    return (
      <Card className='w-full bg-slate-900/50 border-cyan-500/30'>
        <CardHeader>
          <CardTitle className='text-cyan-300'>Your NFTs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center gap-4 py-6'>
            <div className='text-center text-slate-400'>
              {t(
                'userNFTs.connectToView',
                'Connect your wallet to view your CRAAzyCube NFTs'
              )}
            </div>
            {connectors.length > 0 && (
              <Button
                onClick={() => connect({ connector: connectors[0]! })}
                className='bg-cyan-600 hover:bg-cyan-700 text-white'
              >
                {t('wallet.connect', 'Connect Wallet')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className='w-full bg-slate-900/50 border-cyan-500/30'>
        <CardHeader>
          <CardTitle className='text-cyan-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-24 w-full rounded-lg bg-slate-800' />
                <Skeleton className='h-4 w-full bg-slate-800' />
                <Skeleton className='h-3 w-2/3 bg-slate-800' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  } // Error handling removed since we're using demo data

  if (error) {
    return (
      <Card className='w-full bg-slate-900/50 border-red-500/30'>
        <CardHeader>
          <CardTitle className='text-red-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-red-400'>
            {t('userNFTs.errorLoading', 'Error loading NFTs')}: {error.message}
            <br />
            <Button
              onClick={() => window.location.reload()}
              className='mt-2 bg-red-600 hover:bg-red-700'
            >
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userNFTs.length === 0) {
    return (
      <Card className='w-full bg-slate-900/50 border-orange-500/30'>
        <CardHeader>
          <CardTitle className='text-orange-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-orange-400'>
            You do not own any CrazyCube NFTs yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayNfts = userNFTs.slice(0, displayCount); // Show responsive number of NFTs

  return (
    <Card className='w-full bg-slate-900/50 border-cyan-500/30'>
      <CardHeader>
        {' '}
        <CardTitle className='flex items-center justify-between text-cyan-300'>
          <span>
            {t('userNFTs.yourCRAAzyCubeNFTs', 'Your CRAAzyCube NFTs')}
          </span>
          <Badge className='bg-cyan-500/20 text-cyan-300'>
            {userNFTs.length} {t('common.total', 'total')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {' '}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 justify-center'>
          {displayNfts.map((nft, idx) => {
            const keyVal = getTokenIdAsDecimal(nft) || `idx-${idx}`;
            return (
              <NFTCard
                key={keyVal}
                nft={nft}
                pingInterval={pingInterval}
                breedCooldown={breedCooldown}
              />
            );
          })}
        </div>
        {userNFTs.length > displayCount && (
          <div className='mt-4 text-center'>
            <div className='text-sm text-slate-400'>
              {t('userNFTs.showing', 'Showing {{count}} of {{total}} NFTs', {
                count: displayNfts.length,
                total: userNFTs.length,
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NFTCardProps {
  nft: NFTType;
  pingInterval: number | null;
  breedCooldown: number | null;
}

function NFTCard({ nft, pingInterval, breedCooldown }: NFTCardProps) {
  const { t } = useTranslation();
  const nowSec = Math.floor(Date.now() / 1000);

  // Use centralised hook (same as Burn section) to always fetch initialStars/rarity
  const { nftInfo, isLoading: stateLoading } = useNFTContractInfo(
    getTokenIdAsDecimal(nft)
  );

  const initialStars = nftInfo ? nftInfo.static.initialStars : (nft.stars ?? 0);
  const currentStars = nftInfo
    ? nftInfo.dynamic.currentStars
    : (nft.stars ?? 0);
  const lockedCRAA = nftInfo
    ? (() => {
        try {
          const CRAAaWei = nftInfo.dynamic.lockedCRAA;
          const CRAAaEther = Number(formatEther(CRAAaWei));
          if (!isFinite(CRAAaEther) || CRAAaEther > 1e12) {
            return 0;
          }
          return CRAAaEther;
        } catch (error) {
          return 0;
        }
      })()
    : 0;
  const lastPing = nftInfo ? Number(nftInfo.dynamic.lastPingTime) : 0;
  const lastBreed = nftInfo ? Number(nftInfo.dynamic.lastBreedTime) : 0;

  const rarityLabel = getRarityLabel(initialStars);
  const rarityColorClass = getRarityColor(initialStars);

  const pingReady =
    pingInterval != null ? nowSec > lastPing + pingInterval : false;
  const breedReady =
    breedCooldown != null ? nowSec > lastBreed + breedCooldown : false;
  const burnable =
    lockedCRAA > 0 && !(nftInfo ? nftInfo.dynamic.isInGraveyard : false);

  return (
    <div className='relative rounded-lg border border-slate-700 bg-slate-800/50 p-2 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 scale-[0.75]'>
      {/* NFT Image */}
      <div className='relative mb-1.5'>
        <img
          src={resolveImageSrc(nft.image)}
          alt={nft.name || `NFT #${nft.tokenId}`}
          className='w-full h-16 object-cover rounded-md'
          onError={e => {
            e.currentTarget.src = '/favicon.ico';
          }}
        />
        {/* Rarity Badge */}
        {(() => {
          return (
            <div className='absolute top-0.5 right-0.5'>
              <Badge
                className={`${rarityColorClass} text-white text-xs px-1 py-0`}
              >
                {rarityLabel}
              </Badge>
            </div>
          );
        })()}
      </div>

      {/* NFT Info */}
      <div className='space-y-0.5 text-xs'>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>ID:</span>
          <span className='text-cyan-300 font-mono'>#{nft.tokenId}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Stars:</span>
          {stateLoading ? (
            <Skeleton className='h-3 w-12 bg-slate-700' />
          ) : (
            <span className='text-yellow-400 font-mono'>
              {'⭐'.repeat(Math.max(1, currentStars))}
            </span>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Rarity:</span>
          <span
            className={`${rarityColorClass} bg-opacity-30 px-1 rounded text-white text-xs`}
          >
            {rarityLabel}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>CRAA:</span>
          {stateLoading ? (
            <Skeleton className='h-3 w-12 bg-slate-700' />
          ) : (
            <span className='text-green-400'>
              {lockedCRAA >= 1e12
                ? `${(lockedCRAA / 1e12).toFixed(2)}T`
                : lockedCRAA >= 1e9
                  ? `${(lockedCRAA / 1e9).toFixed(2)}B`
                  : lockedCRAA >= 1e6
                    ? `${(lockedCRAA / 1e6).toFixed(2)}M`
                    : lockedCRAA >= 1e3
                      ? `${(lockedCRAA / 1e3).toFixed(2)}K`
                      : lockedCRAA.toFixed(2)}
            </span>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Ping:</span>
          <span className={pingReady ? 'text-green-400' : 'text-orange-400'}>
            {pingReady
              ? t('status.ready', 'Ready')
              : `⏳ ${pingInterval ? formatDuration(lastPing + pingInterval - nowSec) : ''}`}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Breed:</span>
          <span className={breedReady ? 'text-green-400' : 'text-orange-400'}>
            {breedReady
              ? t('status.ready', 'Ready')
              : `⏳ ${breedCooldown ? formatDuration(lastBreed + breedCooldown - nowSec) : ''}`}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>
            {t('nft.burnable', 'Burnable')}:
          </span>
          <span className={burnable ? 'text-red-400' : 'text-slate-500'}>
            {burnable ? `🔥 ${t('status.burnable', 'Burnable')}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
