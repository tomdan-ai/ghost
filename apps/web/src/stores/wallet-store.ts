import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicKey } from '@solana/web3.js';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  balance: number | null;
}

interface WalletActions {
  setPublicKey: (publicKey: PublicKey | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setBalance: (balance: number | null) => void;
  disconnect: () => void;
}

export type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      // State
      publicKey: null,
      connected: false,
      connecting: false,
      balance: null,

      // Actions
      setPublicKey: (publicKey) => set({ publicKey }),
      setConnected: (connected) => set({ connected }),
      setConnecting: (connecting) => set({ connecting }),
      setBalance: (balance) => set({ balance }),
      disconnect: () =>
        set({
          publicKey: null,
          connected: false,
          connecting: false,
          balance: null,
        }),
    }),
    {
      name: 'ghost-wallet-storage',
      partialize: (state) => ({
        // Only persist publicKey, not connection state
        publicKey: state.publicKey ? state.publicKey.toString() : null,
      }),
    }
  )
);
