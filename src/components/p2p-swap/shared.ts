import type { P2PSwapStep } from "@/hooks";

export type SwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

export const PCT_OPTIONS = [
  { labelKey: "25%", pct: 0.25 },
  { labelKey: "50%", pct: 0.5 },
  { labelKey: "75%", pct: 0.75 },
  { labelKey: "MAX", pct: 1 },
] as const;

export const PROGRESS_STEPS: { key: P2PSwapStep; labelKey: string }[] = [
  { key: "rango_preparing",   labelKey: "RANGO_PREPARING" },
  { key: "rango_approval",    labelKey: "APPROVING" },
  { key: "rango_swapping",    labelKey: "BRIDGING_TO_SOLANA" },
  { key: "rango_confirming",  labelKey: "CONFIRMING_BRIDGE" },
  { key: "jupiter_preparing", labelKey: "PREPARING_SWAP" },
  { key: "jupiter_swapping",  labelKey: "SWAPPING_TO_P2P" },
];

export const STEP_ORDER: P2PSwapStep[] = [
  "rango_preparing",
  "rango_approval",
  "rango_swapping",
  "rango_confirming",
  "jupiter_preparing",
  "jupiter_swapping",
  "completed",
  "failed",
];
