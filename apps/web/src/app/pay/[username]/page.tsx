'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Layers, ShieldCheck, Lock, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/stores/wallet-store';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { publicKey } = useWallet();
  const { connected } = useWalletStore();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        setIsResolving(true);
        const { walletAddress } = await apiClient.resolveUsername(username);
        setResolvedAddress(walletAddress);
        setError(null);
      } catch (err) {
        console.error('Failed to resolve username:', err);
        setError('Ghost Handle not found');
      } finally {
        setIsResolving(false);
      }
    };

    if (username) {
      resolve();
    }
  }, [username]);

  const handlePayment = async () => {
    if (!resolvedAddress || !publicKey) return;

    try {
      setLoading(true);
      setStatusMsg('Initiating Payment...');
      
      const payment = await apiClient.createPayment({
        senderWallet: publicKey.toBase58(),
        receiverWallet: resolvedAddress,
        receiverUsername: username,
        amount: amount,
        sourceChain: 'base',
        destinationChain: 'solana'
      });

      setStatusMsg('Bridging via LI.FI...');
      // In a real app, we would now trigger a wallet signature for the LI.FI bridge
      // For this integration, the API handles the reference creation on-chain
      
      setTimeout(() => {
        setStatusMsg('Settling on Solana...');
        setTimeout(() => {
          setLoading(false);
          setStatusMsg('Payment Successful!');
          setAmount('');
          // Redirect to transaction tracking
          router.push(`/transaction/${payment.id}`);
        }, 2000);
      }, 2000);
      
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Payment execution failed');
      setLoading(false);
    }
  };

  const truncatedAddress = resolvedAddress 
    ? `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}`
    : 'Resolving...';

  return (
    <div className="min-h-screen bg-surface-base text-text-secondary font-sans overflow-x-hidden flex flex-col items-center pt-24 pb-32 px-4 md:px-8">
      {/* Massive Editorial Headline */}
      <div className="w-full max-w-5xl mb-16">
        <div className="h-[1px] bg-border w-full mb-4"></div>
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Recipient</span>
            <h1 className="text-4xl md:text-5xl text-text-inverse tracking-tighter uppercase leading-none font-black">
              PAY @{username}
            </h1>
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-xs bg-text-inverse/5">
              <div className={`w-2 h-2 rounded-full ${resolvedAddress ? 'bg-[#D1F2E1]' : 'bg-red-400 animate-pulse'}`}></div>
              <span className="text-[11px] uppercase tracking-widest text-text-inverse font-black">
                {isResolving ? 'Resolving Network...' : (resolvedAddress ? `Verified: ${truncatedAddress}` : 'Ghost Resolve Error')}
              </span>
            </div>
          </div>
        </div>
        <div className="h-[1px] bg-border w-full mt-4"></div>
      </div>

      {/* Payment Flow Container */}
      <div className="w-full max-w-2xl space-y-12 mt-8">
        
        {error && (
          <div className="p-6 border-2 border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-4 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Amount Section */}
        <div className="space-y-4">
          <label className="text-xs uppercase text-text-secondary opacity-80 font-bold tracking-widest">Enter Amount</label>
          <div className="relative group">
            <input 
              className="w-full h-32 bg-surface-base border-2 border-text-inverse rounded-xl px-8 text-6xl font-black tracking-tighter focus:ring-0 focus:outline-none transition-all placeholder:text-text-inverse/10 text-text-inverse" 
              placeholder="0.00" 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || isResolving}
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-text-inverse text-surface-base rounded-full px-6 py-2 shadow-xl">
              <span className="text-xs font-black uppercase tracking-widest">USDC</span>
            </div>
          </div>
        </div>

        {/* Route and Chain Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs uppercase text-text-secondary opacity-80 font-bold tracking-widest">Source Network</label>
            <div className="border-2 border-text-inverse rounded-xl p-6 bg-surface-base flex justify-between items-center cursor-pointer group hover:bg-text-inverse hover:text-surface-base transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <Layers className="h-6 w-6" />
                <span className="text-lg font-black uppercase tracking-tighter">Base</span>
              </div>
              <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100" />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs uppercase text-text-secondary opacity-80 font-bold tracking-widest">Destination</label>
            <div className="border-2 border-text-inverse/20 rounded-xl p-6 bg-surface-base flex justify-between items-center opacity-60 grayscale cursor-not-allowed">
              <div className="flex items-center gap-4">
                <Lock className="h-6 w-6" />
                <span className="text-lg font-black uppercase tracking-tighter">Solana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Card - Premitum Brutalist */}
        <div className="bg-text-inverse text-surface-base rounded-xl p-8 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-60 font-bold">Protocol Route</h3>
              <p className="text-2xl font-black tracking-tighter uppercase">Ghost Bridge v1</p>
            </div>
            <div className="bg-[#D1F2E1] text-[#0A0A0A] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              Efficient
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center border-b border-surface-base/20 pb-4">
              <span className="text-xs uppercase tracking-widest opacity-60 font-bold">Expected Time</span>
              <span className="text-sm font-black uppercase">&lt; 30 Seconds</span>
            </div>
            <div className="flex justify-between items-center border-b border-surface-base/20 pb-4">
              <span className="text-xs uppercase tracking-widest opacity-60 font-bold">Gas Estimation</span>
              <span className="text-sm font-black uppercase">$0.04 USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest opacity-60 font-bold">Network Priority</span>
              <span className="text-xs font-black uppercase bg-surface-base/10 px-3 py-1 rounded-full">High</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <ShieldCheck className="w-48 h-48" strokeWidth={0.5} />
          </div>
        </div>

        {/* Pay Now Button */}
        <div className="pt-8">
          <Button 
            disabled={!amount || loading || isResolving || !resolvedAddress || !publicKey}
            onClick={handlePayment}
            className="w-full h-24 bg-text-inverse text-surface-base rounded-xl flex items-center justify-center gap-4 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all text-xl font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed border-none shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>{statusMsg}</span>
              </div>
            ) : (
              <>
                Confirm Payment <ArrowRight className="h-8 w-8" />
              </>
            )}
          </Button>
          
          {!publicKey && (
            <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
              Please connect your wallet to continue
            </p>
          )}
        </div>

        {/* Feedback Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-text-inverse/5 border border-border">
            <ShieldCheck className="w-4 h-4 text-text-tertiary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Secured by Ghost Engine</span>
          </div>
          <p className="text-[11px] text-text-secondary opacity-60 max-w-sm font-medium leading-relaxed">
            Funds will be bridged from <span className="text-text-inverse font-bold">Base</span> to <span className="text-text-inverse font-bold">Solana</span>. Resolution happens on-chain via the Ghost Registry.
          </p>
        </div>
      </div>
    </div>
  );
}
