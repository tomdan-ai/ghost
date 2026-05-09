'use client';

import { QueryProvider } from './query-provider';
import { SolanaWalletProvider } from './wallet-provider';
import { WalletStateSync } from '@/components/WalletStateSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SolanaWalletProvider>
        <WalletStateSync />
        {children}
      </SolanaWalletProvider>
    </QueryProvider>
  );
}
