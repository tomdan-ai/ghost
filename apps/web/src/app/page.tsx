import { ArrowRight, Zap, Globe, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Hero Section */}
      <section className="px-4 py-24 sm:py-32 lg:px-8 max-w-7xl mx-auto flex flex-col items-start justify-center min-h-[70vh]">
        <div className="max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-text-inverse">
            Ghost Wallet
          </h1>
          <p className="mt-4 text-lg text-text-secondary leading-tight">
            Universal Cross-Chain Stablecoin Identity Layer.
          </p>
          <p className="mt-3 text-base text-text-secondary max-w-2xl">
            Anyone can pay you from any chain, while you receive stablecoins on Solana. Built seamlessly with LI.FI routing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button size="lg" asChild className="rounded-xs border border-border">
              <Link href="#download">
                Deploy Node <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xs border-border text-text-inverse hover:bg-text-inverse hover:text-surface-base">
              <Link href="#how-it-works">Read Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-24 border-t border-border lg:px-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-lg sm:text-xl font-normal text-text-inverse tracking-tight">
            Why Ghost Wallet?
          </h2>
          <p className="mt-3 text-md text-text-secondary max-w-xl">
            The simplest way to receive cross-chain payments without the friction.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xs border border-border bg-surface-base hover:border-text-tertiary transition-colors">
            <CardHeader className="p-4">
              <Globe className="h-8 w-8 text-text-tertiary" />
              <CardTitle className="mt-4 text-base font-normal text-text-inverse">Cross-Chain</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                Accept payments from Ethereum, Polygon, Base, Arbitrum, and more via LI.FI routing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xs border border-border bg-surface-base hover:border-text-tertiary transition-colors">
            <CardHeader className="p-4">
              <Zap className="h-8 w-8 text-text-tertiary" />
              <CardTitle className="mt-4 text-base font-normal text-text-inverse">Instant Settlement</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                All payments automatically settle into pure USDC on Solana instantly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xs border border-border bg-surface-base hover:border-text-tertiary transition-colors">
            <CardHeader className="p-4">
              <Shield className="h-8 w-8 text-text-tertiary" />
              <CardTitle className="mt-4 text-base font-normal text-text-inverse">Secure Protocol</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                Non-custodial by design. Powered by Anchor and highly audited frameworks.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xs border border-border bg-surface-base hover:border-text-tertiary transition-colors">
            <CardHeader className="p-4">
              <Smartphone className="h-8 w-8 text-text-tertiary" />
              <CardTitle className="mt-4 text-base font-normal text-text-inverse">Mobile First</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                Built natively for the Solana Mobile Stack with a beautiful intuitive app.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-24 border-t border-border lg:px-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-lg sm:text-xl font-normal text-text-inverse tracking-tight">
            How It Works
          </h2>
          <p className="mt-3 text-md text-text-secondary max-w-xl">
            Get paid globally in three structured steps.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-xs bg-surface-base border-border">
            <CardHeader className="p-4">
              <div className="text-xl font-normal text-text-tertiary leading-[1]">1</div>
              <CardTitle className="mt-2 text-base font-normal text-text-inverse">Register Username</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                Choose your unique on-chain handle like @alice mapped specifically to your wallet.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xs bg-surface-base border-border">
            <CardHeader className="p-4">
              <div className="text-xl font-normal text-text-tertiary leading-[1]">2</div>
              <CardTitle className="mt-2 text-base font-normal text-text-inverse">Share Payment Link</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                Send your unique profile URL to anyone globally, regardless of their native chain.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xs bg-surface-base border-border">
            <CardHeader className="p-4">
              <div className="text-xl font-normal text-text-tertiary leading-[1]">3</div>
              <CardTitle className="mt-2 text-base font-normal text-text-inverse">Receive USDC</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm text-text-secondary">
                The protocol abstracts the bridging. You simply receive Solana stablecoins.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer / CTA section */}
      <section id="download" className="px-4 py-32 border-t border-border lg:px-8 bg-surface-base max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <h2 className="text-lg sm:text-xl font-normal text-text-inverse tracking-tight">
            Ready to deploy?
          </h2>
          <p className="mt-3 text-md text-text-secondary">
            Start receiving decentralized cross-chain payments immediately.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button size="lg" className="rounded-xs border border-border">
              Download Android APK
            </Button>
            <Button size="lg" variant="outline" className="rounded-xs border border-border text-text-inverse hover:bg-text-inverse hover:text-surface-base transition-colors">
              Access GitHub Repository
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 lg:px-8 bg-surface-base">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            © 2026 Ghost Wallet. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/docs" className="text-xs text-text-secondary hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
              Documentation
            </Link>
            <Link href="/about" className="text-xs text-text-secondary hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
              Protocol
            </Link>
            <Link href="https://github.com" className="text-xs text-text-secondary hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-tertiary)]">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
