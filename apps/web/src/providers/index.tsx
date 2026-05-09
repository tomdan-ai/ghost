'use client';

import { QueryProvider } from './query-provider';
import { SolanaWalletProvider } from './wallet-provider';
import { WalletStateSync } from '@/components/WalletStateSync';
import { WebSocketProvider } from '@/components/WebSocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SolanaWalletProvider>
        <WebSocketProvider>
          <WalletStateSync />
          {children}
        </WebSocketProvider>
      </SolanaWalletProvider>
    </QueryProvider>
  );
}
