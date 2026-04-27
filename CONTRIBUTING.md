# Contributing to P2P.me User App

Thank you for your interest in contributing. This document covers everything you need to get a working local environment, understand the project conventions, and submit a pull request.

---

## Table of Contents

- [Requirements](#requirements)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Requirements

| Tool | Version | Notes |
|---|---|---|
| [Bun](https://bun.sh) | >= 1.1 | **Required.** npm/yarn will not work — see below |
| Node.js | >= 20 | Used transitively by some build tools |

### Why Bun is required

`package.json` uses `patchedDependencies`, which is a Bun-specific feature. It automatically patches `@anon-aadhaar/core@2.4.3` at install time to fix TypeScript type errors in its internal buffer casts. If you run `npm install` or `yarn install`, the patch will not be applied and the build will fail with type errors.

The patch is at `patches/@anon-aadhaar%2Fcore@2.4.3.patch`. It adds `as unknown` casts to resolve incompatible `ArrayBuffer → Buffer` coercions in the upstream package.

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/p2pdotme/user-app-spa.git
cd user-app-spa

# 2. Install dependencies (Bun applies the anon-aadhaar patch automatically)
bun install

# 3. Copy the example env file and fill in your values
cp .env.example .env

# 4. Start the dev server
bun dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. The table below explains every variable.

### Required for local dev

| Variable | Description |
|---|---|
| `VITE_CHAIN` | Chain to connect to: `base`, `baseSepolia`, `polygonAmoy`, or `hardhat` |
| `VITE_HTTP_RPC_URL` | HTTP RPC endpoint (e.g. Alchemy, Infura, or a public URL) |
| `VITE_WS_RPC_URL` | WebSocket RPC endpoint — used for real-time event listening |
| `VITE_ENVIRONMENT` | Runtime label: `local`, `development`, `staging`, or `production` |
| `VITE_MAINTENANCE` | Set to `"true"` to redirect all users to the maintenance page |
| `VITE_CONTRACT_ADDRESS_DIAMOND` | Diamond proxy contract address |
| `VITE_CONTRACT_ADDRESS_USDC` | USDC token contract address |
| `VITE_CONTRACT_ADDRESS_REPUTATION_MANAGER` | Reputation manager contract address |
| `VITE_THIRDWEB_CLIENT_ID` | Thirdweb Client ID — required for wallet login. Get one at [thirdweb.com/dashboard](https://thirdweb.com/dashboard/settings/api-keys) |
| `VITE_THIRDWEB_CONTRACT_ADDRESS_AA_FACTORY` | EIP-4337 account abstraction factory address |
| `VITE_DYNAMIC_PROJECT_ID` | Dynamic Labs environment ID — required for external wallet connectors. Get one at [app.dynamic.xyz](https://app.dynamic.xyz) |
| `VITE_SUBGRAPH_URL` | The Graph endpoint for order history and circle routing |

> **Testnet defaults:** Base Sepolia contract addresses are pre-filled in `.env.example`. For RPC, you can use a free Alchemy app or a public Base Sepolia endpoint.

### Optional services

| Variable | Description |
|---|---|
| `VITE_PIX_PROXY_URL` | PIX proxy server URL — required only for BRL (Brazil) payments |
| `VITE_BUNDLER_PAYMASTER_URL` | EIP-4337 paymaster URL for gasless transactions (e.g. Coinbase CDP) |
| `VITE_RANGO_API_KEY` | Rango Exchange API key — enables cross-chain deposit/withdraw |
| `VITE_RANGO_REFERRER_CODE` | Your Rango referral code |
| `VITE_RANGO_REFERRER_ADDRESS` | Wallet address to receive 0.5% bridge referral fees. **Change this to your own address** — if left as the default it sends fees to the P2P.me wallet |
| `VITE_RECLAIM_APP_ID` | Reclaim Protocol app ID — enables ZK social verifications for transaction limits |
| `VITE_RECLAIM_APP_SECRET` | Reclaim Protocol app secret. **Never commit this.** Treat it as a private key |
| `VITE_ACTIVITY_LOG_API_URL` | Fraud detection API endpoint |
| `VITE_ACTIVITY_LOG_ENCRYPTION_KEY` | 32-byte hex AES-256 key for fraud payload encryption. **Never commit this** |
| `VITE_FRAUD_ENGINE_REGION` | SEON API region: `asia`, `eu`, or `us`. Defaults to `asia` |
| `VITE_AMPLITUDE_API_KEY` | Amplitude analytics key — analytics are disabled if absent |
| `VITE_FINGERPRINTJS_API_KEY` | FingerprintJS Pro key — device fingerprinting disabled if absent |
| `VITE_SENTRY_DSN` | Sentry DSN — error tracking disabled if absent |
| `VITE_SENTRY_ORG` | Your Sentry organization slug (used by build plugin) |
| `VITE_SENTRY_PROJECT` | Your Sentry project slug (used by build plugin) |
| `VITE_SUPABASE_URL` | Supabase edge function URL used as a Dynamic Labs API proxy |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for the above |

### Branding (for forks)

| Variable | Description |
|---|---|
| `VITE_APP_NAME` | App name shown in the PWA manifest and Thirdweb wallet modal |
| `VITE_APP_URL` | Your deployment domain — used for Sentry trace propagation and ToS links |
| `VITE_APP_FAVICON_URL` | Icon shown in the Thirdweb wallet modal |
| `VITE_TERMS_URL` | Terms of service URL |
| `VITE_PRIVACY_URL` | Privacy policy URL |

### CI-only (never put in `.env`)

| Variable | Description |
|---|---|
| `VITE_SENTRY_AUTH_TOKEN` | Sentry CI token used by `sentryVitePlugin` to upload source maps during `bun run build`. Set this in your CI environment secrets, never in a `.env` file |

---

## Project Structure

```
src/
├── core/
│   ├── adapters/thirdweb/     ← All smart contract calls via Thirdweb SDK
│   ├── p2pdotme/
│   │   ├── contracts/         ← ABIs and read/write contract functions
│   │   ├── subgraph/          ← GraphQL queries to The Graph
│   │   └── shared/            ← Zod schemas, error types, validation helpers
│   ├── rango/                 ← Cross-chain bridge integration (Rango Exchange)
│   ├── client/                ← LocalStorage-backed settings and address books
│   └── fees.ts                ← Fee calculation helpers
├── hooks/                     ← React hooks that consume core/
├── pages/                     ← Route-level page components
├── components/                ← Shared UI components (shadcn/ui base)
├── contexts/                  ← React context providers
├── lib/                       ← Analytics, Sentry, i18n, utilities, constants
└── assets/                    ← Inline SVG icons; CDN-hosted media (animations, audio, images)
```

### Key conventions

- **Error handling:** Uses [neverthrow](https://github.com/supermacro/neverthrow) `Result`/`ResultAsync` throughout `core/`. Never `throw` inside core functions — return typed errors instead.
- **Validation:** All external data (contract responses, subgraph responses, localStorage) is validated with [Zod](https://zod.dev) schemas defined in `core/p2pdotme/shared/validation.ts`.
- **State management:** No global state library. Server state is managed with [TanStack Query](https://tanstack.com/query); client state lives in React context or `localStorage` via `core/client/`.

### `contractVersion` field

`package.json` has a non-standard `"contractVersion"` field (e.g. `"0.0.5"`). This is embedded into the build by `vite.config.mts` as `import.meta.env.CONTRACT_VERSION` and displayed in the version badge. It must match the on-chain contract version returned by the Diamond contract. If you deploy updated contracts, bump this value to match.

---

## Development Workflow

```bash
bun dev          # Start dev server at http://localhost:5173
bun run build    # Production build (requires env vars)
bun run check    # Biome lint + format (auto-fix)
bun run lint     # Biome lint only
bun run format   # Biome format only
bun run i18n:sort # Sort i18n translation keys alphabetically
```

### Dev-only routes

The following routes are available in local development only and are guarded by `dev-route-guard.tsx`:

- `/dev` — dev tools overview
- `/dev/haptics` — haptic feedback testing
- `/dev/sounds` — sound system testing
- `/dev/animations` — animation testing
- `/dev/toasts` — toast notification testing

---

## Code Style

This project uses [Biome](https://biomejs.dev) for both formatting and linting (replacing Prettier + ESLint).

- **Formatter:** 2-space indent, 80-char line width, double quotes, LF line endings
- **Linter:** Biome recommended rules + `useSortedClasses` (Tailwind class ordering) as error

Run before committing:
```bash
bun run check   # lint + format with auto-fix
```

The pre-commit hook runs `biome check --write` on staged files automatically via `lint-staged`. The pre-push hook runs `biome check .` on the full project.

**Biome ignore comments** — use sparingly and only when necessary:
```ts
// biome-ignore lint/rule/name: reason
```

---

## Git Workflow

- **Base branch for PRs:** `dev` (not `main`)
- **Merge strategy:** squash merge into `dev`
- **Branch naming:** `feat/description`, `fix/description`, `chore/description`

### Commit message format

```
<type>: <short description>

<optional body>
```

Types: `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `perf` · `ci`

---

## Submitting a Pull Request

1. Fork the repository and create a branch from `dev`
2. Make your changes
3. Run `bun run check` — the PR will fail CI if there are Biome errors
4. Ensure `bunx tsc --noEmit` passes
5. Open a PR against the `dev` branch
6. Describe what you changed and why

For significant changes, open an issue first to discuss the approach.
