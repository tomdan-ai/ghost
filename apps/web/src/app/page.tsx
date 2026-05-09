import React from 'react';

export default function Home() {
    return (
        <div className="bg-[#F5F5E8] text-[#1c1b1b] font-body-md selection:bg-[#e5e2e1] selection:text-[#000000] min-h-screen relative">
            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .editorial-grid {
                    background-image: linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px);
                    background-size: 100% 100%;
                }
                .font-body-md { font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 1.6; }
                .font-label-sm { font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; line-height: 1.2; }
                .font-mono-label { font-family: 'Geist', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; line-height: 1.0; }
                .font-headline-lg { font-family: 'Hanken Grotesk', sans-serif; font-size: 48px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.1; }
                .font-display-xl { font-family: 'Hanken Grotesk', sans-serif; font-size: 80px; font-weight: 900; letter-spacing: -0.04em; line-height: 1.0; }
                .text-headline-lg-mobile { font-size: 32px; letter-spacing: -0.02em; line-height: 1.1; }
                
                @media (min-width: 768px) {
                    .md\\:text-headline-lg { font-size: 48px; letter-spacing: -0.02em; line-height: 1.1; }
                }

                .border-border-weight { border-width: 2px; }
                .px-margin-mobile { padding-left: 16px; padding-right: 16px; }
                .px-margin-desktop { padding-left: 48px; padding-right: 48px; }
                
                .crosshair::before, .crosshair::after {
                    content: '+';
                    position: absolute;
                    font-family: 'Geist';
                    font-size: 14px;
                    color: #000;
                    font-weight: 400;
                }
            `}</style>
            
            <nav className="sticky top-0 z-50 bg-[#F5F5E8] border-b-2 border-[#000000] w-full px-4 md:px-12 py-4 flex justify-between items-center">
                <div className="flex items-center gap-12">
                    <span className="font-headline-lg font-black text-[#000000] uppercase tracking-tighter">GHOST</span>
                    <div className="hidden md:flex gap-8">
                        <a className="text-[#444748] hover:opacity-80 transition-opacity font-label-sm uppercase" href="#">HOW GHOST WORKS</a>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className="material-symbols-outlined text-[#000000] cursor-pointer hover:opacity-80">account_balance_wallet</span>
                    <span className="material-symbols-outlined text-[#000000] cursor-pointer hover:opacity-80">settings</span>
                </div>
            </nav>

            <main className="relative px-4 md:px-12 pt-16 pb-32 overflow-hidden">
                <div className="absolute top-8 left-8 font-mono-label opacity-40">+</div>
                <div className="absolute top-8 right-8 font-mono-label opacity-40">+</div>

                <section className="max-w-6xl mx-auto flex flex-col items-start gap-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#000000] rounded-full bg-white">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="font-label-sm uppercase">GHOST IS LIVE ON SOLANA</span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="font-display-xl uppercase max-w-4xl tracking-tighter">
                            GET PAID FROM <br/> ANY CHAIN.
                        </h1>
                        <h2 className="font-display-xl uppercase text-[#5f5e5e] opacity-40 tracking-tighter">
                            RECEIVE ON SOLANA.
                        </h2>
                    </div>

                    <p className="font-body-md max-w-lg mt-4">
                        Your username. Any token. Any chain. Always USDC on Solana. Ghost handles the bridging and swapping instantly so you don't have to.
                    </p>

                    <button className="mt-8 group relative px-10 py-5 bg-[#000000] text-[#ffffff] rounded-full font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase transition-all active:scale-95 border-2 border-[#000000] overflow-hidden">
                        <span className="flex items-center gap-4 text-nowrap whitespace-nowrap">
                            <span className="w-4 h-4 rounded-full bg-[#ffffff] animate-ping"></span>
                            [ GET YOUR @USERNAME ]
                        </span>
                    </button>
                </section>

                <div className="absolute top-[20%] right-[10%] w-48 h-48 pointer-events-none transform rotate-12 md:block hidden">
                    <img alt="GHOST STICKERS" className="w-full h-full object-contain" src="/ghost_stickers.png"/>
                </div>
                <div className="absolute top-[60%] left-[5%] w-32 h-32 pointer-events-none transform -rotate-12 opacity-80 md:block hidden">
                    <img alt="GHOST STICKERS" className="w-full h-full object-contain filter grayscale brightness-125" src="/ghost_stickers.png"/>
                </div>

                <div className="w-full h-[1px] bg-[#000000] opacity-20 my-24 relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 font-mono-label bg-[#F5F5E8] px-4">01 // CORE INFRASTRUCTURE</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto translate-y-12">
                    <div className="bg-[#000000] text-[#ffffff] p-8 rounded-[32px] border-2 border-[#000000] flex flex-col gap-12 transition-transform hover:-translate-y-4">
                        <div className="flex justify-between items-start">
                            <span className="font-mono-label text-[#858383]">01 / ID</span>
                            <span className="material-symbols-outlined text-4xl">alternate_email</span>
                        </div>
                        <div>
                            <h3 className="font-headline-lg text-headline-lg-mobile uppercase mb-2">Username</h3>
                            <p className="font-body-md text-[#858383] opacity-80">Claim your unique on-chain handle. Forget long complex public keys.</p>
                        </div>
                    </div>
                    
                    <div className="bg-[#000000] text-[#ffffff] p-8 rounded-[32px] border-2 border-[#000000] flex flex-col gap-12 transition-transform hover:-translate-y-4">
                        <div className="flex justify-between items-start">
                            <span className="font-mono-label text-[#858383]">02 / BRIDGE</span>
                            <span className="material-symbols-outlined text-4xl">conversion_path</span>
                        </div>
                        <div>
                            <h3 className="font-headline-lg text-headline-lg-mobile uppercase mb-2">Cross-Chain</h3>
                            <p className="font-body-md text-[#858383] opacity-80">Ghost intercepts funds from 12+ chains and routes them home to Solana.</p>
                        </div>
                    </div>
                    
                    <div className="bg-[#000000] text-[#ffffff] p-8 rounded-[32px] border-2 border-[#000000] flex flex-col gap-12 transition-transform hover:-translate-y-4">
                        <div className="flex justify-between items-start">
                            <span className="font-mono-label text-[#858383]">03 / VELOCITY</span>
                            <span className="material-symbols-outlined text-4xl">bolt</span>
                        </div>
                        <div>
                            <h3 className="font-headline-lg text-headline-lg-mobile uppercase mb-2">Instant</h3>
                            <p className="font-body-md text-[#858383] opacity-80">Settlement happens in seconds, not hours. Real-time liquidity access.</p>
                        </div>
                    </div>

                    <div className="bg-[#000000] text-[#ffffff] p-8 rounded-[32px] border-2 border-[#000000] flex flex-col gap-12 transition-transform hover:-translate-y-4">
                        <div className="flex justify-between items-start">
                            <span className="font-mono-label text-[#858383]">04 / AUDIT</span>
                            <span className="material-symbols-outlined text-4xl">history</span>
                        </div>
                        <div>
                            <h3 className="font-headline-lg text-headline-lg-mobile uppercase mb-2">History</h3>
                            <p className="font-body-md text-[#858383] opacity-80">Full transparency. Track every receipt and conversion on our ledger.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full border-t-2 border-[#000000] bg-[#F5F5E8] py-12 px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute left-8 bottom-4 font-mono-label opacity-20 text-[6rem] pointer-events-none select-none">GHOST</div>
                <div className="flex flex-col gap-2 relative z-10">
                    <span className="font-headline-lg text-[48px] text-[#000000] font-black uppercase">GHOST</span>
                    <p className="font-mono-label uppercase text-[#5f5e5e]">© 2024 GHOST PROTOCOL. NE-EDITORIAL CRYPTO.</p>
                </div>
                <div className="flex gap-12 relative z-10 hidden sm:flex">
                    <div className="flex flex-col gap-2">
                        <p className="font-label-sm text-[#000000]">RESOURCES</p>
                        <a className="font-mono-label text-[#5f5e5e] hover:text-[#000000] transition-colors" href="#">Whitepaper</a>
                        <a className="font-mono-label text-[#5f5e5e] hover:text-[#000000] transition-colors" href="#">Audit</a>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-label-sm text-[#000000]">LEGAL</p>
                        <a className="font-mono-label text-[#5f5e5e] hover:text-[#000000] transition-colors" href="#">Privacy</a>
                        <a className="font-mono-label text-[#5f5e5e] hover:text-[#000000] transition-colors" href="#">Terms</a>
                    </div>
                </div>
            </footer>

            <div className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center bg-white border-t-2 border-[#000000] px-4 pb-safe z-[60]">
                <button className="flex flex-col items-center justify-center bg-[#000000] text-[#ffffff] rounded-full px-6 py-1 active:scale-90 transition-transform">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="font-label-sm uppercase mt-1">Wallet</span>
                </button>
                <button className="flex flex-col items-center justify-center text-[#444748] hover:bg-[#ebe7e6] transition-colors active:scale-90 px-4 py-1">
                    <span className="material-symbols-outlined">swap_horiz</span>
                    <span className="font-label-sm uppercase mt-1">Swap</span>
                </button>
                <button className="flex flex-col items-center justify-center text-[#444748] hover:bg-[#ebe7e6] transition-colors active:scale-90 px-4 py-1">
                    <span className="material-symbols-outlined">history</span>
                    <span className="font-label-sm uppercase mt-1">History</span>
                </button>
                <button className="flex flex-col items-center justify-center text-[#444748] hover:bg-[#ebe7e6] transition-colors active:scale-90 px-4 py-1">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-label-sm uppercase mt-1">Profile</span>
                </button>
            </div>
        </div>
    );
}
