'use client';

import { QueryProvider } from './query-provider';
import { SolanaWalletProvider } from './wallet-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </QueryProvider>
  );
}
