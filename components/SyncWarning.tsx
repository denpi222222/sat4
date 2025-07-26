'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Box, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePublicClient } from 'wagmi';
import { GAME_CONTRACT_ADDRESS } from '@/config/wagmi';

interface SyncWarningProps {
  isVisible: boolean;
  onComplete: () => void;
  onDismiss?: () => void;
}

export const SyncWarning = ({ isVisible, onComplete, onDismiss }: SyncWarningProps) => {
  const { t } = useTranslation();
  const publicClient = usePublicClient();
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isChecking, setIsChecking] = useState(false);

  // Initialize time based on localStorage to persist across page reloads
  useEffect(() => {
    if (!isVisible) return;

    const syncStartTime = localStorage.getItem('syncStartTime');
    const now = Date.now();
    
    if (syncStartTime) {
      const elapsed = Math.floor((now - parseInt(syncStartTime)) / 1000);
      const remaining = Math.max(0, 180 - elapsed); // 3 minutes = 180 seconds
      setTimeLeft(remaining);
      
      // If time is already up, complete sync
      if (remaining <= 0) {
        onComplete();
        return;
      }
    } else {
      // First time showing, set start time
      localStorage.setItem('syncStartTime', now.toString());
    }
  }, [isVisible, onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete();
          localStorage.removeItem('syncStartTime'); // Clear start time
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onComplete]);

  // Fast multicall check every 30 seconds
  useEffect(() => {
    if (!isVisible || !publicClient) return;

    const checkInterval = setInterval(async () => {
      setIsChecking(true);
      try {
        // Get recent claimed NFTs from localStorage
        const claimedNFTs = JSON.parse(localStorage.getItem('claimedNFTs') || '{}');
        const claimedTokenIds = Object.keys(claimedNFTs);
        
        if (claimedTokenIds.length === 0) {
          // No recent claims, sync is complete
          onComplete();
          localStorage.removeItem('syncStartTime');
          return;
        }

        // Use multicall to check if NFTs are still claimable
        const contracts = claimedTokenIds.map(tokenId => ({
          address: GAME_CONTRACT_ADDRESS,
          abi: [
            {
              name: 'burnRecords',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ type: 'uint256', name: 'tokenId' }],
              outputs: [
                { type: 'address', name: 'owner' },
                { type: 'uint256', name: 'totalAmount' },
                { type: 'uint256', name: 'claimAvailableTime' },
                { type: 'uint256', name: 'graveyardReleaseTime' },
                { type: 'bool', name: 'claimed' },
                { type: 'uint8', name: 'waitPeriod' },
              ],
            },
          ] as const,
          functionName: 'burnRecords' as const,
          args: [BigInt(tokenId)] as const,
        }));

        try {
          const results = await publicClient.multicall({
            contracts,
            allowFailure: true,
          });

          // Check if any NFTs are still not claimed in blockchain
          const stillClaimable = results.some((result, index) => {
            if (result.status === 'success' && result.result) {
              const [, , , , claimed] = result.result as any;
              return !claimed; // If not claimed in blockchain, still claimable
            }
            return false;
          });

          if (!stillClaimable) {
            // All NFTs are claimed in blockchain, sync is complete
            onComplete();
            localStorage.removeItem('syncStartTime');
          }
        } catch (multicallError) {
          console.warn('Multicall check failed:', multicallError);
          
          // Fallback: check localStorage timing
          const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
          const hasRecentClaims = Object.values(claimedNFTs).some((timestamp: any) => 
            typeof timestamp === 'number' && timestamp > threeMinutesAgo
          );
          
          if (!hasRecentClaims) {
            onComplete();
            localStorage.removeItem('syncStartTime');
          }
        }
      } catch (error) {
        console.warn('Auto-check failed:', error);
      } finally {
        setIsChecking(false);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [isVisible, onComplete, publicClient]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 border-2 border-yellow-400 rounded-xl p-6 shadow-2xl backdrop-blur-sm max-w-md mx-4">
          <div className="flex items-center space-x-4">
            {/* Animated cube icon */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="relative flex-shrink-0"
            >
              <Box className="w-10 h-10 text-yellow-200" />
              <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-200" />
                  <h3 className="text-lg font-bold text-yellow-100">
                    {t('sync.title', 'Synchronization in Progress')}
                  </h3>
                </div>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-yellow-300 hover:text-yellow-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <p className="text-yellow-200 text-sm mb-3">
                {t('sync.description', 'Please wait while we sync with the blockchain contract...')}
                {isChecking && (
                  <span className="ml-2 text-yellow-300">
                    {t('sync.checking', 'Checking blockchain...')}
                  </span>
                )}
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-yellow-800/50 rounded-full h-3 mb-3">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-amber-400 h-3 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 180, ease: "linear" }} // 3 minutes
                />
              </div>
              
              {/* Timer */}
              <div className="flex items-center justify-between">
                <span className="text-yellow-200 text-sm font-medium">
                  {t('sync.timeRemaining', 'Time remaining')}: {formatTime(timeLeft)}
                </span>
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
              </div>
              
              {/* Navigation hint */}
              <div className="mt-2 text-yellow-200/80 text-xs">
                💡 {t('sync.navigationHint', 'You can navigate to other tabs while waiting')}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 