'use client';

import React from 'react';
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
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans selection:bg-text-tertiary selection:text-surface-base">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 py-6 bg-surface-base border-b-2 border-text-inverse sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-text-inverse bg-[#D1F2E1] flex items-center justify-center overflow-hidden">
            <img 
              alt="Ghost Avatar" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQGsyf23JbTtGAd_9F3BS8y2F7loREYYHk0ZJHW-9btRHCcS9xkzQ54xbPJovyXq6WBXeW3URSShoBOvcKg0Ug2atwZE2z-elsTkr-itSRs1aWD31hdVkF5SLdqO3fomMju4qFR_gn-HjXf_THn3I6t12xYthYRmWma39wf2DbA9aFMiTMVqQsWtD6lJWhpU4VgkSJdCLpo1flHyIht-eA4cNgvLHdbldtI2WWSGmlgJhiKtN1wGnAK22m9nDomnanvAB6VFIB_G5K"
            />
          </div>
          <span className="text-xl tracking-tighter uppercase font-black">@TOM</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-text-inverse hover:opacity-80 active:scale-95 transition-all">
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
                $1,240.00 <span className="text-2xl opacity-60">USDC</span>
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
            <button className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-text-inverse rounded-full text-xs font-bold uppercase hover:bg-text-inverse hover:text-surface-base transition-all active:scale-95">
              <Send className="w-4 h-4" />
              SEND
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl uppercase tracking-tighter font-black">Recent Activity</h2>
          <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold cursor-pointer hover:text-text-inverse transition-colors">View All</span>
        </div>

        {/* Activity List */}
        <div className="border-t-2 border-text-inverse space-y-0">
          
          {/* Activity Item 1 */}
          <div className="flex items-center justify-between py-6 border-b border-text-inverse/20 group cursor-pointer hover:bg-text-inverse/5 transition-colors -mx-8 px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#E5D1F2] border-2 border-text-inverse rounded-full">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase leading-none mb-1">Swapped</div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-[#D1F2E1] border border-text-inverse rounded-full text-[10px] font-bold uppercase">Solana</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black leading-none mb-1">+0.42 ETH</div>
              <div className="text-[10px] font-bold uppercase text-text-secondary opacity-60">2M AGO</div>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="flex items-center justify-between py-6 border-b border-text-inverse/20 group cursor-pointer hover:bg-text-inverse/5 transition-colors -mx-8 px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#F2F1D1] border-2 border-text-inverse rounded-full">
                <ArrowDown className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase leading-none mb-1">Received</div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-[#D1D4F2] border border-text-inverse rounded-full text-[10px] font-bold uppercase">Base</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black leading-none mb-1">$450.00</div>
              <div className="text-[10px] font-bold uppercase text-text-secondary opacity-60">1H AGO</div>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="flex items-center justify-between py-6 border-b border-text-inverse/20 group cursor-pointer hover:bg-text-inverse/5 transition-colors -mx-8 px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#F2D1D1] border-2 border-text-inverse rounded-full">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase leading-none mb-1">NFT Purchase</div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-[#E2E2E2] border border-text-inverse rounded-full text-[10px] font-bold uppercase">Polygon</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black leading-none mb-1">-2.10 MATIC</div>
              <div className="text-[10px] font-bold uppercase text-text-secondary opacity-60">4H AGO</div>
            </div>
          </div>
        </div>

        {/* Security Upsell Card */}
        <div className="mt-12 group cursor-pointer">
          <div className="p-6 border-2 border-text-inverse rounded-xl bg-surface-base relative overflow-hidden hover:bg-text-inverse hover:text-surface-base transition-all duration-300">
            <div className="flex justify-between items-start mb-12">
              <div className="text-[11px] font-bold uppercase max-w-[150px] tracking-widest leading-relaxed">
                Secure your assets with Hardware Lock.
              </div>
              <ArrowRight className="text-text-inverse group-hover:text-surface-base group-hover:translate-x-2 transition-all" />
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-text-tertiary group-hover:text-surface-base" />
              <h3 className="text-2xl uppercase tracking-tighter font-black leading-tight flex items-center gap-2">
                Ghost Node: <span className="opacity-60 group-hover:opacity-100 transition-opacity">Verified</span>
              </h3>
            </div>
          </div>
        </div>
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
