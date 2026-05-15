// Outbound bridge: P2PGovToken (ETH Sepolia) → SPL P2P (Solana devnet)

export const SOL_SEPOLIA = {
  // ETH Sepolia
  ETH_CHAIN_ID: 11155111,
  WORMHOLE_CHAIN_ID: 10002,
  TOKEN_BRIDGE: "0xDB5492265f6038831E89f495670FF909aDe94bd9" as `0x${string}`,
  REDEEMER_ADDRESS: "0x2424E5a0Ca29c3a92447e9f41439e304d9E3cbeF" as `0x${string}`,
  P2P_GOV_TOKEN: "0x2F9Dc6090dEA72aE35Ef74F9271F32fe45E93463" as `0x${string}`,
  // ETH Sepolia TB address padded to 64-char hex (Wormhole emitter)
  TB_EMITTER_HEX:
    "000000000000000000000000db5492265f6038831e89f495670ff909ade94bd9",
  // Solana devnet
  SOL_CORE_BRIDGE: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
  SOL_TOKEN_BRIDGE: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  SPL_P2P_MINT: "4LvLLGuF1aziTNgZUjYn2DiM7zKZ1GnAXkSSCNAA3GGA",
  RECEIVER_PROGRAM_ID: "BcGyU8jkPAcXaHcQLHUhKCBzKcAajiDQZUddEppmaHRJ",
  // API
  WORMHOLESCAN_API: "https://api.testnet.wormholescan.io",
  // Token decimals
  TOKEN_DECIMALS: 6,
} as const;

export const SOLANA_DEVNET_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const PENDING_OUTBOUND_KEY = "@P2PME:WORMHOLE_OUTBOUND_BRIDGES";
