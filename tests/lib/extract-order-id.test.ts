import { describe, expect, it } from "vitest";
import { ABIS } from "@/core/p2pdotme/contracts/abis";
import { extractOrderIdFromOrderPlaced } from "@/lib/utils";
import bundledLogs from "./fixtures/bundled-order-placed-logs.json";

type ReceiptLog = Parameters<typeof extractOrderIdFromOrderPlaced>[1][number];

// Real receipt logs from Base tx 0x832b477e…9544b: the bundler packed two
// users' placeOrder userOps into one transaction, so the receipt carries an
// OrderPlaced event for each of them (854854 first, then 854855).
const logs = bundledLogs as unknown as ReceiptLog[];
const FIRST_USER = "0xF0A293B9e0aAE1C516B5dE3a28dE0d41E6aCe075";
const SECOND_USER = "0x19aF0E1Cb8B82899b92F9488231eAFAB743bbFEc";

describe("extractOrderIdFromOrderPlaced", () => {
  it("returns the caller's order when another user's order is in the same bundle", () => {
    expect(extractOrderIdFromOrderPlaced(ABIS.DIAMOND, logs, SECOND_USER)).toBe(
      854855,
    );
    expect(extractOrderIdFromOrderPlaced(ABIS.DIAMOND, logs, FIRST_USER)).toBe(
      854854,
    );
  });

  it("matches the user address case-insensitively", () => {
    expect(
      extractOrderIdFromOrderPlaced(
        ABIS.DIAMOND,
        logs,
        SECOND_USER.toLowerCase() as `0x${string}`,
      ),
    ).toBe(854855);
  });

  it("returns null when no OrderPlaced event belongs to the user", () => {
    expect(
      extractOrderIdFromOrderPlaced(
        ABIS.DIAMOND,
        logs,
        "0x0000000000000000000000000000000000000001",
      ),
    ).toBeNull();
  });
});
