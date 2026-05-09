'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TransactionPage() {
  const params = useParams();
  const id = params.id as string || 'GH-8829-X0';

  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans selection:bg-text-tertiary selection:text-surface-base flex flex-col antialiased overflow-x-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 py-8">
        <div className="text-2xl font-black tracking-tighter uppercase">GHOST</div>
        <Link href="/dashboard">
          <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse active:scale-95 transition-transform">
            <X className="w-5 h-5" />
          </button>
        </Link>
      </header>

      <main className="px-8 pt-4 pb-32 max-w-lg mx-auto w-full">
        
        {/* Content Header */}
        <div className="relative mb-12">
          <span className="absolute -top-4 -left-3 text-text-inverse font-black text-xl opacity-20">+</span>
          <h1 className="text-4xl uppercase font-black tracking-tighter mb-2 leading-none">SENDING $25</h1>
          <p className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-[0.2em]">Transaction ID: {id}</p>
        </div>

        <hr className="border-t border-text-inverse mb-12 opacity-10" />

        {/* Vertical Step Tracker */}
        <div className="flex flex-col space-y-0">
          
          {/* Step 1: Complete */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-text-inverse flex items-center justify-center text-surface-base border-2 border-text-inverse">
                <Check className="w-5 h-5" strokeWidth={3} />
              </div>
              <div className="w-[2px] bg-text-inverse flex-grow"></div>
            </div>
            <div className="pt-1">
              <h3 className="text-[11px] font-bold text-text-inverse uppercase tracking-widest">SUBMITTED</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1">Confirmed on source chain</p>
            </div>
          </div>

          {/* Step 2: Active/Pulsing */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full bg-text-tertiary animate-ping opacity-40"></div>
                <div className="relative w-8 h-8 rounded-full bg-text-inverse flex items-center justify-center border-2 border-text-inverse">
                  <div className="w-2.5 h-2.5 bg-surface-base rounded-full"></div>
                </div>
              </div>
              <div className="w-[2px] bg-text-inverse/20 flex-grow"></div>
            </div>
            <div className="pt-1">
              <h3 className="text-[11px] font-bold text-text-inverse uppercase tracking-widest">BRIDGING</h3>
              <p className="text-sm text-text-inverse font-black tracking-tight leading-relaxed mt-1">In transit via Ghost Protocol</p>
            </div>
          </div>

          {/* Step 3: Future */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-text-inverse/20 bg-transparent flex items-center justify-center"></div>
              <div className="w-[2px] bg-text-inverse/20 flex-grow"></div>
            </div>
            <div className="pt-1 opacity-40">
              <h3 className="text-[11px] font-bold text-text-inverse uppercase tracking-widest">ARRIVING ON SOLANA</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1">Awaiting final validation</p>
            </div>
          </div>

          {/* Step 4: Future */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-text-inverse/20 bg-transparent flex items-center justify-center"></div>
            </div>
            <div className="pt-1 opacity-40">
              <h3 className="text-[11px] font-bold text-text-inverse uppercase tracking-widest">DELIVERED</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1">Funds available in wallet</p>
            </div>
          </div>
        </div>

        {/* Detail Card */}
        <div className="mt-16 p-8 border-2 border-text-inverse rounded-xl relative bg-surface-base overflow-hidden group">
          <span className="absolute -top-3 -right-3 text-sm font-bold font-mono opacity-20 group-hover:opacity-100 transition-opacity">+</span>
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
              <span className="text-text-secondary">Network Fee</span>
              <span className="text-text-inverse">$0.02</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
              <span className="text-text-secondary">Estimated Time</span>
              <span className="text-text-inverse">~ 2 Minutes</span>
            </div>
            <div className="flex justify-between items-center border-t border-text-inverse/10 pt-6">
              <span className="text-[11px] font-bold text-text-inverse uppercase tracking-widest">Total Value</span>
              <span className="text-3xl font-black text-text-inverse tracking-tighter">$25.02</span>
            </div>
          </div>
        </div>

        {/* Decorative Map Section */}
        <div className="mt-12 rounded-xl overflow-hidden border-2 border-text-inverse h-40 relative group cursor-crosshair">
          <img 
            alt="Abstract map" 
            className="w-full h-full object-cover grayscale opacity-40 transition-all group-hover:scale-105 group-hover:opacity-60 mix-blend-multiply" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFCf4yqgv6CAaJusJxvpmlhy1EvdMKAGEXr0riyQ-Qz10I0HP7qESUD9JAFrllF1WhpA9ZQ2FP6bU8RoXJ876g1aF8oTmOyR1u71QvrIXCNFV1hL5zZ1S07S68tPsP1WFcY-ZOG-FI2TKigvk91MBtplGCPtNw0zhIMh94VIyV4TLy9wFDo5TTRqVLHAfksj633iZgbYkKArTKxxDbp_CkpAq0DXmb3pP0Z8EEfQ5sfRBwZh8Pdkns2f2cKkNj21l6XZ1j6MqSEfaR"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 bg-text-inverse text-surface-base text-[10px] font-bold font-mono uppercase tracking-[0.3em] rounded-full border border-text-inverse shadow-xl">
              LIVE TRACKING
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-12 left-0 w-full px-8 max-w-lg mx-auto left-1/2 -translate-x-1/2">
        <Button className="w-full h-20 bg-text-inverse text-surface-base rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-2xl hover:bg-text-tertiary hover:text-text-inverse active:scale-95 transition-all flex items-center justify-center gap-3 border-none">
          View on Explorer <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
