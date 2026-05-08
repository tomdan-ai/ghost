'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWalletStore } from '@/stores/wallet-store';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface WalletConnectProps {
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
  showBalance?: boolean;
}

export function WalletConnect({
  onConnect,
  onDisconnect,
  showBalance = true,
}: WalletConnectProps) {
  const { publicKey, connected, connecting } = useWallet();
  const { connection } = useConnection();
  const { setPublicKey, setConnected, setConnecting, setBalance, balance } =
    useWalletStore();

  // Sync wallet adapter state with zustand store
  useEffect(() => {
    setPublicKey(publicKey);
    setConnected(connected);
    setConnecting(connecting);

    if (connected && publicKey) {
      onConnect?.(publicKey.toString());
    } else if (!connected) {
      onDisconnect?.();
    }
  }, [
    publicKey,
    connected,
    connecting,
    setPublicKey,
    setConnected,
    setConnecting,
    onConnect,
    onDisconnect,
  ]);

  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      connection
        .getBalance(publicKey)
        .then((balance) => {
          setBalance(balance / LAMPORTS_PER_SOL);
        })
        .catch((error) => {
          console.error('Failed to fetch balance:', error);
          setBalance(null);
        });
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection, setBalance]);

  return (
    <div className="flex items-center gap-4">
      {connected && showBalance && balance !== null && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Balance</Badge>
              <span className="text-sm font-medium">
                {balance.toFixed(4)} SOL
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      <WalletMultiButton />
    </div>
  );
}
