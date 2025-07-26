'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { analyzeTx, GuardConfig, TxMeta } from '@/guards/tx-guard';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SafeTxModal({
  open,
  onOpenChange,
  tx,
  cfg
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: TxMeta | null;
  cfg: GuardConfig;
}) {
  if (!tx) return null;
  const analysis = analyzeTx(tx, cfg);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction Check</DialogTitle>
          <DialogDescription className="space-y-2 text-sm">
            {analysis.ok ? (
              <Badge variant="default">OK</Badge>
            ) : (
              <Badge variant="destructive">Risky</Badge>
            )}
            <div className="text-xs text-muted-foreground">chainId: {String(tx.chainId ?? 'unknown')}</div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          {!analysis.ok && (
            <ul className="list-disc pl-5 text-sm text-red-400 space-y-1">
              {analysis.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {analysis.decoded && (
            <pre className="mt-4 rounded bg-card/40 p-3 text-xs overflow-auto">
              {JSON.stringify(analysis.decoded, null, 2)}
            </pre>
          )}
          <pre className="mt-4 rounded bg-card/40 p-3 text-xs overflow-auto">
            {JSON.stringify(tx, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
