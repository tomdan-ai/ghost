import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicKey } from '@solana/web3.js';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  balance: number | null;
  username: string | null;
  hasRegistered: boolean;
  token: string | null;
  user: any | null;
}

interface WalletActions {
  setPublicKey: (publicKey: PublicKey | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setBalance: (balance: number | null) => void;
  setUsername: (username: string | null) => void;
  setHasRegistered: (hasRegistered: boolean) => void;
  syncBalance: () => Promise<void>;
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
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
      username: null,
      hasRegistered: false,
      token: null,
      user: null,

      // Actions
      setPublicKey: (publicKey) => set({ publicKey }),
      setConnected: (connected) => set({ connected }),
      setConnecting: (connecting) => set({ connecting }),
      setBalance: (balance) => set({ balance }),
      setUsername: (username) => set({ username }),
      setHasRegistered: (hasRegistered) => set({ hasRegistered }),
      syncBalance: async () => {
        // Triggered by components to refresh balance
        // Actual logic is in WalletStateSync effect
      },
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      disconnect: () =>
        set({
          publicKey: null,
          connected: false,
          connecting: false,
          balance: null,
          username: null,
          hasRegistered: false,
          token: null,
          user: null,
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
