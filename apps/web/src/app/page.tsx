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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Ghost Wallet
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-300 sm:text-2xl">
            Universal Cross-Chain Stablecoin Identity Layer
          </p>
          <p className="mt-4 text-lg text-gray-400">
            Anyone can pay you from any chain, while you receive stablecoins on
            Solana.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="#download">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Ghost Wallet?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The simplest way to receive cross-chain payments
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Cross-Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Accept payments from Ethereum, Polygon, Base, Arbitrum, and
                  more
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Instant Settlement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All payments automatically settle to USDC on Solana
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Non-custodial. Your keys, your crypto. Always.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Mobile First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Beautiful mobile app designed for everyday use
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get paid in three simple steps
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <CardTitle className="mt-4">Register Username</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Choose your unique username like @alice and connect your
                  Solana wallet
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <CardTitle className="mt-4">Share Payment Link</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your link ghost.app/pay/alice with anyone, anywhere
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <CardTitle className="mt-4">Receive Stablecoins</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get paid in USDC on Solana, no matter what chain they send
                  from
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="download"
        className="bg-gradient-to-br from-purple-900 to-indigo-900 px-6 py-24 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Download Ghost Wallet and start receiving cross-chain payments today
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" variant="secondary">
              Download for Android
            </Button>
            <Button size="lg" variant="outline" className="text-white">
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 Ghost Wallet. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Docs
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="https://github.com"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
