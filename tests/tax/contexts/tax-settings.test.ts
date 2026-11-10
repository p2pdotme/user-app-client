import { describe, expect, it } from "vitest";
import { switchWallets } from "@/tax/contexts/tax-settings";
import type { WalletEntries } from "@/tax/core/types";
import { DEFAULT_SETTINGS, EMPTY_ENTRIES } from "@/tax/lib/manual-data";

const W1 = `0x${"1".repeat(40)}`;
const W2 = `0x${"2".repeat(40)}`;

const withLot: WalletEntries = {
  ...EMPTY_ENTRIES,
  lots: [
    {
      id: "l1",
      kind: "EXTERNAL",
      date: "2025-12-26",
      qty: "101.36",
      cost: "8919.68",
      source: "EXCHANGE",
      costUnknown: false,
      note: "",
    },
  ],
};

const stateFor = (wallets: string[], entries: WalletEntries) => ({
  settings: DEFAULT_SETTINGS,
  activeKey: wallets.join(","),
  activeWallets: wallets,
  byKey: { [wallets.join(",")]: entries },
});

describe("entries are tied to the wallet set (SWAN re-check)", () => {
  it("a deposit entered for wallet 1 is not carried into wallet 2", () => {
    const { state, outcome } = switchWallets(stateFor([W1], withLot), [W2]);
    expect(outcome).toBe("SEPARATE");
    expect(state.byKey[W2].lots).toHaveLength(0);
    // kept for wallet 1
    expect(state.byKey[W1].lots).toHaveLength(1);
  });

  it("switching back to wallet 1 restores its entries", () => {
    const away = switchWallets(stateFor([W1], withLot), [W2]).state;
    const { state, outcome } = switchWallets(away, [W1]);
    expect(outcome).toBe("RESTORED");
    expect(state.byKey[state.activeKey].lots).toHaveLength(1);
  });

  it("adding a wallet to the set (same taxpayer) carries the entries over", () => {
    const { state, outcome } = switchWallets(stateFor([W1], withLot), [W1, W2]);
    expect(outcome).toBe("CARRIED");
    expect(state.byKey[state.activeKey].lots).toHaveLength(1);
    // moved, not copied: no stale copy left under wallet 1 alone
    expect(state.byKey[W1]).toBeUndefined();
  });

  it("entries made before any wallet was chosen go to the first wallet set", () => {
    const { state, outcome } = switchWallets(stateFor([], withLot), [W1]);
    expect(outcome).toBe("CARRIED");
    expect(state.byKey[W1].lots).toHaveLength(1);
    expect(state.byKey[""]).toBeUndefined();
  });

  it("the same set in another order or case is the same wallet set", () => {
    const start = stateFor([W1, W2].sort(), withLot);
    const { outcome } = switchWallets(start, [W2.toUpperCase(), W1]);
    expect(outcome).toBe("SAME");
  });
});
