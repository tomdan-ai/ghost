import { create } from 'zustand';

interface WalletState {
  address: string | null;
  balance: string;
  connected: boolean;
  setAddress: (address: string) => void;
  setBalance: (balance: string) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  balance: '0',
  connected: false,

  setAddress: (address) => set({ address, connected: true }),
  
  setBalance: (balance) => set({ balance }),
  
  setConnected: (connected) => set({ connected }),
  
  disconnect: () => set({ address: null, balance: '0', connected: false }),
}));
