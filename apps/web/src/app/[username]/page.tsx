'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <div className="min-h-screen bg-[#F5F5E8] flex items-center justify-center p-4">
      <div className="border-2 border-[#000000] bg-[#F5F5E8] p-8 max-w-md w-full text-center rounded-2xl">
        <div className="w-24 h-24 bg-[#000000] rounded-full mx-auto mb-4 flex items-center justify-center text-[#F5F5E8] text-3xl font-black">
          {username?.[0]?.toUpperCase() || 'G'}
        </div>

        <h1 className="text-2xl font-black text-[#000000] mb-2 tracking-tighter uppercase">
          @{username}
        </h1>
        <p className="text-sm text-[#5f5e5e] mb-8 uppercase font-bold tracking-widest">Ghost Wallet User</p>

        <Button asChild size="lg" className="w-full rounded-full bg-[#000000] text-[#F5F5E8] hover:opacity-90 border-2 border-[#000000] transition-all font-black uppercase tracking-widest active:scale-95">
          <Link href={`/pay/${username}`}>
            Send Payment
          </Link>
        </Button>

        <div className="mt-8 pt-6 border-t-2 border-[#000000]/10">
          <p className="text-sm text-[#5f5e5e]">
            Accepts payments natively from any EVM chain or Solana.
          </p>
        </div>
      </div>
    </div>
  );
}
