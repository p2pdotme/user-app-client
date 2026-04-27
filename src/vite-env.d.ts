/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
import type { Address } from "viem";

interface ImportMetaEnv {
  readonly VITE_HTTP_RPC_URL: URL;
  readonly VITE_WS_RPC_URL: string;
  readonly VITE_MAINTENANCE: string;
  readonly VITE_CHAIN: string;
  readonly VITE_ENVIRONMENT: string;

  // thirdweb
  readonly VITE_THIRDWEB_CLIENT_ID: string;
  readonly VITE_THIRDWEB_CONTRACT_ADDRESS_AA_FACTORY: Address;

  // P2P.me protocol contracts
  readonly VITE_CONTRACT_ADDRESS_DIAMOND: Address;
  readonly VITE_CONTRACT_ADDRESS_USDC: Address;
  readonly VITE_CONTRACT_ADDRESS_REPUTATION_MANAGER: Address;

  // P2P.me subgraph
  readonly VITE_SUBGRAPH_URL: string;

  // PIX Proxy URL
  readonly VITE_PIX_PROXY_URL: string;

  // Bridge
  readonly VITE_DYNAMIC_PROJECT_ID: string;
  readonly VITE_RANGO_API_KEY: string;
  readonly VITE_RANGO_REFERRER_CODE: string;

  // Analytics
  readonly VITE_AMPLITUDE_API_KEY: string;

  // Sentry
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_AUTH_TOKEN: string;

  // Reclaim
  readonly VITE_RECLAIM_APP_ID: string;
  readonly VITE_RECLAIM_APP_SECRET: string;

  // Activity Log / Fraud Engine
  readonly VITE_ACTIVITY_LOG_API_URL: string;
  readonly VITE_ACTIVITY_LOG_ENCRYPTION_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
