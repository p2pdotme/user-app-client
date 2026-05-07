// Wormhole bridge: SPL P2P (Solana devnet) → P2PGovBase (Base Sepolia)

export const WORMHOLE = {
  // Solana devnet
  SPL_P2P_MINT: "4LvLLGuF1aziTNgZUjYn2DiM7zKZ1GnAXkSSCNAA3GGA",
  SENDER_PROGRAM_ID: "4uoJvmAaPA1G1AAzu7TSt36HWwShJbGHHfiJGfw5bwMK",
  SOL_CORE_BRIDGE: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
  SOL_TOKEN_BRIDGE: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  // Wormhole Token Bridge emitter PDA as 64-char hex
  TB_EMITTER_HEX:
    "3b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98",
  // Base Sepolia
  REDEEMER_ADDRESS:
    "0x2424E5a0Ca29c3a92447e9f41439e304d9E3cbeF" as `0x${string}`,
  P2P_GOV_BASE_TOKEN:
    "0x2F9Dc6090dEA72aE35Ef74F9271F32fe45E93463" as `0x${string}`,
  // Wormholescan testnet REST
  WORMHOLESCAN_API: "https://api.testnet.wormholescan.io",
  // Token decimals (both SPL P2P and P2PGovBase are 6 dec)
  SPL_DECIMALS: 6,
} as const;

export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

export const PENDING_BRIDGES_STORAGE_KEY = "@P2PME:WORMHOLE_PENDING_BRIDGES";
