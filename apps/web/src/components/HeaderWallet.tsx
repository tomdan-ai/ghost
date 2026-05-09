'use client';

import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function HeaderWallet() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const base58 = publicKey?.toBase58();
  const truncated = base58 ? `${base58.slice(0, 4)}...${base58.slice(-5)}` : '';

  if (connected && publicKey) {
    return (
      <button 
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-text-tertiary text-text-tertiary transition-all active:scale-95 group hover:bg-text-tertiary hover:text-surface-base"
        title="Click to Disconnect"
      >
        <span className="text-[10px] font-black tracking-widest uppercase">{truncated}</span>
        <LogOut className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <button 
      onClick={() => setVisible(true)}
      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse/20 text-text-inverse/40 hover:border-text-inverse hover:text-text-inverse transition-all active:scale-95"
      title="Connect Wallet"
    >
      <Wallet className="w-5 h-5" />
    </button>
  );
}
