import type { DisputeStep } from "@/core/p2pdotme/shared/validation";
import type {
  DisputeEscalation,
  DisputeFaultType,
  DisputeTier,
} from "./dispute-escalation";

export type DisputeStageKey =
  | "raised"
  | "tier1"
  | "tier2"
  | "tier3"
  | "settled";
export type DisputeStageState = "done" | "current" | "upcoming";

export interface DisputeStage {
  key: DisputeStageKey;
  state: DisputeStageState;
  /** unix seconds of the event that completed / opened this stage */
  at?: number;
  /** recorded fault for a decided / settled stage */
  fault?: DisputeFaultType;
  /** how the stage ended, when it ended by the user's hand or by a missed SLA */
  exit?: "challenged" | "sla-missed";
  /** unix seconds — for the current stage, when its challenge window closes */
  windowUntil?: number;
}

interface BuildStagesInput {
  disputeStatus: "RAISED" | "SETTLED";
  escalation?: DisputeEscalation;
  steps: DisputeStep[];
  settledAt?: number;
}

const TIERS: DisputeTier[] = [1, 2, 3];

/**
 * Projects the indexed ladder steps plus the live on-chain state onto the
 * fixed five-stage ladder the card draws. History is the source for what
 * already happened; the chain decides which stage is current.
 */
export function buildDisputeStages({
  disputeStatus,
  escalation,
  steps,
  settledAt,
}: BuildStagesInput): DisputeStage[] {
  const raised = steps.find((s) => s.kind === "RAISED");
  const settledStep = steps.find((s) => s.kind === "SETTLED");
  const isSettled = disputeStatus === "SETTLED";
  const currentTier = isSettled ? null : (escalation?.tier ?? 1);

  const tierStages: DisputeStage[] = TIERS.map((tier) => {
    const key = `tier${tier}` as DisputeStageKey;
    const decided = [...steps]
      .reverse()
      .find((s) => s.kind === "DECIDED" && s.tier === tier);
    const escalatedFrom = steps.find(
      (s) => s.kind === "ESCALATED" && s.fromTier === tier,
    );

    if (settledStep && settledStep.tier === tier) {
      return {
        key,
        state: "done",
        at: Number(settledStep.blockTimestamp),
        fault: settledStep.faultType,
      };
    }
    if (escalatedFrom) {
      return {
        key,
        state: "done",
        at: Number(escalatedFrom.blockTimestamp),
        fault: decided?.faultType,
        exit: escalatedFrom.slaLapsed ? "sla-missed" : "challenged",
      };
    }
    if (currentTier === tier) {
      const pending = escalation?.decision;
      return {
        key,
        state: "current",
        at: pending?.decidedAt,
        fault: pending?.faultType,
        windowUntil: pending?.appealableUntil,
      };
    }
    if (currentTier !== null && tier < currentTier)
      return { key, state: "done" };
    return { key, state: "upcoming" };
  });

  return [
    {
      key: "raised",
      state: "done",
      at: raised ? Number(raised.blockTimestamp) : undefined,
    },
    ...tierStages,
    isSettled
      ? {
          key: "settled",
          state: "done",
          at: settledStep ? Number(settledStep.blockTimestamp) : settledAt,
          fault: settledStep?.faultType,
        }
      : { key: "settled", state: "upcoming" },
  ];
}
