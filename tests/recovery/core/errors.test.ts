import { describe, expect, it } from "vitest";
import {
  isPrefundError,
  RecoveryError,
  toRecoveryError,
} from "@/recovery/core/errors";

describe("RecoveryError", () => {
  it("carries code, message, cause and funding address", () => {
    const cause = new Error("root");
    const err = new RecoveryError("InsufficientGas", "no gas", {
      cause,
      fundingAddress: "0xabc",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("RecoveryError");
    expect(err.code).toBe("InsufficientGas");
    expect(err.message).toBe("no gas");
    expect(err.cause).toBe(cause);
    expect(err.fundingAddress).toBe("0xabc");
  });

  it("leaves optional fields undefined", () => {
    const err = new RecoveryError("Unknown", "x");
    expect(err.cause).toBeUndefined();
    expect(err.fundingAddress).toBeUndefined();
  });
});

describe("isPrefundError", () => {
  it.each([
    [new Error("AA21 didn't pay prefund")],
    [new Error('Bundler RPC Error: {"message":"AA21"}')],
    ["account didn't pay prefund"],
    [{ message: "AA21 didn't pay prefund" }],
  ])("detects %#", (error) => {
    expect(isPrefundError(error)).toBe(true);
  });

  it.each([[new Error("AA33 reverted")], ["nope"], [null], [42]])(
    "ignores %#",
    (error) => {
      expect(isPrefundError(error)).toBe(false);
    },
  );
});

describe("toRecoveryError", () => {
  it("returns an existing RecoveryError untouched", () => {
    const err = new RecoveryError("AlreadyDeployed", "x");
    expect(toRecoveryError(err, "0xfund")).toBe(err);
  });

  it("maps prefund failures to InsufficientGas with the funding address", () => {
    const original = new Error("AA21 didn't pay prefund");
    const err = toRecoveryError(original, "0xfund");
    expect(err.code).toBe("InsufficientGas");
    expect(err.fundingAddress).toBe("0xfund");
    expect(err.cause).toBe(original);
  });

  it("maps anything else to Unknown with the message", () => {
    expect(toRecoveryError(new Error("boom")).code).toBe("Unknown");
    expect(toRecoveryError(new Error("boom")).message).toBe("boom");
    expect(toRecoveryError("plain string").message).toBe("plain string");
    expect(toRecoveryError({ a: 1 }).message).toBe('{"a":1}');
  });

  // BUG (src/recovery/core/errors.ts:40-47, messageOf/isPrefundError):
  // JSON.stringify(undefined | function | symbol) returns undefined, so
  // isPrefundError calls undefined.includes() and the normaliser itself throws
  // for a `throw undefined` / `reject()` with no reason.
  it("normalises undefined without throwing", () => {
    expect(toRecoveryError(undefined).code).toBe("Unknown");
  });

  it("isPrefundError does not throw for undefined", () => {
    expect(isPrefundError(undefined)).toBe(false);
  });
});
