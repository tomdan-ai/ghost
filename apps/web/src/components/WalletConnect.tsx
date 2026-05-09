'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  return (
    <div className="onboarding-wallet-button-wrapper">
      <WalletMultiButton className="!bg-text-inverse !text-surface-base !rounded-full !h-20 !w-full !px-8 !font-black !text-xs !uppercase !tracking-[0.2em] hover:!opacity-90 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3" />
      <style jsx global>{`
        .onboarding-wallet-button-wrapper .wallet-adapter-button {
          justify-content: center !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
