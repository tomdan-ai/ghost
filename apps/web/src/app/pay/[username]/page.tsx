'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PaymentPage() {
  const params = useParams();
  const username = params.username as string;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pay @{username}
        </h1>
        <p className="text-gray-600 mb-8">
          Send payment from any chain
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Chain
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>Ethereum</option>
              <option>Polygon</option>
              <option>Arbitrum</option>
              <option>Base</option>
              <option>Solana</option>
            </select>
          </div>

          <button
            disabled={!amount || loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : 'Send Payment'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Powered by Ghost Wallet × LI.FI
          </p>
        </div>
      </div>
    </div>
  );
}
