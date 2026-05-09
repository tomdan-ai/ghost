'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const pathname = usePathname();

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // Simulate ZK login / passwordless auth delay
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsLoggingIn(false);
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <nav className="border-b border-border bg-surface-base sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-bold text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
            Ghost Server
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className={`text-sm hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)] ${pathname === '/dashboard' ? 'text-text-inverse font-medium' : 'text-text-secondary'}`}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="rounded-xs border border-border bg-text-inverse text-surface-base hover:bg-surface-base hover:text-text-inverse transition-colors"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isLoggingIn ? 'Authenticating...' : 'Sign in with Google'}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/alice" className="hidden sm:flex text-sm text-text-secondary hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
                @alice
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-xs border-border text-text-secondary hover:text-text-inverse transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
