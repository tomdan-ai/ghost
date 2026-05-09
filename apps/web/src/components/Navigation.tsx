'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletStore } from '@/stores/wallet-store';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const { connected, disconnect: disconnectWallet } = useWallet();
  const { username } = useWalletStore();
  const pathname = usePathname();

  const handleLogout = () => {
    disconnectWallet();
  };

  return (
    <nav className="border-b border-border bg-surface-base sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-bold text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
            Ghost Server
          </Link>
          {connected && (
            <Link href="/dashboard" className={`text-sm hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)] ${pathname === '/dashboard' ? 'text-text-inverse font-medium' : 'text-text-secondary'}`}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!connected ? (
            <WalletMultiButton className="!bg-text-inverse !text-surface-base !rounded-xs !h-10 !px-6 !font-bold !text-sm hover:!opacity-90 transition-all border border-border" />
          ) : (
            <div className="flex items-center gap-4">
              {username && (
                <Link href={`/pay`} className="hidden sm:flex text-sm text-text-secondary hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)] font-bold">
                  @{username}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-text-secondary hover:text-red-500 transition-colors uppercase font-black"
              >
                <LogOut className="h-4 w-4" />
                EXIT
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
