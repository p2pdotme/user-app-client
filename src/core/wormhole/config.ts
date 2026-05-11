// Explicit register() calls — side-effect imports alone are insufficient.
import { register as registerNttDefinitions } from "@wormhole-foundation/sdk-definitions-ntt";
import { register as registerEvmNtt } from "@wormhole-foundation/sdk-evm-ntt";
import { register as registerSolanaNtt } from "@wormhole-foundation/sdk-solana-ntt";

registerNttDefinitions();
registerEvmNtt();
registerSolanaNtt();


import { wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";
import type { Ntt } from "@wormhole-foundation/sdk-definitions-ntt";

// ── Network ───────────────────────────────────────────────────────────────────

export const WORMHOLE_NETWORK = "Mainnet" as const;

// ── Chain names ────────────────────────────────────────────────────────────────

export const SOLANA_CHAIN = "Solana" as const;
export const EVM_CHAIN = "Base" as const;

// ── NTT contract addresses ────────────────────────────────────────────────────

const NTT_CONTRACTS: Record<"Solana" | "Base", Ntt.Contracts> = {
  Solana: {
    token: "P2PXup1ZvMpCDkJn3PQxtBYgxeCSfH39SFeurGSmeta",
    manager: "Fek4JzENghS3mYpr8iwPBeT9dz4MnrYuhaGUfMGCBh2b",
    transceiver: { wormhole: "SdPQUvLZaZ9xnQBhzEzEFixcX5dMRKCJpyvdkf4HNiC" },
  },
  Base: {
    token: "0x75a8FF75a4f224947A6315b8dab5D5a81FE2f550",
    manager: "0xE44e87e2d1732472F8b5b949E17b30E08227b94f",
    transceiver: { wormhole: "0xf251a99791F60DDAa1C22f8259545394b3A51509" },
  },
};

export function getNttContracts(chain: "Solana" | "Base"): Ntt.Contracts {
  return NTT_CONTRACTS[chain];
}

// ── VAA poll timeout ──────────────────────────────────────────────────────────

/** How long to wait for the Wormhole guardian VAA (ms). Mainnet: Solana finality + guardian signing ~10-15 min. */
export const VAA_TIMEOUT_MS = 20 * 60 * 1000; // 20 min

// ── SDK factory ───────────────────────────────────────────────────────────────

/**
 * Creates and returns a configured Wormhole SDK instance.
 * Safe to call multiple times — each call returns a new instance.
 */
export function createWormhole() {
  const solanaRpc = import.meta.env.VITE_SOLANA_RPC_URL;
  const baseRpc = import.meta.env.VITE_HTTP_RPC_URL;

  return wormhole(WORMHOLE_NETWORK, [evm, solana], {
    chains: {
      Solana: solanaRpc ? { rpc: solanaRpc } : undefined,
      Base: baseRpc ? { rpc: baseRpc } : undefined,
    },
  });
}
