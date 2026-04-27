# P2P.me User App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

The user-facing web application for the [P2P.me](https://p2p.me) protocol — a decentralized P2P payment platform on Base L2 that lets users buy and sell USDC using local fiat currencies, and pay merchants by scanning any QR code.

**Live app:** https://app.p2p.me

---

## What It Does

- **Buy USDC** — send fiat (UPI, PIX, GoPay, bank transfer, etc.) and receive USDC in your wallet
- **Sell USDC** — receive fiat directly to your payment details
- **Scan & Pay** — scan any merchant QR code and pay with USDC; the merchant receives fiat
- **Cross-chain Deposit / Withdraw** — bridge in USDC or other tokens from Ethereum, Solana, Polygon, Arbitrum, Optimism, BSC, and HyperEVM via Rango Exchange
- **ZK Verifications** — increase transaction limits by verifying social accounts (GitHub, LinkedIn, Instagram) or Aadhaar using zero-knowledge proofs — no personal data is stored or shared

**Supported currencies:** INR · BRL · IDR · NGN · ARS · MXN · VEN · USD · EUR · COP

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Blockchain | Base L2 (EIP-4337 account abstraction — gasless) |
| Wallet / Auth | Thirdweb in-app wallet (email, phone, Google, passkey) |
| External Wallets | Dynamic Labs (MetaMask, Phantom, WalletConnect) |
| Contract Interaction | Thirdweb SDK + viem |
| Data Layer | The Graph (subgraph) — minimises RPC calls |
| Bridge | Rango Exchange |
| ZK Verifications | Reclaim Protocol · AnonAadhaar · ZKPassport |
| Error Handling | neverthrow (Result/ResultAsync — no thrown errors in core) |
| Validation | Zod |
| Analytics | Amplitude |
| Error Tracking | Sentry |
| Linter / Formatter | Biome |
| Package Manager | Bun |

---

## Architecture

```
src/
├── core/                      ← Pure protocol logic, no React
│   ├── adapters/thirdweb/     ← Smart contract calls via Thirdweb SDK
│   ├── p2pdotme/
│   │   ├── contracts/         ← ABIs + read/write functions
│   │   ├── subgraph/          ← GraphQL queries to The Graph
│   │   └── shared/            ← Zod schemas, error types, validation
│   ├── rango/                 ← Cross-chain bridge integration
│   └── client/                ← LocalStorage settings, address books
├── hooks/                     ← React hooks consuming core/
├── pages/                     ← Route-level components
├── components/                ← Shared UI components
├── contexts/                  ← React providers (Settings, PWA, Dynamic)
├── lib/                       ← Analytics, Sentry, i18n, utilities
└── assets/                    ← Inline SVG icons + CDN-hosted media
```

**Design principles:**
- All contract interactions go through `core/adapters/thirdweb/` — no raw Thirdweb/viem calls in pages or hooks
- `core/` functions return `Result`/`ResultAsync` (neverthrow) — never throw
- All external data is validated with Zod schemas before use
- Subgraph-first data fetching — direct RPC calls only where the subgraph can't provide the data

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.1 — **required** (npm/yarn will not work, see [CONTRIBUTING.md](CONTRIBUTING.md))

### Installation

```bash
git clone https://github.com/p2pdotme/user-app-spa.git
cd user-app-spa
bun install
```

### Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. See the [Environment Variables](#environment-variables) section below for details. For local development on testnet, the Base Sepolia contract addresses are pre-filled in `.env.example` — you mainly need an RPC URL and a Thirdweb Client ID.

### Run

```bash
bun dev        # Dev server at http://localhost:5173
bun run build  # Production build
bun run check  # Lint + format
```

---

## Environment Variables

Copy `.env.example` to `.env`. Every variable is documented in that file. The table below is a quick reference.

### Required

| Variable | Description | Get it at |
|---|---|---|
| `VITE_CHAIN` | `base` / `baseSepolia` / `polygonAmoy` / `hardhat` | — |
| `VITE_HTTP_RPC_URL` | HTTP RPC endpoint | [alchemy.com](https://alchemy.com) or any provider |
| `VITE_WS_RPC_URL` | WebSocket RPC endpoint | Same provider |
| `VITE_THIRDWEB_CLIENT_ID` | Thirdweb Client ID — wallet login | [thirdweb.com/dashboard](https://thirdweb.com/dashboard/settings/api-keys) |
| `VITE_DYNAMIC_PROJECT_ID` | Dynamic Labs environment ID — external wallets | [app.dynamic.xyz](https://app.dynamic.xyz) |
| `VITE_SUBGRAPH_URL` | The Graph endpoint for order history and routing | [thegraph.com/studio](https://thegraph.com/studio) |
| `VITE_CONTRACT_ADDRESS_DIAMOND` | Diamond proxy address | Pre-filled for Base Sepolia in `.env.example` |
| `VITE_CONTRACT_ADDRESS_USDC` | USDC token address | Pre-filled for Base Sepolia in `.env.example` |
| `VITE_CONTRACT_ADDRESS_REPUTATION_MANAGER` | Reputation manager address | Pre-filled for Base Sepolia in `.env.example` |
| `VITE_THIRDWEB_CONTRACT_ADDRESS_AA_FACTORY` | EIP-4337 factory address | Pre-filled in `.env.example` |

### Optional — enables specific features

| Variable | Feature | Description |
|---|---|---|
| `VITE_BUNDLER_PAYMASTER_URL` | Gasless transactions | EIP-4337 paymaster. Without it users pay gas. Get from [Coinbase CDP](https://portal.cdp.coinbase.com) |
| `VITE_PIX_PROXY_URL` | BRL payments | PIX QR proxy server — required only for Brazil |
| `VITE_RANGO_API_KEY` | Bridge | Cross-chain deposit/withdraw via Rango Exchange |
| `VITE_RANGO_REFERRER_ADDRESS` | Bridge fees | **Change to your own wallet** — receives 0.5% bridge referral fees |
| `VITE_RECLAIM_APP_ID` / `VITE_RECLAIM_APP_SECRET` | ZK verifications | Social account proofs for transaction limits |
| `VITE_ACTIVITY_LOG_API_URL` / `VITE_ACTIVITY_LOG_ENCRYPTION_KEY` | Fraud detection | SEON-based device fingerprinting |
| `VITE_FRAUD_ENGINE_REGION` | Fraud detection | SEON region: `asia`, `eu`, or `us` |
| `VITE_AMPLITUDE_API_KEY` | Analytics | Amplitude event tracking |
| `VITE_FINGERPRINTJS_API_KEY` | Device fingerprinting | FingerprintJS Pro |
| `VITE_SENTRY_DSN` | Error tracking | Sentry error and performance monitoring |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Dynamic proxy | Supabase edge function used as a Dynamic Labs API proxy |

### Branding (for forks)

| Variable | Description |
|---|---|
| `VITE_APP_NAME` | App name in PWA manifest and wallet modal |
| `VITE_APP_URL` | Your deployment domain (Sentry trace targets, ToS links) |
| `VITE_APP_FAVICON_URL` | Icon shown in Thirdweb wallet modal |
| `VITE_TERMS_URL` / `VITE_PRIVACY_URL` | Legal page links |

### CI-only — never put in `.env`

| Variable | Description |
|---|---|
| `VITE_SENTRY_AUTH_TOKEN` | Sentry token used by the build plugin to upload source maps. Set in CI secrets only |
| `VITE_SENTRY_ORG` / `VITE_SENTRY_PROJECT` | Your Sentry org and project slugs |

---

## Testnet Defaults (Base Sepolia)

The following are pre-filled in `.env.example` for local development:

| Contract | Address |
|---|---|
| Diamond | `0xce868398FDaDcA368EAc203222874D6888532aE2` |
| USDC | `0xDABa329Ed949f28F64019f22c33c3B253B2Ded60` |
| Reputation Manager | `0x45919D69E2154F46b6f6eA42ae23d2e9ee21B66f` |
| AA Factory | `0xde320c2e2b4953883f61774c006f9057a55b97d1` |

For testnet USDC and ETH: [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code style, branch conventions, and how to submit a pull request.

---

## License

[MIT](LICENSE) — Copyright (c) 2025 P2P.me
