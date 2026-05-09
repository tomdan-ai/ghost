'use client';

import { useEffect, useCallback, useRef } from 'react';
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
    setToken,
    setUser,
    disconnect: disconnectStore,
    token: storedToken
  } = useWalletStore();

  const syncingRef = useRef(false);
  const lastAuthedWalletRef = useRef<string | null>(null);

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

    if (syncingRef.current) return;

    try {
      syncingRef.current = true;
      const walletAddr = publicKey.toBase58();

      if (lastAuthedWalletRef.current === walletAddr && storedToken) {
        apiClient.setAuthToken(storedToken);
        return;
      }
      
      // 1. Get nonce
      const { message, nonce } = await apiClient.getNonce(walletAddr);
      
      // 2. Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);
      
      // 3. Verify and get token
      const { token: authToken, user } = await apiClient.verifySignature(
        walletAddr,
        signatureBase58,
        message,
        nonce
      );
      
      // 4. Set auth token in client
      apiClient.setAuthToken(authToken);
      
      // 5. Update store
      setToken(authToken);
      setUser(user);
      setUsername(user.username || null);
      setHasRegistered(!!user.username && !user.username.startsWith('user_'));

      lastAuthedWalletRef.current = walletAddr;
      
    } catch (error) {
      console.error('Backend sync failed:', error);
      // Even if backend sync fails, we might still want to show wallet balance
    } finally {
      syncingRef.current = false;
    }
  }, [publicKey, signMessage, setUsername, setHasRegistered, setToken, setUser, storedToken]);

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
