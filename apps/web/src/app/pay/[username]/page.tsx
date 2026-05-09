'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Layers, ShieldCheck, Lock } from 'lucide-react';

export default function PaymentPage() {
  const params = useParams();
  const username = params.username as string;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handlePayment = () => {
    setLoading(true);
    setStatusMsg('Bridging via LI.FI...');
    setTimeout(() => {
      setStatusMsg('Settling on Solana...');
      setTimeout(() => {
        setLoading(false);
        setStatusMsg('Payment Successful!');
        setAmount('');
        setTimeout(() => setStatusMsg(''), 3000);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-secondary font-sans overflow-x-hidden flex flex-col items-center pt-24 pb-32 px-4 md:px-8">
      {/* Massive Editorial Headline */}
      <div className="w-full max-w-5xl mb-16">
        <div className="h-[1px] bg-border w-full mb-4"></div>
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4">
          <h1 className="text-xl sm:text-2xl text-text-inverse tracking-tighter uppercase leading-none">
            PAY @{username}
          </h1>
          <div className="pb-2">
            <span className="text-xs uppercase tracking-widest text-text-secondary opacity-80">
              Verified Profile / 0x71...82Af
            </span>
          </div>
        </div>
        <div className="h-[1px] bg-border w-full mt-4"></div>
      </div>

      {/* Payment Flow Container */}
      <div className="w-full max-w-2xl space-y-12 mt-8">
        
        {/* Amount Section */}
        <div className="space-y-4">
          <label className="text-xs uppercase text-text-secondary opacity-80">Enter Amount</label>
          <div className="relative group">
            <input 
              className="w-full h-32 bg-transparent border border-border rounded-xs px-8 text-xl focus:ring-0 focus:outline-none transition-all placeholder:text-border placeholder:opacity-50 text-text-inverse" 
              placeholder="0.00" 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-surface-base border border-border rounded-xs px-6 py-3">
              <span className="text-sm uppercase text-text-inverse">USDC</span>
            </div>
          </div>
        </div>

        {/* Route and Chain Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <label className="text-xs uppercase text-text-secondary opacity-80">Source Chain</label>
            <div className="border border-border rounded-xs p-4 bg-surface-base flex justify-between items-center cursor-pointer hover:border-text-tertiary transition-colors">
              <div className="flex items-center gap-3">
                <Layers className="text-text-secondary h-6 w-6" />
                <span className="text-sm font-bold uppercase text-text-inverse">Base</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs uppercase text-text-secondary opacity-80">Destination</label>
            <div className="border border-border rounded-xs p-4 bg-surface-base flex justify-between items-center opacity-60">
              <div className="flex items-center gap-3">
                <Lock className="text-text-secondary h-6 w-6" />
                <span className="text-sm font-bold uppercase text-text-inverse">Solana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Card */}
        <div className="bg-surface-base border border-text-tertiary rounded-xs p-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest mb-1 text-text-secondary opacity-80">Route Details</h3>
              <p className="text-md leading-none text-text-inverse">Instant Bridge</p>
            </div>
            <span className="bg-text-inverse text-surface-base text-xs font-bold px-4 py-1 rounded-xs uppercase">Optimal</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary">Expected Time</span>
              <span className="font-bold uppercase text-text-inverse">&lt; 30 Seconds</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary">Network Fee</span>
              <span className="font-bold uppercase text-text-inverse">$0.04 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Ghost Protocol Fee</span>
              <span className="font-bold uppercase text-text-tertiary">FREE</span>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2">
            <ShieldCheck className="text-text-tertiary h-5 w-5" />
            <span className="text-xs uppercase text-text-secondary opacity-80">Protected by Ghost Security Engine</span>
          </div>
        </div>

        {statusMsg && !loading && (
          <div className="p-4 bg-text-tertiary text-text-inverse rounded-xs text-center border border-border">
            {statusMsg}
          </div>
        )}

        {/* Pay Now Button */}
        <div className="pt-8">
          <Button 
            disabled={!amount || loading}
            onClick={handlePayment}
            className="w-full h-24 bg-text-inverse text-surface-base rounded-xs flex items-center justify-center gap-4 hover:bg-text-tertiary hover:text-text-inverse active:scale-95 transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed border-none text-md uppercase tracking-tighter"
          >
            {loading ? statusMsg : (
              <>
                PAY NOW <ArrowRight className="h-6 w-6" />
              </>
            )}
          </Button>
        </div>

        {/* Contextual Info */}
        <div className="text-center">
          <p className="text-sm text-text-secondary opacity-80 max-w-md mx-auto">
            Sending funds to <span className="text-text-inverse font-bold">Verified Node</span>. Always double check destination addresses and network compatibility.
          </p>
        </div>
      </div>
    </div>
  );
}
