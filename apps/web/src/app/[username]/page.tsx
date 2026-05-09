'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface-base flex items-center justify-center p-4">
      <div className="border border-border bg-surface-base p-8 max-w-md w-full text-center rounded-xs">
        <div className="w-24 h-24 bg-text-inverse rounded-full mx-auto mb-4 flex items-center justify-center text-surface-base text-xl font-normal">
          {username?.[0]?.toUpperCase() || 'G'}
        </div>

        <h1 className="text-xl sm:text-2xl font-normal text-text-inverse mb-2 tracking-tight">
          @{username}
        </h1>
        <p className="text-base text-text-secondary mb-8">Ghost Wallet User</p>

        <Button asChild size="lg" className="w-full rounded-xs bg-text-inverse text-surface-base hover:bg-[var(--text-tertiary)] hover:text-text-inverse border border-transparent transition-colors">
          <Link href={`/pay/${username}`}>
            Send Payment
          </Link>
        </Button>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-text-secondary">
            Accepts payments natively from any EVM chain or Solana.
          </p>
        </div>
      </div>
    </div>
  );
}
