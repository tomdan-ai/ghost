# **Ghost Wallet — Technical Architecture Documentation**

# **Overview**

## **Ghost**

### **Universal Cross-Chain Stablecoin Identity Layer**

Ghost enables users to:

* receive payments through usernames  
* accept payments from multiple chains  
* settle into Solana automatically  
* use mobile-first crypto UX

Core idea:

“Anyone can pay you from any chain, while you receive stablecoins on Solana.”

---

# **High-Level Architecture**

ghost/  
├── apps/  
│   ├── mobile/        \# React Native APK  
│   ├── web/           \# Marketing \+ payment pages  
│   └── api/           \# Express backend  
│  
├── blockchain/  
│   └── contracts/     \# Solana smart contracts (Rust \+ Anchor)  
│  
├── packages/  
│   ├── shared-types/  
│   ├── ui/  
│   └── sdk/  
│  
├── infrastructure/  
│   ├── docker/  
│   └── scripts/  
│  
├── docs/  
│  
├── package.json  
├── turbo.json  
└── README.md

---

# **Monorepo Strategy**

Use:

* Turborepo  
* pnpm workspaces

Why:

* shared types  
* shared SDKs  
* unified builds  
* cleaner scaling

---

# **Tech Stack**

| Layer | Technology |
| ----- | ----- |
| Mobile App | React Native \+ Expo |
| Web App | Next.js |
| Backend API | Node.js \+ Express |
| Blockchain | Solana \+ Rust \+ Anchor |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Wallet-based auth |
| Cross-chain | LI.FI SDK |
| Mobile Wallet | Solana Mobile Wallet Adapter |
| State | Zustand |
| Realtime | Socket.IO |
| Storage | Cloudflare R2 |
| Deployment | Railway/Vercel |
| CI/CD | GitHub Actions |

---

# **Apps**

# **1\. Mobile App**

## **Path**

apps/mobile

---

# **Mobile Stack**

| Tool | Purpose |
| ----- | ----- |
| React Native | Mobile framework |
| Expo | Faster development |
| Expo Router | Navigation |
| TypeScript | Type safety |
| Solana Mobile Stack | Wallet integration |
| Zustand | Global state |
| Axios | API calls |
| React Query | Server state |
| Wallet Adapter | Solana wallets |

---

# **Mobile Features**

# **Authentication**

* Wallet connect  
* Create/import wallet  
* Session persistence

---

# **Username System**

Users can:

* register usernames  
* search usernames  
* share usernames

Examples:

ghost.app/tom  
ghost.app/pay/tom

---

# **Payment Features**

Users can:

* receive stablecoins  
* generate payment requests  
* create QR codes  
* track payment history

---

# **Cross-Chain Features**

Sender can pay from:

* Ethereum  
* Base  
* Polygon  
* Arbitrum  
* Solana

Receiver gets:

* Solana USDC

Powered by:

* LI.FI SDK

---

# **Wallet Features**

* transaction history  
* balances  
* token management  
* swap preview  
* gas estimation

---

# **Realtime Features**

* live payment status  
* bridge progress tracking  
* notifications

---

# **Mobile APK Features**

# **APK Requirements**

Required for Solana Mobile Track:

* Android APK build  
* Native mobile UX  
* Solana Mobile Wallet Adapter  
* Solana integration

---

# **Native Mobile Features**

## **Push Notifications**

Notify:

* payment received  
* bridge completed  
* failed transactions

---

## **Deep Linking**

Examples:

ghost://pay/tom/25  
ghost://claim/payment-id

---

## **QR Scanner**

Used for:

* wallet payments  
* username scans

---

## **Share Integration**

Share:

* payment links  
* QR codes  
* invoices

---

## **Secure Storage**

Use:

* Expo Secure Store

Store:

* auth tokens  
* encrypted session data

---

# **Mobile Folder Structure**

apps/mobile/  
├── app/  
├── components/  
├── features/  
├── services/  
├── hooks/  
├── stores/  
├── lib/  
├── assets/  
├── constants/  
├── providers/  
├── types/  
└── utils/

---

# **2\. Web App**

## **Path**

apps/web

---

# **Web Stack**

| Tool | Purpose |
| ----- | ----- |
| Next.js | SSR frontend |
| TailwindCSS | Styling |
| React Query | Data fetching |
| Zustand | State management |

---

# **Web Responsibilities**

# **Marketing Site**

Pages:

* landing page  
* docs  
* pricing (future)  
* waitlist

---

# **Payment Pages**

Examples:

ghost.app/pay/tom  
ghost.app/pay/tom/25

---

# **Public Profiles**

Examples:

ghost.app/tom

---

# **Web Features**

* payment UI  
* wallet connect  
* bridge selection  
* transaction progress  
* QR generation

---

# **Web Folder Structure**

apps/web/  
├── app/  
├── components/  
├── features/  
├── lib/  
├── hooks/  
├── providers/  
├── styles/  
└── types/

---

# **3\. Backend API**

## **Path**

apps/api

---

# **API Stack**

| Tool | Purpose |
| ----- | ----- |
| Node.js | Runtime |
| Express.js | API framework |
| Prisma | ORM |
| PostgreSQL | Database |
| Redis | Caching |
| Socket.IO | Realtime |
| JWT | Auth |
| BullMQ | Queues |

---

# **API Responsibilities**

# **User System**

* wallet auth  
* session management  
* username resolution

---

# **Payment System**

* create payment intents  
* validate routes  
* monitor transactions

---

# **LI.FI Integration**

* route discovery  
* quote fetching  
* bridge execution  
* swap estimation

---

# **Realtime Events**

Emit:

* payment started  
* route updated  
* completed  
* failed

---

# **Indexing**

Track:

* balances  
* payments  
* transaction history

---

# **API Folder Structure**

apps/api/  
├── src/  
│   ├── modules/  
│   ├── routes/  
│   ├── middleware/  
│   ├── services/  
│   ├── jobs/  
│   ├── websocket/  
│   ├── prisma/  
│   ├── config/  
│   ├── utils/  
│   └── types/  
├── prisma/  
└── tests/

---

# **Blockchain Layer**

# **Path**

blockchain/contracts

---

# **Blockchain Stack**

| Tool | Purpose |
| ----- | ----- |
| Rust | Smart contract language |
| Anchor | Solana framework |
| Solana CLI | Deployment |
| SPL Token | Token handling |

---

# **Smart Contracts**

Keep contracts SMALL.

---

# **Primary Contract**

## **Ghost Registry Contract**

Responsibilities:

* username ownership  
* wallet mapping  
* payment references  
* claim verification

---

# **Optional Contracts**

## **Escrow Contract**

Used for:

* claimable payment links  
* delayed settlements

---

# **Contract Structure**

blockchain/contracts/  
├── programs/  
│   └── ghost\_registry/  
├── tests/  
├── migrations/  
└── Anchor.toml

---

# **Database Schema**

# **Core Tables**

## **users**

id  
wallet\_address  
username  
created\_at

---

## **payment\_requests**

id  
sender\_wallet  
receiver\_wallet  
amount  
source\_chain  
destination\_chain  
status  
tx\_hash  
created\_at

---

## **username\_registry**

id  
username  
wallet\_address  
created\_at

---

## **transactions**

id  
payment\_request\_id  
source\_tx  
destination\_tx  
status  
created\_at

---

# **Authentication Flow**

# **Wallet Authentication**

1. Client requests nonce  
2. Backend returns nonce  
3. User signs nonce  
4. Backend verifies signature  
5. JWT issued

---

# **Cross-Chain Flow**

# **Payment Lifecycle**

## **Step 1**

Sender opens:

ghost.app/pay/tom

---

## **Step 2**

Sender selects:

* source chain  
* token  
* amount

---

## **Step 3**

Backend requests LI.FI route

---

## **Step 4**

Sender signs transaction

---

## **Step 5**

LI.FI executes bridge/swap

---

## **Step 6**

Funds arrive on Solana

---

## **Step 7**

Receiver notified in realtime

---

# **Solana Mobile Integration**

# **Required SDKs**

Install:

* Mobile Wallet Adapter  
* Solana Web3.js

---

# **Features**

* wallet authorization  
* transaction signing  
* deep link wallet sessions

---

# **Environment Variables**

# **API**

DATABASE\_URL=  
JWT\_SECRET=  
REDIS\_URL=  
LIFI\_API\_KEY=  
RPC\_URL=  
SOLANA\_RPC\_URL=

---

# **Mobile**

EXPO\_PUBLIC\_API\_URL=  
EXPO\_PUBLIC\_SOLANA\_RPC=

---

# **Web**

NEXT\_PUBLIC\_API\_URL=  
NEXT\_PUBLIC\_SOLANA\_RPC=

---

# **Setup Guide**

# **1\. Clone Repo**

git clone https://github.com/ghost-wallet/ghost.git  
cd ghost

---

# **2\. Install Dependencies**

pnpm install

---

# **3\. Setup Database**

cd apps/api

pnpm prisma migrate dev

---

# **4\. Start API**

pnpm dev

---

# **5\. Start Web**

cd apps/web

pnpm dev

---

# **6\. Start Mobile**

cd apps/mobile

npx expo start

---

# **7\. Start Solana Validator**

solana-test-validator

---

# **8\. Deploy Contracts**

anchor build  
anchor deploy

---

# **CI/CD**

# **GitHub Actions**

Pipelines:

* lint  
* tests  
* builds  
* contract checks

---

# **Deployment Targets**

| Service | Platform |
| ----- | ----- |
| API | Railway |
| Web | Vercel |
| Database | Neon |
| Redis | Upstash |
| Mobile | Expo EAS |
| Solana | Devnet |

---

# **Security Considerations**

# **Critical**

* nonce replay protection  
* transaction verification  
* wallet signature validation  
* rate limiting  
* bridge validation  
* secure session handling

---

# **Future Features**

Do NOT build now.

Mention only:

* WhatsApp integration  
* merchant checkout  
* NFC payments  
* virtual USD accounts  
* recurring invoices  
* debit cards

---

# **MVP Scope**

# **MUST BUILD**

✅ Username registry  
✅ Payment links  
✅ Cross-chain LI.FI routing  
✅ Solana settlement  
✅ Mobile APK  
✅ Wallet auth  
✅ Transaction tracking

---

# **DO NOT BUILD**

❌ Governance  
❌ NFT marketplace  
❌ Token launch  
❌ DAO  
❌ Complex DeFi protocol  
❌ Social network

