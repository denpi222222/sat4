'use client';

import { useCallback } from 'react';
import { useChainId, useWriteContract } from 'wagmi';
import { analyzeTx, GuardConfig, TxMeta } from '@/guards/tx-guard';
import { toast } from 'sonner';

export function useSafeWriteContract(cfg: GuardConfig) {
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const safeWrite = useCallback(async (request: any) => {
    const meta: TxMeta = {
      to: request.address,
      data: request.data,
      value: request.value,
      chainId
    };
    const result = analyzeTx(meta, cfg);
    if (!result.ok) {
              toast.error('⚠️ Dangerous transaction', { description: result.risks.join(', ') });
      throw new Error('Blocked by TxGuard: ' + result.risks.join(', '));
    }
    return await writeContractAsync(request);
  }, [chainId, writeContractAsync, cfg]);

  return { safeWrite };
}
