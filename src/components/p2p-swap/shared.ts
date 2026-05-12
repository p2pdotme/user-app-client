import type { P2PSwapStep } from "@/hooks";

export type SwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

export const PCT_OPTIONS = [
  { labelKey: "25%", pct: 0.25 },
  { labelKey: "50%", pct: 0.5 },
  { labelKey: "75%", pct: 0.75 },
  { labelKey: "MAX", pct: 1 },
] as const;

// ── Common step definitions ───────────────────────────────────────────────────

const STEP_RANGO_PREPARING = {
  key: "rango_preparing" as P2PSwapStep,
  labelKey: "RANGO_PREPARING",
};
const STEP_RANGO_APPROVAL = {
  key: "rango_approval" as P2PSwapStep,
  labelKey: "APPROVING",
};
const STEP_RANGO_CONFIRMING = {
  key: "rango_confirming" as P2PSwapStep,
  labelKey: "CONFIRMING_BRIDGE",
};
const STEP_JUPITER_PREPARING = {
  key: "jupiter_preparing" as P2PSwapStep,
  labelKey: "PREPARING_SWAP",
};

// ── Direction-specific steps ──────────────────────────────────────────────────

const STEP_RANGO_SWAPPING_USDC_TO_P2P = {
  key: "rango_swapping" as P2PSwapStep,
  labelKey: "BRIDGING_TO_SOLANA",
};
const STEP_RANGO_SWAPPING_P2P_TO_USDC = {
  key: "rango_swapping" as P2PSwapStep,
  labelKey: "BRIDGING_TO_BASE",
};
const STEP_JUPITER_SWAPPING_USDC_TO_P2P = {
  key: "jupiter_swapping" as P2PSwapStep,
  labelKey: "SWAPPING_TO_P2P",
};
const STEP_JUPITER_SWAPPING_P2P_TO_USDC = {
  key: "jupiter_swapping" as P2PSwapStep,
  labelKey: "SWAPPING_TO_USDC",
};

// ── Progress steps per direction ──────────────────────────────────────────────

const STEP_WORMHOLE_LOCKING_SOL   = { key: "wormhole_locking"   as P2PSwapStep, labelKey: "LOCKING_P2P_ON_SOLANA" };
const STEP_WORMHOLE_VAA_SOL        = { key: "wormhole_vaa"        as P2PSwapStep, labelKey: "AWAITING_WORMHOLE_VAA" };
const STEP_WORMHOLE_REDEEMING_SOL  = { key: "wormhole_redeeming"  as P2PSwapStep, labelKey: "MINTING_P2P_ON_BASE" };

export const PROGRESS_STEPS_USDC_TO_P2P = [
  STEP_RANGO_PREPARING,
  STEP_RANGO_APPROVAL,
  STEP_RANGO_SWAPPING_USDC_TO_P2P,
  STEP_RANGO_CONFIRMING,
  STEP_JUPITER_PREPARING,
  STEP_JUPITER_SWAPPING_USDC_TO_P2P,
  STEP_WORMHOLE_LOCKING_SOL,
  STEP_WORMHOLE_VAA_SOL,
  STEP_WORMHOLE_REDEEMING_SOL,
];

const STEP_WORMHOLE_LOCKING   = { key: "wormhole_locking"   as P2PSwapStep, labelKey: "BURNING_P2P_ON_BASE" };
const STEP_WORMHOLE_VAA        = { key: "wormhole_vaa"        as P2PSwapStep, labelKey: "AWAITING_WORMHOLE_VAA" };
const STEP_WORMHOLE_REDEEMING  = { key: "wormhole_redeeming"  as P2PSwapStep, labelKey: "RELEASING_P2P_ON_SOLANA" };

export const PROGRESS_STEPS_P2P_TO_USDC = [
  STEP_WORMHOLE_LOCKING,
  STEP_WORMHOLE_VAA,
  STEP_WORMHOLE_REDEEMING,
  STEP_JUPITER_PREPARING,
  STEP_JUPITER_SWAPPING_P2P_TO_USDC,
  STEP_RANGO_PREPARING,
  STEP_RANGO_APPROVAL,
  STEP_RANGO_SWAPPING_P2P_TO_USDC,
  STEP_RANGO_CONFIRMING,
];

// ── Step order per direction ──────────────────────────────────────────────────

export const STEP_ORDER_USDC_TO_P2P: P2PSwapStep[] = [
  "rango_preparing",
  "rango_approval",
  "rango_swapping",
  "rango_confirming",
  "jupiter_preparing",
  "jupiter_swapping",
  "wormhole_locking",
  "wormhole_vaa",
  "wormhole_redeeming",
  "completed",
  "failed",
];

export const STEP_ORDER_P2P_TO_USDC: P2PSwapStep[] = [
  "wormhole_locking",
  "wormhole_vaa",
  "wormhole_redeeming",
  "jupiter_preparing",
  "jupiter_swapping",
  "rango_preparing",
  "rango_approval",
  "rango_swapping",
  "rango_confirming",
  "completed",
  "failed",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getProgressSteps(direction: SwapDirection) {
  return direction === "USDC_TO_P2P"
    ? PROGRESS_STEPS_USDC_TO_P2P
    : PROGRESS_STEPS_P2P_TO_USDC;
}

export function getStepOrder(direction: SwapDirection) {
  return direction === "USDC_TO_P2P"
    ? STEP_ORDER_USDC_TO_P2P
    : STEP_ORDER_P2P_TO_USDC;
}
