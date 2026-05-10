'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Globe, HelpCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from '@/components/WalletConnect';
import HeaderWallet from '@/components/HeaderWallet';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-surface-base text-text-inverse font-sans flex flex-col selection:bg-text-tertiary selection:text-surface-base overflow-hidden">
      
      {/* Header Area */}
      <div className="flex-none px-8 pt-16">
        <div className="flex justify-between items-start">
          <Link href="/" className="text-4xl md:text-5xl tracking-tighter uppercase font-black leading-none">
            GHOST
          </Link>
          <div className="flex gap-4">
            <HeaderWallet />
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-text-inverse/20 hover:border-text-inverse active:scale-95 transition-all text-text-inverse/40 hover:text-text-inverse"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Grid Line */}
      <div className="h-[2px] bg-text-inverse w-full mt-6"></div>

      <main className="flex-grow flex flex-col px-8 py-12 justify-between max-w-lg mx-auto w-full">
        <div className="space-y-12">
          {/* Headline Section */}
          <div className="relative inline-block">
            <span className="absolute -top-6 -left-2 text-[10px] font-bold uppercase tracking-widest opacity-60">01 / Start</span>
            <h2 className="text-3xl md:text-4xl uppercase font-black leading-tight tracking-tighter">
              CONNECT YOUR SOLANA WALLET
            </h2>
          </div>

          <p className="text-base text-text-secondary max-w-[300px] leading-relaxed">
            Secure access to the Ghost Protocol. Manage assets, swap tokens, and secure nodes with precision.
          </p>

          {/* Visual Element */}
          <div className="w-full h-56 border-2 border-text-inverse rounded-xl overflow-hidden relative bg-text-inverse/5">
            <Image
              alt="Abstract encryption visualization"
              className="object-cover grayscale contrast-125 mix-blend-multiply opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYMnP7F_t79rPx1_4jNER5eDfeEnwLXkFuqFhMRlx3wIcNz7yIqLo5k7_Jui4zWK3lL8hiSN8TijeIoQqAqkHpmYuMHgFeb2Z_BrGhVagPlwxSRcB0ftwur10GiKMiJROQROmcf09vRCeVftak8kyLbMsHcN_Vji1ADoT57hun1rQZcu6sPeIo6Mi11w-dJbEL2Xo7-yh5k5FKfE1NrOg5hgaRiAnDJntvDuvMOcuqmCU9Q5JboPAg6VqhBA7Dd_pOWhGoaNaMpk5x"
              fill
              sizes="(min-width: 768px) 448px, 100vw"
            />
            <div className="absolute top-4 right-4">
              <Shield className="text-text-tertiary w-8 h-8 fill-current" />
            </div>
            <div className="absolute bottom-0 left-0 p-4 w-full bg-text-inverse/10 backdrop-blur-md border-t border-text-inverse/20 translate-y-0 flex justify-between items-center">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest">ENCRYPTED_SESSION_v2.0</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary/40"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-4 pt-16">
          {/* We'll use the existing WalletConnect component but style it for onboarding if needed, or just a direct button for now */}
          <WalletConnect />
          
          <Button 
            variant="outline"
            onClick={() => router.push('/claim')}
            className="w-full h-20 bg-transparent border-2 border-text-inverse text-text-inverse rounded-full text-xs font-bold uppercase tracking-widest hover:bg-text-inverse hover:text-surface-base transition-all active:scale-95 shadow-none"
          >
            CREATE USERNAME OR WALLET NAME
          </Button>

          <div className="pt-6 flex flex-col items-center gap-4">
            <div className="h-[1px] bg-text-inverse w-full opacity-10"></div>
            <p className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-[0.2em] text-center">
              BY CONNECTING, YOU AGREE TO OUR TERMS
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none px-8 pb-12 py-6 flex justify-between items-center opacity-40">
        <span className="text-[10px] font-bold font-mono uppercase tracking-[0.3em]">© 2024 GHOST</span>
        <div className="flex gap-6">
          <Globe className="w-5 h-5 cursor-pointer hover:opacity-100 transition-opacity" />
          <HelpCircle className="w-5 h-5 cursor-pointer hover:opacity-100 transition-opacity" />
        </div>
      </footer>

      {/* Subtle Background Grid Lines */}
      <div className="fixed top-1/2 left-0 w-full h-[1px] bg-text-inverse opacity-[0.03] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 w-[1px] h-full bg-text-inverse opacity-[0.03] pointer-events-none"></div>
    </div>
  );
}
