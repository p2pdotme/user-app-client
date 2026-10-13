import { describe, expect, it } from "vitest";
import type { DisputeStep } from "@/core/p2pdotme/shared/validation";
import type { DisputeEscalation } from "./dispute-escalation";
import { buildDisputeStages } from "./dispute-stages";

const ADDR = "0x0000000000000000000000000000000000000001";
const step = (over: Partial<DisputeStep>): DisputeStep => ({
  id: "0x",
  kind: "RAISED",
  tier: 1,
  fromTier: 0,
  faultType: "DEFAULT",
  by: ADDR,
  finalizedBy: ADDR,
  deadline: "0",
  slaLapsed: false,
  blockTimestamp: "100",
  transactionHash: "0x",
  ...over,
});
const escalation = (over: Partial<DisputeEscalation>): DisputeEscalation => ({
  tier: 1,
  tierSince: 100,
  appealableAt: 0,
  decision: null,
  ...over,
});

describe("buildDisputeStages", () => {
  it("marks tier 1 current with a pending decision and its window", () => {
    const stages = buildDisputeStages({
      disputeStatus: "RAISED",
      steps: [
        step({ kind: "RAISED" }),
        step({ kind: "DECIDED", faultType: "USER", blockTimestamp: "200" }),
      ],
      escalation: escalation({
        decision: {
          faultType: "USER",
          decisionTier: 1,
          decidedBy: ADDR,
          decidedAt: 200,
          appealableUntil: 300,
        },
      }),
    });
    expect(stages.map((s) => s.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(stages[1]).toMatchObject({
      fault: "USER",
      windowUntil: 300,
      at: 200,
    });
    expect(stages[0].at).toBe(100);
  });

  it("records a challenged tier as done and moves current to the next tier", () => {
    const stages = buildDisputeStages({
      disputeStatus: "RAISED",
      steps: [
        step({ kind: "RAISED" }),
        step({ kind: "DECIDED", faultType: "USER", blockTimestamp: "200" }),
        step({
          kind: "ESCALATED",
          fromTier: 1,
          tier: 2,
          blockTimestamp: "250",
        }),
      ],
      escalation: escalation({ tier: 2, tierSince: 250 }),
    });
    expect(stages[1]).toMatchObject({
      state: "done",
      exit: "challenged",
      fault: "USER",
      at: 250,
    });
    expect(stages[2].state).toBe("current");
  });

  it("flags an SLA-lapsed escalation", () => {
    const stages = buildDisputeStages({
      disputeStatus: "RAISED",
      steps: [
        step({ kind: "ESCALATED", fromTier: 1, tier: 2, slaLapsed: true }),
      ],
      escalation: escalation({ tier: 2 }),
    });
    expect(stages[1].exit).toBe("sla-missed");
  });

  it("closes the ladder on settlement at the deciding tier", () => {
    const stages = buildDisputeStages({
      disputeStatus: "SETTLED",
      steps: [
        step({ kind: "ESCALATED", fromTier: 1, tier: 2 }),
        step({
          kind: "SETTLED",
          tier: 2,
          faultType: "MERCHANT",
          blockTimestamp: "900",
        }),
      ],
    });
    expect(stages[2]).toMatchObject({
      state: "done",
      fault: "MERCHANT",
      at: 900,
    });
    expect(stages[3].state).toBe("upcoming");
    expect(stages[4]).toMatchObject({
      state: "done",
      fault: "MERCHANT",
      at: 900,
    });
  });

  it("falls back to the subgraph settled time when no steps are indexed", () => {
    const stages = buildDisputeStages({
      disputeStatus: "SETTLED",
      steps: [],
      settledAt: 777,
    });
    expect(stages[4]).toMatchObject({ state: "done", at: 777 });
  });
});
