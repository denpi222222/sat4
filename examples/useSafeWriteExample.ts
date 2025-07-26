'use client';
import { useSafeWriteContract } from '@/hooks/useSafeWriteContract';
import { GUARD_CFG } from '@/config/security';

export function useWrite() {
  const { safeWrite } = useSafeWriteContract(GUARD_CFG);
  return { write: safeWrite };
}
