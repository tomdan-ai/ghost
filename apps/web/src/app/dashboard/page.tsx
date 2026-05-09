'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Settings, 
  ArrowDown, 
  Send, 
  ArrowLeftRight, 
  History, 
  User,
  ShieldCheck,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useWalletStore } from '@/stores/wallet-store';
import { apiClient } from '@/lib/api-client';
import { PaymentStatus, type PaymentRequest } from '@ghost/shared-types';

export default function DashboardPage() {
  const { publicKey, balance, username, syncBalance } = useWalletStore();
  const [history, setHistory] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const payments = await apiClient.getPaymentHistory();
        setHistory(payments);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };

    if (publicKey) {
      fetchHistory();
    }
  }, [publicKey]);

  const formatDistance = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (diff < 0) return 'JUST NOW';
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans selection:bg-text-tertiary selection:text-surface-base">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 py-6 bg-surface-base border-b-2 border-text-inverse sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-text-inverse bg-[#D1F2E1] flex items-center justify-center overflow-hidden">
            <img 
              alt="Ghost Avatar" 
              className="w-full h-full object-cover" 
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${username || 'ghost'}`}
            />
          </div>
          <span className="text-xl tracking-tighter uppercase font-black">@{username || 'CLAIM HANDLE'}</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => syncBalance()} className="text-text-inverse hover:opacity-80 active:scale-95 transition-all">
            <Wallet className="w-6 h-6" />
          </button>
          <button className="text-text-inverse hover:opacity-80 active:scale-95 transition-all">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pb-32 px-8 max-w-2xl mx-auto pt-12">
        
        {/* Editorial Section Divider */}
        <div className="relative mb-12">
          <div className="h-[1px] bg-text-inverse w-full opacity-20 relative">
            <span className="absolute -top-3 left-0 text-text-inverse font-mono text-[14px]">+</span>
          </div>
          
          {/* Hero Balance Card */}
          <div className="mt-8 bg-text-inverse text-surface-base rounded-xl p-8 border-2 border-text-inverse relative overflow-hidden active:scale-[0.98] transition-transform duration-150 shadow-none">
            <div className="flex flex-col gap-2 relative z-10">
              <span className="text-[11px] uppercase tracking-widest opacity-80 font-bold">Current Portfolio</span>
              <h1 className="text-5xl md:text-6xl tracking-tighter font-black leading-none">
                {balance ? balance.toFixed(4) : '0.0000'} <span className="text-2xl opacity-60">SOL</span>
              </h1>
            </div>
            {/* Decorative Ghost Icon in Background */}
            <div className="absolute -bottom-8 -right-8 opacity-10">
                <Wallet className="w-48 h-48" strokeWidth={0.5} />
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-text-inverse rounded-full text-xs font-bold uppercase hover:bg-text-inverse hover:text-surface-base transition-all active:scale-95">
              <ArrowDown className="w-4 h-4" />
              RECEIVE
            </button>
            <Link href="/pay" className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-text-inverse rounded-full text-xs font-bold uppercase hover:bg-text-inverse hover:text-surface-base transition-all active:scale-95 text-center">
              <Send className="w-4 h-4" />
              SEND
            </Link>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl uppercase tracking-tighter font-black">Recent Activity</h2>
          <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold cursor-pointer hover:text-text-inverse transition-colors">View All</span>
        </div>

        {/* Activity List */}
        <div className="border-t-2 border-text-inverse space-y-0 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Fetching Ghost stats...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
              <History className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">No activity found</span>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-6 border-b border-text-inverse/20 group cursor-pointer hover:bg-text-inverse/5 transition-colors -mx-8 px-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center border-2 border-text-inverse rounded-full ${item.status === PaymentStatus.COMPLETED ? 'bg-[#D1F2E1]' : 'bg-[#F2F1D1]'}`}>
                    {item.status === PaymentStatus.COMPLETED ? <CheckCircle className="w-6 h-6" /> : <ArrowLeftRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase leading-none mb-1">
                      {item.receiverUsername ? `Pay to @${item.receiverUsername}` : 'Payment'}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-[#E2E2E2] border border-text-inverse rounded-full text-[10px] font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black leading-none mb-1">{item.amount} SOL</div>
                  <div className="text-[10px] font-bold uppercase text-text-secondary opacity-60">
                    {formatDistance(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Upsell Card */}
        {!username && (
          <div className="mt-12 group cursor-pointer">
            <Link href="/claim" className="block p-6 border-2 border-text-inverse rounded-xl bg-surface-base relative overflow-hidden hover:bg-text-inverse hover:text-surface-base transition-all duration-300">
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div className="text-[11px] font-bold uppercase max-w-[150px] tracking-widest leading-relaxed">
                  CLAIM YOUR UNIQUE HANDLE NOW.
                </div>
                <ArrowRight className="text-text-inverse group-hover:text-surface-base group-hover:translate-x-2 transition-all" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <User className="w-10 h-10 text-text-tertiary group-hover:text-surface-base" />
                <h3 className="text-2xl uppercase tracking-tighter font-black leading-tight flex items-center gap-2">
                  No Identity <span className="opacity-60 group-hover:opacity-100 transition-opacity">Reserved</span>
                </h3>
              </div>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-24 flex justify-around items-center bg-surface-base border-t-2 border-text-inverse px-4 pb-8 z-50">
        
        <Link href="/dashboard" className="flex flex-col items-center justify-center bg-text-inverse text-surface-base rounded-full px-8 py-3 transition-transform active:scale-90">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase mt-1">Wallet</span>
        </Link>
        
        <button className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all active:scale-90 px-4 py-2 rounded-full group">
          <ArrowLeftRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Swap</span>
        </button>

        <button className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all active:scale-90 px-4 py-2 rounded-full group">
          <History className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">History</span>
        </button>

        <button className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all active:scale-90 px-4 py-2 rounded-full group">
          <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
        </button>
      </nav>
    </div>
  );
}
