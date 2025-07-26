import { useEffect, useState } from 'react';
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Abi, parseAbi, decodeEventLog, formatEther, Address } from 'viem';
import { GAME_CONTRACT_ADDRESS } from '../config/wagmi';
import { toast } from 'sonner';

// CONFIGURATION AND CORRECT ABI
// Proxy contract address of the game from central wagmi.ts configuration
// (config/wagmi.ts → GAME_CONTRACT_ADDRESS)

// Use parseAbi from viem for better safety and auto-typing
const GameContractABI = parseAbi([
  'event NFTBurned(address indexed player, uint256 indexed tokenId, uint256 amountToClaim, uint256 waitHours)',
  'function burnRecords(uint256 tokenId) view returns (address owner, uint256 totalAmount, uint256 claimAvailableTime, uint256 graveyardReleaseTime, bool claimed, uint8 waitPeriod)',
  'function burnSplits(uint8 waitPeriod) view returns (uint16 playerBps, uint16 poolBps, uint16 burnBps)',
  'function claimBurnRewards(uint256 tokenId)',
  'function nftContract() view returns (address)',
  'function totalBurned() view returns (uint256)',
  'function graveyardTokens(uint256 index) view returns (uint256)',
]);

// Typing for data we'll store in state
export interface BurnedNftInfo {
  tokenId: string;
  record: {
    owner: Address;
    totalAmount: bigint;
    claimAvailableTime: bigint;
    graveyardReleaseTime: bigint;
    claimed: boolean;
    waitPeriod: number;
  };
  split: {
    playerBps: number;
    poolBps: number;
    burnBps: number;
  } | null;
  playerShare: bigint;
  isReadyToClaim: boolean;
}

/**
 * Hook for getting user's burned NFTs list and their data.
 * Optimized to be as fast as useGraveyardTokens.
 */
export const useBurnedNfts = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [burnedNfts, setBurnedNfts] = useState<BurnedNftInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setIsLoading(false);
      setBurnedNfts([]);
      return;
    }

    // Check for cached data
    const cacheKey = `burnedNfts-${address}`;
    const cachedData = localStorage.getItem(cacheKey);

    const abortController = new AbortController();

    const fetchBurnedNfts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if it's less than 1 minute old (faster refresh)
          if (Date.now() - timestamp < 1 * 60 * 1000) {
            // Convert strings back to BigInt
            const deserializedData = data.map((nft: any) => ({
              ...nft,
              record: {
                ...nft.record,
                totalAmount: BigInt(nft.record.totalAmount),
                claimAvailableTime: BigInt(nft.record.claimAvailableTime),
                graveyardReleaseTime: BigInt(nft.record.graveyardReleaseTime),
              },
              playerShare: BigInt(nft.playerShare),
            }));
            setBurnedNfts(deserializedData);
            setIsLoading(false);
            return;
          }
        }

        // Get current chain timestamp
        let chainNow = Math.floor(Date.now() / 1000);
        try {
          const latestBlock = await publicClient.getBlock();
          chainNow = Number(latestBlock.timestamp);
        } catch (_e) {
          /* ignore – fallback to local time */
        }

        // ------------------------------------------------------------
        // FAST PATH — Get all burned NFTs from graveyard first
        // ------------------------------------------------------------
        const graveyardSize = await publicClient.readContract({
          address: GAME_CONTRACT_ADDRESS,
          abi: GameContractABI,
          functionName: 'totalBurned',
        });

        let allTokenIds: string[] = [];
        const maxTokens = Math.min(Number(graveyardSize), 200); // limit for performance

        if (maxTokens > 0) {
          // Use multicall if available for fast batch requests
          const supportsMulticall = !!publicClient.chain?.contracts?.multicall3?.address;

          if (supportsMulticall) {
            // Fast multicall approach
            const contracts = Array.from({ length: maxTokens }, (_, i) => ({
              address: GAME_CONTRACT_ADDRESS,
              abi: GameContractABI,
              functionName: 'graveyardTokens' as const,
              args: [BigInt(i)] as const,
            }));

            try {
              const mcRaw = await publicClient.multicall({
                contracts,
                allowFailure: true,
              });

              const mcResults: any[] = Array.isArray(mcRaw) ? mcRaw : (mcRaw as any)?.results ?? [];

              allTokenIds = mcResults
                .filter(r => r.status === 'success' && r.result && r.result > 0n)
                .map(r => (r.result as bigint).toString());
            } catch (mcErr) {
              console.warn('Multicall failed, falling back to individual calls');
            }
          }

          // Fallback to individual calls if multicall failed
          if (allTokenIds.length === 0) {
            const CHUNK = 10;
            for (let i = 0; i < maxTokens; i += CHUNK) {
              const slice = Array.from(
                { length: Math.min(CHUNK, maxTokens - i) },
                (_, k) => i + k
              );
              const chunkResults = await Promise.all(
                slice.map(idx =>
                  publicClient.readContract({
                    address: GAME_CONTRACT_ADDRESS,
                    abi: GameContractABI,
                    functionName: 'graveyardTokens',
                    args: [BigInt(idx)],
                  }).catch(() => 0n)
                )
              );
              chunkResults.forEach(res => {
                if (res > 0n) allTokenIds.push(res.toString());
              });
            }
          }
        }

        // ------------------------------------------------------------
        // Filter NFTs that belong to current user
        // ------------------------------------------------------------
        const userTokenIds: string[] = [];
        const userTokenRecords: any[] = [];

        if (allTokenIds.length > 0) {
          // Get burn records for all tokens in parallel
          const recordContracts = allTokenIds.map(tokenId => ({
            address: GAME_CONTRACT_ADDRESS,
            abi: GameContractABI,
            functionName: 'burnRecords' as const,
            args: [BigInt(tokenId)] as const,
          }));

          try {
            const recordResults = await publicClient.multicall({
              contracts: recordContracts,
              allowFailure: true,
            });

            recordResults.forEach((result, index) => {
              if (result.status === 'success' && result.result) {
                const [owner, totalAmount, claimAvailableTime, graveyardReleaseTime, claimed, waitPeriod] = result.result as any;
                                 if (owner.toLowerCase() === address.toLowerCase() && allTokenIds[index]) {
                   userTokenIds.push(allTokenIds[index]!);
                  userTokenRecords.push({
                    owner,
                    totalAmount,
                    claimAvailableTime,
                    graveyardReleaseTime,
                    claimed,
                    waitPeriod,
                  });
                }
              }
            });
          } catch (err) {
            // Fallback to individual calls
            for (let i = 0; i < allTokenIds.length; i += 10) {
              const slice = allTokenIds.slice(i, i + 10);
              const chunkResults = await Promise.all(
                slice.map(async tokenId => {
                  try {
                    const record = await publicClient.readContract({
                      address: GAME_CONTRACT_ADDRESS,
                      abi: GameContractABI,
                      functionName: 'burnRecords',
                      args: [BigInt(tokenId)],
                    });
                    return { tokenId, record };
                  } catch {
                    return null;
                  }
                })
              );

              chunkResults.forEach(result => {
                                 if (result && result.record && result.tokenId) {
                   const [owner, totalAmount, claimAvailableTime, graveyardReleaseTime, claimed, waitPeriod] = result.record as any;
                   if (owner.toLowerCase() === address.toLowerCase()) {
                     userTokenIds.push(result.tokenId);
                    userTokenRecords.push({
                      owner,
                      totalAmount,
                      claimAvailableTime,
                      graveyardReleaseTime,
                      claimed,
                      waitPeriod,
                    });
                  }
                }
              });
            }
          }
        }

        // ------------------------------------------------------------
        // Get split parameters and calculate player shares
        // ------------------------------------------------------------
        const nftsInfo: BurnedNftInfo[] = [];
        const splitCache = new Map<number, { playerBps: number; poolBps: number; burnBps: number }>();

        for (let i = 0; i < userTokenIds.length; i++) {
          const tokenId = userTokenIds[i];
          const record = userTokenRecords[i];
          
          if (!tokenId || !record) continue;

          // Get split either from cache or from contract
          let split = splitCache.get(Number(record.waitPeriod));
          if (!split) {
            try {
              const splitResult = await publicClient.readContract({
                address: GAME_CONTRACT_ADDRESS,
                abi: GameContractABI,
                functionName: 'burnSplits',
                args: [record.waitPeriod],
              }) as [number, number, number];

              const [playerBps, poolBps, burnBps] = splitResult;
              split = { playerBps, poolBps, burnBps };
              splitCache.set(Number(record.waitPeriod), split);
            } catch (err) {
              split = { playerBps: 0, poolBps: 0, burnBps: 0 };
            }
          }

          const playerShare = (record.totalAmount * BigInt(split.playerBps)) / 10000n;

          const info: BurnedNftInfo = {
            tokenId,
            record,
            split,
            playerShare,
            isReadyToClaim: !record.claimed && record.claimAvailableTime <= BigInt(chainNow),
          };
          nftsInfo.push(info);
        }

        // Sort by claim readiness
        nftsInfo.sort((a, b) => (b.isReadyToClaim ? 1 : 0) - (a.isReadyToClaim ? 1 : 0));

        // Filter out NFTs that were claimed within the last 3 minutes
        const claimedNFTs = JSON.parse(localStorage.getItem('claimedNFTs') || '{}');
        const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
        
        // Clean up old claimed records (older than 3 minutes) - but keep recent ones
        const cleanedClaimedNFTs: Record<string, number> = {};
        Object.entries(claimedNFTs).forEach(([tokenId, timestamp]) => {
          if (typeof timestamp === 'number' && timestamp > threeMinutesAgo) {
            cleanedClaimedNFTs[tokenId] = timestamp;
          }
        });
        localStorage.setItem('claimedNFTs', JSON.stringify(cleanedClaimedNFTs));
        
        const filteredNftsInfo = nftsInfo.filter(nft => {
          const claimedTime = cleanedClaimedNFTs[nft.tokenId];
          // Show NFT if:
          // 1. It's not claimed in blockchain AND not claimed recently in localStorage (within 3 minutes)
          // 2. OR it was claimed recently (within 3 minutes) AND blockchain confirms it
          return (!nft.record.claimed && (!claimedTime || claimedTime < threeMinutesAgo)) ||
                 (claimedTime && claimedTime >= threeMinutesAgo && nft.record.claimed);
        });

        setBurnedNfts(filteredNftsInfo);

        // Cache the new data with a timestamp
        // Convert BigInt to strings for JSON serialization
        const serializableData = filteredNftsInfo.map(nft => ({
          ...nft,
          record: {
            ...nft.record,
            totalAmount: nft.record.totalAmount.toString(),
            claimAvailableTime: nft.record.claimAvailableTime.toString(),
            graveyardReleaseTime: nft.record.graveyardReleaseTime.toString(),
          },
          playerShare: nft.playerShare.toString(),
        }));

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: serializableData,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        setError('Failed to load burn history. Please refresh the page.');
        toast.error('Failed to load burn history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBurnedNfts();
    return () => abortController.abort();
  }, [address, isConnected, publicClient]);

  return { burnedNfts, isLoading, error };
};

/**
 * Hook for calling claimBurnRewards function
 */
export const useClaimReward = (tokenId: string) => {
  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error,
  } = useWriteContract();

  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2, // Wait for 2 confirmations for reliability
  });

  const claim = async () => {
    try {
      toast.loading('Sending transaction...', { id: `claim-${tokenId}` });
      await writeContractAsync({
        address: GAME_CONTRACT_ADDRESS,
        abi: GameContractABI,
        functionName: 'claimBurnRewards',
        args: [BigInt(tokenId)],
      });
    } catch (e: any) {
      toast.error(e.message || 'Transaction failed', {
        id: `claim-${tokenId}`,
      });
    }
  };

  // Update toasts based on transaction status
  useEffect(() => {
    if (isTxLoading) {
      toast.loading('Transaction in progress...', { id: `claim-${tokenId}` });
    }
    if (isTxSuccess) {
      toast.success('Reward claimed successfully!', {
        id: `claim-${tokenId}`,
        duration: 5000,
      });
    }
    if (txError) {
      toast.error(txError.message || 'Transaction error', {
        id: `claim-${tokenId}`,
      });
    }
  }, [isTxLoading, isTxSuccess, txError, tokenId]);

  return {
    claim,
    isClaiming: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error: error || txError,
    txHash,
  };
};
