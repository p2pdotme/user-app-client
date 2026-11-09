import { describe, expect, it } from "vitest";
import {
  type DisputeEscalation,
  deriveDisputeEscalationView,
  parseDisputeEscalation,
} from "./dispute-escalation";

const NOW = 1_800_000_000;
const HOUR = 3600;
const ADDR = "0x0000000000000000000000000000000000000001";

const undecided = (
  tier: 1 | 2 | 3,
  appealableAt: number,
): DisputeEscalation => ({
  tier,
  tierSince: NOW - HOUR,
  appealableAt,
  decision: null,
});

const decided = (
  faultType: "USER" | "MERCHANT" | "BANK",
  appealableUntil: number,
  decisionTier: 1 | 2 = 1,
): DisputeEscalation => ({
  tier: decisionTier,
  tierSince: NOW - HOUR,
  appealableAt: 0,
  decision: {
    faultType,
    decisionTier,
    decidedBy: ADDR,
    decidedAt: NOW - HOUR,
    appealableUntil,
  },
});

describe("parseDisputeEscalation", () => {
  it("maps the contract tuples, treating tier 0 as tier 1", () => {
    const e = parseDisputeEscalation(
      [0, 0n, 0n],
      [0, 0, "0x0000000000000000000000000000000000000000", 0n, 0n],
    );
    expect(e).toEqual({
      tier: 1,
      tierSince: 0,
      appealableAt: 0,
      decision: null,
    });
  });

  it("decodes a pending MERCHANT-fault decision", () => {
    const e = parseDisputeEscalation(
      [2, BigInt(NOW), BigInt(NOW + HOUR)],
      [2, 2, ADDR, BigInt(NOW), BigInt(NOW + 24 * HOUR)],
    );
    expect(e.tier).toBe(2);
    expect(e.decision).toEqual({
      faultType: "MERCHANT",
      decisionTier: 2,
      decidedBy: ADDR,
      decidedAt: NOW,
      appealableUntil: NOW + 24 * HOUR,
    });
  });
});

describe("deriveDisputeEscalationView", () => {
  it("is awaiting-decision while the tier's SLA has not lapsed", () => {
    const view = deriveDisputeEscalationView(undecided(1, NOW + HOUR), NOW);
    expect(view).toMatchObject({
      phase: "awaiting-decision",
      canAppeal: false,
      canFinalize: false,
      nextTier: 2,
      deadline: NOW + HOUR,
    });
  });

  it("becomes escalatable once the SLA lapses", () => {
    const view = deriveDisputeEscalationView(undecided(2, NOW - 1), NOW);
    expect(view).toMatchObject({
      phase: "escalatable",
      canAppeal: true,
      canFinalize: false,
      nextTier: 3,
    });
  });

  it("offers nothing at the final tier", () => {
    const view = deriveDisputeEscalationView(undecided(3, 0), NOW);
    expect(view).toMatchObject({
      phase: "final-review",
      canAppeal: false,
      canFinalize: false,
    });
    expect(view.nextTier).toBeUndefined();
  });

  it("lets the user challenge a pending decision inside the window", () => {
    const view = deriveDisputeEscalationView(
      decided("USER", NOW + HOUR, 1),
      NOW,
    );
    expect(view).toMatchObject({
      phase: "decision-pending",
      canAppeal: true,
      canFinalize: false,
      nextTier: 2,
      deadline: NOW + HOUR,
      decisionFavoursUser: false,
    });
  });

  it("flips to finalizable once the appeal window closes", () => {
    const view = deriveDisputeEscalationView(
      decided("MERCHANT", NOW - 1, 2),
      NOW,
    );
    expect(view).toMatchObject({
      phase: "finalizable",
      canAppeal: false,
      canFinalize: true,
      decisionFavoursUser: true,
    });
  });

  it("treats BANK fault as favouring the user", () => {
    const view = deriveDisputeEscalationView(decided("BANK", NOW + HOUR), NOW);
    expect(view.decisionFavoursUser).toBe(true);
  });
});
