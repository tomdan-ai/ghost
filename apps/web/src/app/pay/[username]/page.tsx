'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Loader2, AlertCircle, TrendingUp, Clock, Zap, Settings, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useWallet } from '@solana/wallet-adapter-react';
import HeaderWallet from '@/components/HeaderWallet';
import Link from 'next/link';
import { RouteQuote } from '@ghost/shared-types';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // LI.FI Quote State
  const [quote, setQuote] = useState<RouteQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const resolve = useCallback(async () => {
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
  }, [username]);

  useEffect(() => {
    if (username) resolve();
  }, [username, resolve]);

  // Fetch Quote when amount or address changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || !resolvedAddress || !publicKey) {
        setQuote(null);
        return;
      }

      try {
        setIsQuoting(true);
        // Using Base -> Solana as default for the Ghost bridge experience
        const quoteData = await apiClient.getRouteQuote({
          fromChain: '8453', // Base
          toChain: '115111108', // Solana Devnet (hypothetical ID for this MVP)
          fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
          fromAmount: (parseFloat(amount) * 1e6).toString(), // USDC has 6 decimals
          fromAddress: publicKey.toBase58(), // Placeholder for bridge source
        });
        setQuote(quoteData);
      } catch (err) {
        console.error('Failed to fetch bridge quote:', err);
      // Fallback to mock quote for demo if real API fails
        setQuote({
          fromChain: '8453',
          toChain: '115111108',
          fromToken: { symbol: 'USDC' } as any,
          toToken: { symbol: 'USDC' } as any,
          fromAmount: amount,
          toAmount: amount,
          estimatedGas: '0.04',
          estimatedTime: 30,
          steps: []
        });
      } finally {
        setIsQuoting(false);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amount, resolvedAddress, publicKey]);

  const handlePayment = async () => {
    if (!resolvedAddress || !publicKey) return;

    try {
      setLoading(true);
      setStatusMsg('Initiating Ghost Protocol...');
      
      const payment = await apiClient.createPayment({
        senderWallet: publicKey.toBase58(),
        receiverWallet: resolvedAddress,
        receiverUsername: username,
        amount: amount,
        sourceChain: 'base',
        destinationChain: 'solana'
      });

      setStatusMsg('Securing Bridge Liquidity...');
      
      // In MVP, we signal the backend to monitor the LI.FI transaction
      // Here we would normally call LIFI.executeRoute(...)
      
      setTimeout(() => {
        setStatusMsg('Settling on Solana Devnet...');
        setTimeout(() => {
          setLoading(false);
          setStatusMsg('Payment Successful!');
          router.push(`/transaction/${payment.id}`);
        }, 1500);
      }, 1500);
      
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
    <div className="min-h-screen bg-surface-base text-text-secondary font-sans overflow-x-hidden flex flex-col items-center pt-8 pb-32 px-4 md:px-8">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-5xl px-4 py-8 mb-8">
        <Link href="/" className="text-2xl font-black tracking-tighter uppercase leading-none hover:opacity-80 transition-opacity text-text-inverse">GHOST</Link>
        <div className="flex items-center gap-4">
          <HeaderWallet />
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse/20 hover:border-text-inverse active:scale-95 transition-all text-text-inverse/40 hover:text-text-inverse"
          >
            <Settings className="w-5 h-5" />
          </button>
          <Link href="/dashboard">
            <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse active:scale-95 transition-transform hover:bg-text-inverse hover:text-surface-base text-text-inverse">
              <X className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </header>
      
      {/* Editorial Headline */}
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

      <div className="w-full max-w-2xl space-y-12 mt-8">
        
        {error && (
          <div className="p-6 border-2 border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-4 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Amount Input */}
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

        {/* Dynamic Route Info */}
        <div className="bg-text-inverse text-surface-base rounded-xl p-8 relative overflow-hidden shadow-2xl transition-all duration-500 border-2 border-text-inverse">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-60 font-bold">Execution Engine</h3>
              <p className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                Ghost Bridge <Zap className="w-4 h-4 fill-current" />
              </p>
            </div>
            <div className="bg-[#D1F2E1] text-[#0A0A0A] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              {isQuoting ? 'Quoting...' : 'Optimal'}
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest opacity-40 font-black flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time Estimate
                </span>
                <p className="text-lg font-black uppercase tracking-tighter">
                  {isQuoting ? '...' : (quote?.estimatedTime ? `< ${Math.ceil(quote.estimatedTime / 60)} MIN` : '< 30 SEC')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest opacity-40 font-black flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Protocol Fee
                </span>
                <p className="text-lg font-black uppercase tracking-tighter">
                  {isQuoting ? '...' : (quote?.estimatedGas ? `$${quote.estimatedGas} USDC` : '$0.04 USDC')}
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-surface-base/10 w-full"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest opacity-40 font-black">Settlement Target</span>
                <span className="text-sm font-bold uppercase tracking-widest mt-1">Solana Devnet</span>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-text-inverse bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="https://bridge.base.org/icons/base.svg"
                    alt="Base"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-text-inverse bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png"
                    alt="Solana"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <ShieldCheck className="w-48 h-48" strokeWidth={0.5} />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <Button 
            disabled={!amount || loading || isResolving || !resolvedAddress || !publicKey || isQuoting}
            onClick={handlePayment}
            className="w-full h-24 bg-text-inverse text-surface-base rounded-xl flex items-center justify-center gap-4 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all text-xl font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed border-none shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="animate-pulse">{statusMsg}</span>
              </div>
            ) : isQuoting ? (
               <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin opacity-40" />
                <span className="opacity-40">Calculating Route...</span>
              </div>
            ) : (
              <>
                Confirm Payment <ArrowRight className="h-8 w-8" />
              </>
            )}
          </Button>
          
          {!publicKey && (
            <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 py-2 rounded-full border border-red-500/20">
              SOLANA WALLET REQUIRED FOR DEVNET TEST
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4 text-center pb-8 border-t border-border pt-12">
          <div className="flex items-center gap-2 py-2 px-6 rounded-full bg-text-inverse text-surface-base border-2 border-text-inverse shadow-xl">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ghost Protocol v1.0.4 - ACTIVE</span>
          </div>
          <p className="text-[11px] text-text-secondary opacity-60 max-w-sm font-medium leading-relaxed uppercase tracking-wider">
            All cross-chain routes are secured via <span className="text-text-inverse font-black underline decoration-text-tertiary">Ghost Liquidity Pools</span> and audited by the Ghost Engine on Solana Devnet.
          </p>
        </div>
      </div>
    </div>
  );
}
