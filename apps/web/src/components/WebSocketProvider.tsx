'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '@/stores/wallet-store';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, syncBalance } = useWalletStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if we have a valid auth token
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
    
    console.log('🔌 Connecting to WebSocket...', socketUrl);
    
    const s = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('✅ WebSocket Connected');
      setConnected(true);
      
      // Subscribe to personal wallet updates
      if (user?.walletAddress) {
        console.log('🏠 Subscribing to wallet:', user.walletAddress);
        s.emit('subscribe:wallet', user.walletAddress);
      }
      
      // Subscribe to user updates
      if (user?.id) {
        s.emit('subscribe:user', user.id);
      }
    });

    s.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setConnected(false);
    });

    s.on('connect_error', (error) => {
      console.error('⚠️ WebSocket Connection Error:', error.message);
      setConnected(false);
    });

    // Handle global wallet updates (e.g. balance changed)
    s.on('wallet:update', (data) => {
      console.log('💰 Wallet Update Received:', data);
      syncBalance(); // Refresh balance in store
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [token, user?.id, user?.walletAddress, syncBalance]);

  return (
    <WebSocketContext.Provider value={{ socket, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
