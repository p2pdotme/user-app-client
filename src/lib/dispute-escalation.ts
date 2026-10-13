/**
 * Pure model of a raised dispute's escalation state, mirroring
 * OrderProcessorFacet (contracts-v4): a dispute starts at tier 1 (circle),
 * can be appealed to tier 2 (country admin) and tier 3 (ops lead, final).
 * A tier-1/2 decision executes after its appeal window unless a party
 * appeals it; an undecided tier can be escalated once its decision SLA lapses.
 */

export const DISPUTE_FAULT_TYPES = [
  "DEFAULT",
  "USER",
  "MERCHANT",
  "BANK",
] as const;
export type DisputeFaultType = (typeof DISPUTE_FAULT_TYPES)[number];

export type DisputeTier = 1 | 2 | 3;
export const FINAL_DISPUTE_TIER: DisputeTier = 3;

export const DISPUTE_TIER_LABEL_KEYS: Record<DisputeTier, string> = {
  1: "DISPUTE_TIER_1",
  2: "DISPUTE_TIER_2",
  3: "DISPUTE_TIER_3",
};

export interface DisputeDecision {
  faultType: DisputeFaultType;
  decisionTier: DisputeTier;
  decidedBy: string;
  /** unix seconds */
  decidedAt: number;
  /** unix seconds — end of the appeal window */
  appealableUntil: number;
}

export interface DisputeEscalation {
  tier: DisputeTier;
  /** unix seconds — when the dispute entered `tier` */
  tierSince: number;
  /** unix seconds — when an undecided dispute may be escalated (0 if n/a) */
  appealableAt: number;
  decision: DisputeDecision | null;
}

export type DisputeEscalationPhase =
  /** undecided, SLA not yet lapsed — nothing to do */
  | "awaiting-decision"
  /** undecided, SLA lapsed — party may escalate one tier up */
  | "escalatable"
  /** a tier-1/2 decision is recorded and still open to challenge */
  | "decision-pending"
  /** decision recorded, appeal window closed — anyone may finalize */
  | "finalizable"
  /** undecided at the final tier — only the operator can settle */
  | "final-review";

export interface DisputeEscalationView {
  phase: DisputeEscalationPhase;
  canAppeal: boolean;
  canFinalize: boolean;
  /** tier the dispute moves to on appeal (undefined when it cannot) */
  nextTier?: DisputeTier;
  /** unix seconds the current phase ends (undefined when open-ended) */
  deadline?: number;
  /** true when the recorded decision favours the order's user */
  decisionFavoursUser?: boolean;
}

const toTier = (raw: number): DisputeTier => (raw <= 1 ? 1 : raw >= 3 ? 3 : 2);

const toFaultType = (raw: number): DisputeFaultType =>
  DISPUTE_FAULT_TYPES[raw] ?? "DEFAULT";

/** Build the model from the two contract reads. */
export function parseDisputeEscalation(
  tierTuple: readonly [number, bigint, bigint],
  decisionTuple: readonly [number, number, string, bigint, bigint],
): DisputeEscalation {
  const [tier, tierSince, appealableAt] = tierTuple;
  const [faultType, decisionTier, decidedBy, decidedAt, appealableUntil] =
    decisionTuple;

  return {
    tier: toTier(tier),
    tierSince: Number(tierSince),
    appealableAt: Number(appealableAt),
    decision:
      decidedAt === 0n
        ? null
        : {
            faultType: toFaultType(faultType),
            decisionTier: toTier(decisionTier),
            decidedBy,
            decidedAt: Number(decidedAt),
            appealableUntil: Number(appealableUntil),
          },
  };
}

/** Derive what the user can do right now. `nowSec` is unix seconds. */
export function deriveDisputeEscalationView(
  escalation: DisputeEscalation,
  nowSec: number,
): DisputeEscalationView {
  const { tier, appealableAt, decision } = escalation;

  if (decision) {
    // Only USER fault settles against the user; MERCHANT and BANK both
    // refund/complete in the user's favour (see _executeSettlement).
    const decisionFavoursUser = decision.faultType !== "USER";
    if (nowSec < decision.appealableUntil) {
      return {
        phase: "decision-pending",
        canAppeal: true,
        canFinalize: false,
        nextTier: toTier(decision.decisionTier + 1),
        deadline: decision.appealableUntil,
        decisionFavoursUser,
      };
    }
    return {
      phase: "finalizable",
      canAppeal: false,
      canFinalize: true,
      decisionFavoursUser,
    };
  }

  if (tier >= FINAL_DISPUTE_TIER) {
    return { phase: "final-review", canAppeal: false, canFinalize: false };
  }

  const nextTier = toTier(tier + 1);
  if (appealableAt > 0 && nowSec >= appealableAt) {
    return {
      phase: "escalatable",
      canAppeal: true,
      canFinalize: false,
      nextTier,
    };
  }
  return {
    phase: "awaiting-decision",
    canAppeal: false,
    canFinalize: false,
    nextTier,
    deadline: appealableAt > 0 ? appealableAt : undefined,
  };
}
