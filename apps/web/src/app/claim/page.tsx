'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Settings, CheckCircle, ArrowRight, User, Loader2, AlertCircle, ArrowLeftRight, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useWalletStore } from '@/stores/wallet-store';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import HeaderWallet from '@/components/HeaderWallet';

export default function ClaimPage() {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUsername: setStoreUsername, setHasRegistered } = useWalletStore();
  const router = useRouter();
  const debouncedUsername = useDebounce(username, 500);

  const checkAvailability = useCallback(async (name: string) => {
    if (name.length < 3) {
      setIsAvailable(null);
      return;
    }
    
    setIsChecking(true);
    setError(null);
    try {
      const { available } = await apiClient.checkUsername(name);
      setIsAvailable(available);
    } catch (err) {
      console.error('Failed to check availability:', err);
      setError('Connection error. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedUsername) {
      checkAvailability(debouncedUsername);
    } else {
      setIsAvailable(null);
    }
  }, [debouncedUsername, checkAvailability]);

  const handleClaim = async () => {
    if (!isAvailable || isRegistering) return;

    setIsRegistering(true);
    setError(null);
    try {
      const { success } = await apiClient.registerUsername(username);
      if (success) {
        setStoreUsername(username);
        setHasRegistered(true);
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Check your balance.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans selection:bg-text-tertiary selection:text-surface-base flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 py-6 border-b-2 border-text-inverse sticky top-0 z-40 bg-surface-base">
        <Link href="/" className="text-3xl tracking-tighter font-black uppercase hover:opacity-80 transition-opacity">GHOST</Link>
        <div className="flex gap-6">
          <HeaderWallet />
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-text-inverse active:scale-95 transition-transform hover:text-text-tertiary"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col px-8 pt-12 pb-32 max-w-lg mx-auto w-full">
        
        {/* Headline Section */}
        <div className="relative mb-12">
          <div className="absolute -top-3 -left-3 text-sm font-bold font-mono opacity-20">+</div>
          <h1 className="text-4xl uppercase tracking-tighter font-black pt-4 leading-none">
            CLAIM YOUR HANDLE
          </h1>
          <p className="text-text-secondary mt-4 text-base leading-relaxed">
            Secure your unique identity on the Ghost Protocol. Your handle is your cross-chain passport.
          </p>
        </div>

        <div className="w-full h-[1px] bg-text-inverse mb-12 opacity-10"></div>

        <section className="space-y-10">
          {/* Username Input Field */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Username Choice</label>
            <div className="relative flex items-center group">
              <span className="absolute left-6 text-[10px] font-bold font-mono text-text-secondary uppercase border-r border-text-inverse/10 pr-4 py-1">
                ghost.app/
              </span>
              <input 
                className={`w-full bg-transparent border-2 ${isAvailable === false ? 'border-red-500' : 'border-text-inverse'} rounded-xl py-6 pl-32 pr-12 text-2xl font-black focus:ring-0 focus:border-text-tertiary placeholder:opacity-20 transition-colors`} 
                placeholder="username" 
                type="text" 
                value={username}
                disabled={isRegistering}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              />
              <div className="absolute right-6 flex items-center">
                {isChecking ? (
                  <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
                ) : isAvailable === true ? (
                  <CheckCircle className="text-text-tertiary w-6 h-6 fill-current" />
                ) : isAvailable === false ? (
                  <AlertCircle className="text-red-500 w-6 h-6" />
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 px-2 h-4">
              {isAvailable === true && (
                <span className="text-[10px] font-bold font-mono text-text-tertiary uppercase tracking-wider">
                  ✓ @{username} IS AVAILABLE
                </span>
              )}
              {isAvailable === false && (
                <span className="text-[10px] font-bold font-mono text-red-500 uppercase tracking-wider">
                  × @{username} IS ALREADY TAKEN
                </span>
              )}
              {error && (
                <span className="text-[10px] font-bold font-mono text-red-500 uppercase tracking-wider">
                  {error}
                </span>
              )}
            </div>
          </div>

          {/* Fee Card */}
          <div className="relative p-8 bg-text-inverse/5 rounded-xl border-2 border-text-inverse overflow-hidden group">
             <div className="absolute -top-3 -left-3 text-sm font-bold font-mono opacity-20">+</div>
             <div className="flex justify-between items-start">
               <div className="space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Estimated Fee</p>
                 <p className="text-lg font-black tracking-tight">0.0025 SOL</p>
               </div>
               <div className="space-y-2 text-right">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Renewal</p>
                 <p className="text-lg font-black tracking-tight">Annually</p>
               </div>
             </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleClaim}
            disabled={!isAvailable || isRegistering || username.length < 3}
            className="w-full h-24 bg-text-inverse text-surface-base text-xs font-bold uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all flex justify-center items-center gap-4 hover:bg-text-tertiary hover:text-text-inverse shadow-none border-none disabled:opacity-50 disabled:grayscale"
          >
            {isRegistering ? (
              <>REGISTERING ON-CHAIN <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : (
              <>CLAIM @{username.toUpperCase() || '...'} <ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
        </section>

        {/* Footer Info */}
        <div className="mt-auto pt-16 space-y-8">
          <div className="h-[1px] bg-text-inverse opacity-10"></div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <span className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-widest cursor-pointer hover:text-text-inverse transition-colors">Reserved names</span>
            <span className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-widest cursor-pointer hover:text-text-inverse transition-colors">Auction guidelines</span>
            <span className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-widest cursor-pointer hover:text-text-inverse transition-colors">Transfer policy</span>
          </div>
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-24 flex justify-around items-center bg-surface-base border-t-2 border-text-inverse px-4 pb-8 z-50">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all px-4 py-2">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase mt-1">Wallet</span>
        </Link>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all px-4 py-2"
        >
          <ArrowLeftRight className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase mt-1">Swap</span>
        </button>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center text-text-secondary hover:text-text-inverse transition-all px-4 py-2"
        >
          <HistoryIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase mt-1">History</span>
        </button>
        <div className="flex flex-col items-center justify-center bg-text-inverse text-surface-base rounded-full px-8 py-3 translate-y-0">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase mt-1">Profile</span>
        </div>
      </nav>
    </div>
  );
}
