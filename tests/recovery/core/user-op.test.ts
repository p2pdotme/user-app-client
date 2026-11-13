import type { Hex } from "viem";
import { getUserOperationHash } from "viem/account-abstraction";
import { describe, expect, it } from "vitest";
import {
  DUMMY_SIGNATURE,
  formatUserOpForBundler,
  getUserOpHash,
  isSponsored,
  type UserOperation,
} from "@/recovery/core/user-op";

const ENTRY_POINT = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789" as const;

const BASE_OP: UserOperation = {
  sender: "0x1111111111111111111111111111111111111111",
  nonce: 3n,
  initCode: "0x",
  callData:
    "0xb61d27f6000000000000000000000000222222222222222222222222222222222222222200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
  callGasLimit: 300_000n,
  verificationGasLimit: 300_000n,
  preVerificationGas: 600_000n,
  maxFeePerGas: 1_500_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  paymasterAndData: "0x",
  signature: "0x",
};

// Independent oracle: viem's own ERC-4337 v0.6 implementation
function viemHash(
  op: UserOperation,
  chainId: number,
  entryPoint = ENTRY_POINT,
) {
  return getUserOperationHash({
    chainId,
    entryPointAddress: entryPoint,
    entryPointVersion: "0.6",
    userOperation: op,
  });
}

describe("getUserOpHash", () => {
  it("matches a pinned vector produced by viem for an already-deployed account", () => {
    expect(getUserOpHash(BASE_OP, ENTRY_POINT, 10)).toBe(
      "0xf94606aaf43522fcda00db82630569bbf51d8dc0a6a4659fe99dd90ac4deb601",
    );
  });

  const factory = "0xdE320c2E2b4953883f61774c006f9057A55B97D1";
  const createAccountCall = `${"5fbfb9cf"}${"00".repeat(12)}${"00000000000000000000000000000000000000a1"}${"0".repeat(63)}40${"0".repeat(64)}`;
  const variants: [string, UserOperation, number][] = [
    ["deployed account", BASE_OP, 1],
    [
      "undeployed account (initCode set)",
      {
        ...BASE_OP,
        initCode: `${factory.toLowerCase()}${createAccountCall}` as Hex,
      },
      10,
    ],
    [
      "sponsored op (paymasterAndData set)",
      { ...BASE_OP, paymasterAndData: `0x${"ab".repeat(90)}` },
      143,
    ],
    ["empty callData (deploy only)", { ...BASE_OP, callData: "0x" }, 42161],
    [
      "uint256 extremes",
      {
        ...BASE_OP,
        nonce: 2n ** 64n - 1n,
        maxFeePerGas: 2n ** 128n,
        callGasLimit: 0n,
      },
      324,
    ],
  ];
  it.each(variants)("agrees with viem for %s", (_name, op, chainId) => {
    expect(getUserOpHash(op, ENTRY_POINT, chainId)).toBe(viemHash(op, chainId));
  });

  it("ignores the signature field", () => {
    const signed = { ...BASE_OP, signature: DUMMY_SIGNATURE };
    expect(getUserOpHash(signed, ENTRY_POINT, 10)).toBe(
      getUserOpHash(BASE_OP, ENTRY_POINT, 10),
    );
  });

  it("commits to chain id, entry point, and every other field", () => {
    const base = getUserOpHash(BASE_OP, ENTRY_POINT, 10);
    const changed = [
      getUserOpHash(BASE_OP, ENTRY_POINT, 11),
      getUserOpHash(BASE_OP, "0x0000000071727de22e5e9d8baf0edac6f37da032", 10),
      getUserOpHash({ ...BASE_OP, nonce: 4n }, ENTRY_POINT, 10),
      getUserOpHash({ ...BASE_OP, callGasLimit: 1n }, ENTRY_POINT, 10),
      getUserOpHash({ ...BASE_OP, initCode: "0x1234" }, ENTRY_POINT, 10),
      getUserOpHash(
        { ...BASE_OP, paymasterAndData: "0x1234" },
        ENTRY_POINT,
        10,
      ),
    ];
    for (const hash of changed) expect(hash).not.toBe(base);
    expect(new Set(changed).size).toBe(changed.length);
  });
});

describe("formatUserOpForBundler", () => {
  it("hex-encodes every quantity and passes bytes fields through", () => {
    const rpc = formatUserOpForBundler({
      ...BASE_OP,
      nonce: 0n,
      maxFeePerGas: 255n,
      signature: "0xdead",
    });
    expect(rpc).toEqual({
      sender: BASE_OP.sender,
      nonce: "0x0",
      initCode: "0x",
      callData: BASE_OP.callData,
      callGasLimit: "0x493e0",
      verificationGasLimit: "0x493e0",
      preVerificationGas: "0x927c0",
      maxFeePerGas: "0xff",
      maxPriorityFeePerGas: "0x3b9aca00",
      paymasterAndData: "0x",
      signature: "0xdead",
    });
  });

  it("round-trips values above Number.MAX_SAFE_INTEGER", () => {
    const rpc = formatUserOpForBundler({ ...BASE_OP, nonce: 2n ** 80n + 1n });
    expect(BigInt(rpc.nonce)).toBe(2n ** 80n + 1n);
  });
});

describe("isSponsored", () => {
  it("is false only for empty paymasterAndData", () => {
    expect(isSponsored({ paymasterAndData: "0x" })).toBe(false);
    expect(isSponsored({ paymasterAndData: "0x00" })).toBe(true);
    expect(isSponsored({ paymasterAndData: `0x${"ab".repeat(20)}` })).toBe(
      true,
    );
  });
});

describe("DUMMY_SIGNATURE", () => {
  it("is a 65-byte signature-shaped placeholder", () => {
    expect(DUMMY_SIGNATURE).toMatch(/^0x[0-9a-f]{130}$/);
  });
});
