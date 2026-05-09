'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Check, ExternalLink, Loader2, Link as LinkIcon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { PaymentStatus, type PaymentRequest } from '@ghost/shared-types';

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [payment, setPayment] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayment = useCallback(async () => {
    try {
      const data = await apiClient.getPayment(id);
      setPayment(data);
      
      // If completed or failed, we can stop the fast polling
      return data.status === PaymentStatus.COMPLETED || data.status === PaymentStatus.FAILED;
    } catch (err) {
      console.error('Failed to fetch payment:', err);
      // Don't set error on polling failure, just wait for next try
      if (isLoading) setError('Transaction not found');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoading]);

  useEffect(() => {
    fetchPayment();
    
    const interval = setInterval(async () => {
      const shouldStop = await fetchPayment();
      if (shouldStop) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchPayment]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-text-inverse animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-inverse">Locating Ghost...</span>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center gap-8 px-8 text-center">
        <div className="text-red-500 flex flex-col items-center gap-4">
          <History className="w-16 h-16 opacity-20" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">Transaction Missing</h2>
          <p className="text-sm opacity-60 uppercase font-bold tracking-widest">{error || 'Could not find details'}</p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-text-inverse text-surface-base rounded-full px-8 h-16 font-black uppercase tracking-widest hover:bg-text-tertiary">Return to Base</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = payment.status === PaymentStatus.COMPLETED;
  const isFailed = payment.status === PaymentStatus.FAILED;
  const isProcessing = payment.status === PaymentStatus.PROCESSING;

  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans selection:bg-text-tertiary selection:text-surface-base flex flex-col antialiased overflow-x-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 py-8 mt-4">
        <div className="text-2xl font-black tracking-tighter uppercase">GHOST</div>
        <Link href="/dashboard">
          <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse active:scale-95 transition-transform hover:bg-text-inverse hover:text-surface-base">
            <X className="w-5 h-5" />
          </button>
        </Link>
      </header>

      <main className="px-8 pt-4 pb-32 max-w-lg mx-auto w-full">
        
        {/* Content Header */}
        <div className="relative mb-12">
          <span className="absolute -top-6 -left-4 text-text-inverse font-black text-2xl opacity-10">+</span>
          <div className="text-[10px] font-black font-mono text-text-tertiary uppercase tracking-[0.3em] mb-4">
            Status: {payment.status}
          </div>
          <h1 className="text-5xl uppercase font-black tracking-tighter mb-4 leading-none">
            SENT {payment.amount} <span className="opacity-40">SOL</span>
          </h1>
          <p className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-[0.2em] break-all opacity-60">ID: {id}</p>
        </div>

        <div className="h-[2px] bg-text-inverse w-full mb-12 opacity-10"></div>

        {/* Vertical Step Tracker */}
        <div className="flex flex-col space-y-0">
          
          {/* Step 1: Complete */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-text-inverse flex items-center justify-center text-surface-base border-2 border-text-inverse shadow-xl">
                <Check className="w-6 h-6" strokeWidth={3} />
              </div>
              <div className="w-[3px] bg-text-inverse flex-grow"></div>
            </div>
            <div className="pt-2">
              <h3 className="text-[12px] font-black text-text-inverse uppercase tracking-widest">SUBMITTED</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1 font-medium">Payment logic initiated on source chain.</p>
            </div>
          </div>

          {/* Step 2: Bridging */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 border-text-inverse transition-all duration-500 ${isProcessing || isCompleted ? 'bg-text-inverse text-surface-base shadow-xl' : 'bg-transparent text-text-inverse opacity-20'}`}>
                {(isProcessing && !isCompleted) ? (
                  <>
                    <div className="absolute inset-0 rounded-full bg-text-tertiary animate-ping opacity-40"></div>
                    <div className="w-2.5 h-2.5 bg-surface-base rounded-full"></div>
                  </>
                ) : isCompleted ? (
                   <Check className="w-6 h-6" strokeWidth={3} />
                ) : (
                  <div className="w-2 h-2 bg-text-inverse rounded-full"></div>
                )}
              </div>
              <div className={`w-[3px] flex-grow transition-all duration-500 ${isCompleted ? 'bg-text-inverse' : 'bg-text-inverse/10'}`}></div>
            </div>
            <div className={`pt-2 transition-opacity duration-500 ${isProcessing || isCompleted ? 'opacity-100' : 'opacity-20'}`}>
              <h3 className="text-[12px] font-black text-text-inverse uppercase tracking-widest">BRIDGING</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1 font-medium italic">Liquidity in transit via Ghost Core.</p>
            </div>
          </div>

          {/* Step 3: Settling */}
          <div className="flex gap-6 h-28">
            <div className="flex flex-col items-center">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 border-text-inverse transition-all duration-500 ${isCompleted ? 'bg-text-inverse text-surface-base shadow-xl' : 'bg-transparent text-text-inverse opacity-20'}`}>
                {isCompleted ? (
                   <Check className="w-6 h-6" strokeWidth={3} />
                ) : (
                  <div className="w-2 h-2 bg-text-inverse rounded-full"></div>
                )}
              </div>
              <div className={`w-[3px] flex-grow transition-all duration-500 ${isCompleted ? 'bg-text-inverse' : 'bg-text-inverse/10'}`}></div>
            </div>
            <div className={`pt-2 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-20'}`}>
              <h3 className="text-[12px] font-black text-text-inverse uppercase tracking-widest">FINALIZING</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1 font-medium">Validating proofs on Solana Devnet.</p>
            </div>
          </div>

          {/* Step 4: Done */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-text-inverse transition-all duration-500 ${isCompleted ? 'bg-[#D1F2E1] text-[#0A0A0A] border-[#D1F2E1] shadow-2xl scale-110' : 'bg-transparent text-text-inverse opacity-20'}`}>
                <LinkIcon className="w-5 h-5" />
              </div>
            </div>
            <div className={`pt-2 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-20'}`}>
              <h3 className="text-[12px] font-black text-text-inverse uppercase tracking-widest">DELIVERED</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-1 font-black">Funds settled to @{payment.receiverUsername || 'User'}.</p>
            </div>
          </div>
        </div>

        {/* Detail Card */}
        <div className="mt-16 p-8 border-2 border-text-inverse rounded-2xl relative bg-text-inverse text-surface-base shadow-2xl group active:scale-[0.99] transition-transform">
          <div className="absolute top-4 right-6 text-[10px] font-black tracking-widest opacity-20 group-hover:opacity-100 transition-opacity uppercase font-mono">Verified_OnChain</div>
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
              <span className="opacity-60">Source Chain</span>
              <span className="font-black">BASE</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
              <span className="opacity-60">Receiver Address</span>
              <span className="font-black">{payment.receiverWallet.slice(0, 6)}...{payment.receiverWallet.slice(-4)}</span>
            </div>
            <div className="h-[1px] bg-surface-base/10 w-full"></div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Total Value</span>
              <span className="text-4xl font-black tracking-tighter">{payment.amount} SOL</span>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-12 left-0 w-full px-8 max-w-lg mx-auto left-1/2 -translate-x-1/2">
        <Button 
          disabled={!payment.txHash}
          onClick={() => payment.txHash && window.open(`https://explorer.solana.com/tx/${payment.txHash}?cluster=devnet`, '_blank')}
          className="w-full h-20 bg-text-inverse text-surface-base rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-text-tertiary hover:text-text-inverse active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
        >
          View on Explorer <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
