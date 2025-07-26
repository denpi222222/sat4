'use client';

import type React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SimpleToastProvider } from '@/components/simple-toast';
import { BuildErrorDisplay } from '@/components/build-error-display';
import { SocialSidebar } from '@/components/social-sidebar';
import { setupGlobalErrorHandling } from '@/utils/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect, useState } from 'react';
// Import i18n
import '@/lib/i18n';
// Import Web3 provider
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { PerformanceProvider } from '@/hooks/use-performance-context';
import { useWalletEvents } from '@/hooks/use-wallet-events';
import { EthereumProviderSafe } from '@/components/ethereum-provider-safe';
import { GlobalLanguageSwitcher } from '@/components/global-language-switcher';
import { isMobileWebView, isTelegramWebView } from '@/utils/ua';
import { SyncWarning } from '@/components/SyncWarning';

// Create a client for React Query
const queryClient = new QueryClient();

// Inner component that uses wallet events - must be inside WagmiProvider
function WalletEventHandler({ children }: { children: React.ReactNode }) {
  useWalletEvents();
  return <>{children}</>;
}


// Initialize Web3Modal
function startWeb3Modal(){
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  if ((window as any).web3modal_initialized) return;
  
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'crazycube-project-id';
  const isEnabled = process.env.NEXT_PUBLIC_WEB3_MODAL_ENABLED !== 'false';

  if (isEnabled) {
    try {
      (window as any).web3modal_initialized = true;
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        enableAnalytics: false,
        enableOnramp: false,
        enableSwaps: true,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#0EA5E9',
          '--w3m-border-radius-master': '8px',
        },
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        ],
      });
    } catch (e) { 
      console.warn('web3modal init error', e);
      (window as any).web3modal_initialized = false; // Reset flag on error
    }
  }
}

// Patch console.error only once
let isConsoleErrorPatched = false;
function patchConsoleError() {
  if (isConsoleErrorPatched) return;
  isConsoleErrorPatched = true;
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    const isKnownWalletError =
      message.includes(
        "Cannot read properties of undefined (reading 'global')"
      ) ||
      message.includes(
        'provider - this is likely due to another Ethereum wallet extension'
      ) ||
      message.includes('Unchecked runtime.lastError') ||
      message.includes('Could not establish connection') ||
      message.includes('Connection interrupted') ||
      message.includes('WebSocket connection failed') ||
      message.includes('InternalRpcError: Request failed') ||
      message.includes('ContractFunctionExecutionError') ||
      message.includes('EstimateGasExecutionError') ||
      message.includes('UserRejectedRequestError') ||
      message.includes('RpcRequestError: Rate limit exceeded') ||

      message.includes('In HTML, <p> cannot be a descendant of <p>') ||
      message.includes('<p> cannot contain a nested <p>') ||
      message.includes('<div> cannot be a descendant of <p>') ||
      message.includes('<p> cannot contain a nested <div>') ||
      message.includes('Maximum update depth exceeded');
    if (isKnownWalletError) return;
    originalError.apply(console, args);
  };
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const [showSyncWarning, setShowSyncWarning] = useState(false);

  // Initialize on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    patchConsoleError();
    setupGlobalErrorHandling();

    // Initialize i18n
    const initI18n = async () => {
      try {
        const i18n = (await import('@/lib/i18n')).default;
        if (i18n && !i18n.isInitialized) {
          await i18n.init();
        }
      } catch (error) {
        console.warn('Failed to initialize i18n:', error);
      }
    };

    // Initialize Web3Modal immediately
    startWeb3Modal();
    
    // Delay other initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      initI18n();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check for recent claims globally
  useEffect(() => {
    const checkRecentClaims = () => {
      const claimedNFTs = JSON.parse(localStorage.getItem('claimedNFTs') || '{}');
      const threeMinutesAgo = Date.now() - 3 * 60 * 1000; // Changed to 3 minutes
      
      const hasRecentClaims = Object.values(claimedNFTs).some((timestamp: any) => 
        typeof timestamp === 'number' && timestamp > threeMinutesAgo
      );
      
      setShowSyncWarning(hasRecentClaims);
    };

    // Check immediately
    checkRecentClaims();

    // Check every 30 seconds
    const interval = setInterval(checkRecentClaims, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncComplete = () => {
    setShowSyncWarning(false);
    // Clear old claimed records
    const claimedNFTs = JSON.parse(localStorage.getItem('claimedNFTs') || '{}');
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000; // Changed to 3 minutes
    const cleanedClaimedNFTs: Record<string, number> = {};
    
    Object.entries(claimedNFTs).forEach(([tokenId, timestamp]) => {
      if (typeof timestamp === 'number' && timestamp > threeMinutesAgo) {
        cleanedClaimedNFTs[tokenId] = timestamp;
      }
    });
    
    localStorage.setItem('claimedNFTs', JSON.stringify(cleanedClaimedNFTs));
    localStorage.removeItem('syncStartTime'); // Clear sync start time
  };

  const handleDismissSync = () => {
    setShowSyncWarning(false);
  };

  return (
    <>
      {!mounted ? null : (
        <ThemeProvider attribute='class' defaultTheme='dark'>
          <WagmiProvider config={config} reconnectOnMount={false}>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                {/* Global Sync Warning */}
                <SyncWarning 
                  isVisible={showSyncWarning} 
                  onComplete={handleSyncComplete}
                  onDismiss={handleDismissSync}
                />
                <PerformanceProvider>
                  <EthereumProviderSafe>
                    <WalletEventHandler>
                      <SimpleToastProvider>
                        <div className='relative flex min-h-screen flex-col'>
                          <GlobalLanguageSwitcher />
                          {children}
                          <BuildErrorDisplay />
                          <SocialSidebar />
                        </div>
                      </SimpleToastProvider>
                    </WalletEventHandler>
                  </EthereumProviderSafe>
                </PerformanceProvider>
              </ErrorBoundary>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      )}
    </>
  );
}
