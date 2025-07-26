'use client';

import { useCallback } from 'react';
import { useSignTypedData } from 'wagmi';
import { toast } from 'sonner';

export function useSafeSignTypedData(allowedDomains: string[]) {
  const { signTypedDataAsync } = useSignTypedData();

  const safeSign = useCallback(async (params: any) => {
    const host = window.location.hostname;
    if (!allowedDomains.includes(host)) {
      toast.error('Domain mismatch', { description: `host=${host}` });
      throw new Error('Domain mismatch');
    }
    if (!params.domain?.name || !params.domain?.chainId) {
      toast.error('Unsafe EIP-712: missing domain');
      throw new Error('Unsafe EIP-712');
    }
    return await signTypedDataAsync(params);
  }, [signTypedDataAsync, allowedDomains]);

  return { safeSign };
}
