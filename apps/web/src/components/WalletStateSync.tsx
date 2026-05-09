'use client';

import { useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/stores/wallet-store';
import { apiClient } from '@/lib/api-client';
import bs58 from 'bs58';

export function WalletStateSync() {
  const { publicKey, connected, signMessage } = useWallet();
  const { connection } = useConnection();
  const { 
    setPublicKey, 
    setConnected, 
    setBalance, 
    setUsername, 
    setHasRegistered,
    disconnect: disconnectStore 
  } = useWalletStore();

  const syncBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / 1e9);
    } catch (error) {
      console.error('Failed to sync balance:', error);
    }
  }, [publicKey, connection, setBalance]);

  const syncBackend = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    try {
      const walletAddr = publicKey.toBase58();
      
      // 1. Get nonce
      const { nonce } = await apiClient.getNonce(walletAddr);
      
      // 2. Sign message
      const message = new TextEncoder().encode(nonce);
      const signature = await signMessage(message);
      const signatureBase58 = bs58.encode(signature);
      
      // 3. Verify and get token
      const { token, user } = await apiClient.verifySignature(
        walletAddr,
        signatureBase58,
        nonce
      );
      
      // 4. Set auth token in client
      apiClient.setAuthToken(token);
      
      // 5. Update store
      setUsername(user.username || null);
      setHasRegistered(!!user.username && !user.username.startsWith('user_'));
      
    } catch (error) {
      console.error('Backend sync failed:', error);
      // Even if backend sync fails, we might still want to show wallet balance
    }
  }, [publicKey, signMessage, setUsername, setHasRegistered]);

  useEffect(() => {
    if (connected && publicKey) {
      setPublicKey(publicKey);
      setConnected(true);
      syncBalance();
      syncBackend();

      // Poll balance every 30s
      const interval = setInterval(syncBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setPublicKey(null);
      setConnected(false);
      disconnectStore();
      apiClient.setAuthToken(null);
    }
  }, [connected, publicKey, setPublicKey, setConnected, disconnectStore, syncBalance, syncBackend]);

  return null;
}
