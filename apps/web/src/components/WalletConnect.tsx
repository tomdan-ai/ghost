'use client';

import { useState } from 'react';

export default function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const [address] = useState('');

  const handleConnect = async () => {
    // Wallet connection logic
    setConnected(true);
  };

  return (
    <button
      onClick={handleConnect}
      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
    >
      {connected
        ? `${address.slice(0, 4)}...${address.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
}
