'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Smartphone } from 'lucide-react';

interface MobileFallbackProps {
  error?: string | undefined;
  onRetry?: () => void;
}

export function MobileFallback({ error, onRetry }: MobileFallbackProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-orange-500/30 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-orange-400" />
          </div>
          <CardTitle className="text-orange-100">
            Mobile Loading Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm text-center">
            {error || "The app is having trouble loading on your device. This might be due to browser compatibility or network issues."}
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={onRetry || (() => window.location.reload())}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
            >
              Refresh Page
            </Button>
          </div>
          
          <div className="text-xs text-slate-400 text-center space-y-1">
            <p>If the problem persists:</p>
            <p>• Try a different browser</p>
            <p>• Check your internet connection</p>
            <p>• Clear browser cache</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 