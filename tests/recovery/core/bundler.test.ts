import type { Hex } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bundlerRpc,
  estimateUserOpGas,
  getBundlerGasFees,
  getSubmissionBundler,
  getThirdwebBundler,
  getThirdwebPaymasterData,
  prepareGasAndSponsorship,
} from "@/recovery/core/bundler";
import { DUMMY_SIGNATURE, type UserOperation } from "@/recovery/core/user-op";
import { installRpc, type RpcCall } from "../helpers/rpc";

const mocks = vi.hoisted(() => ({ client: { clientId: "cid-123" as string } }));
vi.mock("@/core/adapters/thirdweb/client", () => ({
  thirdwebClient: mocks.client,
}));

const CHAIN = 10;
const ENTRY_POINT = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789" as const;
const THIRDWEB_URL = `https://${CHAIN}.bundler.thirdweb.com/v2`;
const PIMLICO_URL = `https://api.pimlico.io/v2/${CHAIN}/rpc?apikey=k`;
const SPONSORED = `0x${"cc".repeat(60)}` as Hex;
const RE_SIGNED = `0x${"dd".repeat(60)}` as Hex;

const DRAFT: UserOperation = {
  sender: "0x00000000000000000000000000000000000000b2",
  nonce: 7n,
  initCode: "0x",
  callData: "0x1234",
  callGasLimit: 300_000n,
  verificationGasLimit: 300_000n,
  preVerificationGas: 600_000n,
  maxFeePerGas: 1_500_000_000n,
  maxPriorityFeePerGas: 1_500_000_000n,
  paymasterAndData: "0x",
  signature: DUMMY_SIGNATURE,
};

const TW_FEES = {
  maxFeePerGas: "0x3b9aca00",
  maxPriorityFeePerGas: "0x1dcd6500",
}; // 1 gwei, 0.5 gwei

beforeEach(() => {
  mocks.client.clientId = "cid-123";
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const urlsOf = (calls: RpcCall[]) => calls.map((c) => [c.method, c.url]);

describe("bundlerRpc", () => {
  it("posts a JSON-RPC 2.0 request with merged headers and returns the result", async () => {
    const rpc = installRpc({ eth_chainId: () => "0xa" });
    const result = await bundlerRpc("eth_chainId", [1, "x"], {
      url: "https://b.test",
      headers: { "x-client-id": "abc" },
    });
    expect(result).toBe("0xa");
    expect(rpc.fetchMock).toHaveBeenCalledWith(
      "https://b.test",
      expect.objectContaining({ method: "POST" }),
    );
    const [call] = rpc.calls;
    expect(call.headers).toEqual({
      "Content-Type": "application/json",
      "x-client-id": "abc",
    });
    expect(call.params).toEqual([1, "x"]);
  });

  it("throws with the serialized RPC error", async () => {
    installRpc({
      boom: () => {
        throw new Error("AA21 didn't pay prefund");
      },
    });
    await expect(
      bundlerRpc("boom", [], { url: "https://b.test" }),
    ).rejects.toThrow(/^Bundler RPC Error: .*AA21 didn't pay prefund/);
  });

  it("propagates network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(
      bundlerRpc("x", [], { url: "https://b.test" }),
    ).rejects.toThrow("offline");
  });
});

describe("getThirdwebBundler / getSubmissionBundler", () => {
  it("targets the chain's Thirdweb bundler with the client id header", () => {
    expect(getThirdwebBundler(CHAIN)).toEqual({
      url: THIRDWEB_URL,
      headers: { "x-client-id": "cid-123" },
    });
  });

  it("sends sponsored ops to Thirdweb even when the chain bundler is Pimlico", () => {
    expect(
      getSubmissionBundler({ paymasterAndData: SPONSORED }, CHAIN, PIMLICO_URL),
    ).toEqual(getThirdwebBundler(CHAIN));
  });

  it("sends unsponsored ops to the chain bundler without Thirdweb's header", () => {
    expect(
      getSubmissionBundler({ paymasterAndData: "0x" }, CHAIN, PIMLICO_URL),
    ).toEqual({
      url: PIMLICO_URL,
    });
  });
});

describe("estimateUserOpGas", () => {
  it("sends the op, entry point and a sender balance override, and parses hex results", async () => {
    const rpc = installRpc({
      eth_estimateUserOperationGas: () => ({
        callGasLimit: "0x10",
        verificationGasLimit: 32,
        preVerificationGas: "0x30",
      }),
    });
    const gas = await estimateUserOpGas(DRAFT, ENTRY_POINT, {
      url: PIMLICO_URL,
    });
    expect(gas).toEqual({
      callGasLimit: 16n,
      verificationGasLimit: 32n,
      preVerificationGas: 48n,
    });
    const [call] = rpc.calls;
    expect(call.params[0]).toMatchObject({
      sender: DRAFT.sender,
      nonce: "0x7",
      callGasLimit: "0x493e0",
      signature: DUMMY_SIGNATURE,
    });
    expect(call.params[1]).toBe(ENTRY_POINT);
    expect(call.params[2]).toEqual({
      [DRAFT.sender]: { balance: `0x${(10n ** 21n).toString(16)}` },
    });
  });

  it("returns zeros for missing fields and a null result", async () => {
    installRpc({
      eth_estimateUserOperationGas: () => ({ callGasLimit: "0x5" }),
    });
    expect(
      await estimateUserOpGas(DRAFT, ENTRY_POINT, { url: "https://b" }),
    ).toEqual({
      callGasLimit: 5n,
      verificationGasLimit: 0n,
      preVerificationGas: 0n,
    });
    installRpc({ eth_estimateUserOperationGas: () => null });
    expect(
      await estimateUserOpGas(DRAFT, ENTRY_POINT, { url: "https://b" }),
    ).toEqual({
      callGasLimit: 0n,
      verificationGasLimit: 0n,
      preVerificationGas: 0n,
    });
  });
});

describe("getBundlerGasFees", () => {
  it("reads the standard tier from the chain's Pimlico bundler", async () => {
    const rpc = installRpc({
      pimlico_getUserOperationGasPrice: () => ({
        standard: { maxFeePerGas: "0x64", maxPriorityFeePerGas: "0x0a" },
      }),
    });
    expect(await getBundlerGasFees(PIMLICO_URL)).toEqual({
      maxFeePerGas: 100n,
      maxPriorityFeePerGas: 10n,
    });
    expect(urlsOf(rpc.calls)).toEqual([
      ["pimlico_getUserOperationGasPrice", PIMLICO_URL],
    ]);
    expect(rpc.calls[0].headers["x-client-id"]).toBeUndefined();
  });

  it("falls back to 1.5 gwei when the bundler errors", async () => {
    installRpc({});
    expect(await getBundlerGasFees(PIMLICO_URL)).toEqual({
      maxFeePerGas: 1_500_000_000n,
      maxPriorityFeePerGas: 1_500_000_000n,
    });
  });

  it("falls back when the response has no standard tier or fetch fails", async () => {
    installRpc({ pimlico_getUserOperationGasPrice: () => ({}) });
    expect((await getBundlerGasFees(PIMLICO_URL)).maxFeePerGas).toBe(
      1_500_000_000n,
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await getBundlerGasFees(PIMLICO_URL)).maxFeePerGas).toBe(
      1_500_000_000n,
    );
  });

  it("treats missing tier fields as 0n, not the fallback", async () => {
    installRpc({ pimlico_getUserOperationGasPrice: () => ({ standard: {} }) });
    expect(await getBundlerGasFees(PIMLICO_URL)).toEqual({
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
    });
  });
});

describe("getThirdwebPaymasterData", () => {
  it("returns not-sponsored without any request when there is no client id", async () => {
    mocks.client.clientId = "";
    const rpc = installRpc({});
    expect(await getThirdwebPaymasterData(DRAFT, ENTRY_POINT, CHAIN)).toEqual({
      paymasterAndData: "0x",
    });
    expect(rpc.calls).toHaveLength(0);
  });

  it("asks Thirdweb's bundler with a dummy-signed op that has no paymaster", async () => {
    const rpc = installRpc({
      pm_sponsorUserOperation: () => ({ paymasterAndData: SPONSORED }),
    });
    await getThirdwebPaymasterData(
      { ...DRAFT, paymasterAndData: RE_SIGNED, signature: "0xbeef" },
      ENTRY_POINT,
      CHAIN,
    );
    const [call] = rpc.calls;
    expect(call.url).toBe(THIRDWEB_URL);
    expect(call.headers["x-client-id"]).toBe("cid-123");
    expect(call.params[0].paymasterAndData).toBe("0x");
    expect(call.params[0].signature).toBe(DUMMY_SIGNATURE);
    expect(call.params[1]).toBe(ENTRY_POINT);
  });

  it("returns only the limits the paymaster supplied", async () => {
    installRpc({
      pm_sponsorUserOperation: () => ({
        paymasterAndData: SPONSORED,
        callGasLimit: "0x10",
        preVerificationGas: "0x20",
      }),
    });
    expect(await getThirdwebPaymasterData(DRAFT, ENTRY_POINT, CHAIN)).toEqual({
      paymasterAndData: SPONSORED,
      callGasLimit: 16n,
      preVerificationGas: 32n,
    });
  });

  it.each([
    ["null result", () => null],
    ["no paymasterAndData", () => ({ callGasLimit: "0x1" })],
    ["empty paymasterAndData", () => ({ paymasterAndData: "" })],
    [
      "RPC error",
      () => {
        throw new Error("not eligible");
      },
    ],
  ])("never throws: %s means not sponsored", async (_n, handler) => {
    installRpc({ pm_sponsorUserOperation: handler });
    expect(await getThirdwebPaymasterData(DRAFT, ENTRY_POINT, CHAIN)).toEqual({
      paymasterAndData: "0x",
    });
  });

  it("never throws on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await getThirdwebPaymasterData(DRAFT, ENTRY_POINT, CHAIN)).toEqual({
      paymasterAndData: "0x",
    });
  });
});

describe("prepareGasAndSponsorship", () => {
  describe("branch 1: not sponsored", () => {
    it("estimates on the chain bundler, keeps the op's own fees, floors callGasLimit", async () => {
      const rpc = installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => ({ paymasterAndData: "0x" }),
        eth_estimateUserOperationGas: () => ({
          callGasLimit: "0x1",
          verificationGasLimit: "0x2",
          preVerificationGas: "0x3",
        }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );

      expect(urlsOf(rpc.calls)).toEqual([
        ["thirdweb_getUserOperationGasPrice", THIRDWEB_URL],
        ["pm_sponsorUserOperation", THIRDWEB_URL],
        ["eth_estimateUserOperationGas", PIMLICO_URL],
      ]);
      expect(
        rpc.named("eth_estimateUserOperationGas")[0].headers["x-client-id"],
      ).toBeUndefined();
      expect(op).toEqual({
        ...DRAFT,
        callGasLimit: 300_000n, // estimate (1) is below the op's floor
        verificationGasLimit: 2n, // estimate wins (not floored)
        preVerificationGas: 3n,
      });
      expect(op.maxFeePerGas).toBe(DRAFT.maxFeePerGas);
      expect(op.paymasterAndData).toBe("0x");
    });

    it("asks the paymaster with zeroed limits and Thirdweb's fee values", async () => {
      const rpc = installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => null,
        eth_estimateUserOperationGas: () => ({}),
      });
      await prepareGasAndSponsorship(DRAFT, ENTRY_POINT, CHAIN, PIMLICO_URL);
      expect(rpc.named("pm_sponsorUserOperation")[0].params[0]).toMatchObject({
        callGasLimit: "0x0",
        verificationGasLimit: "0x0",
        preVerificationGas: "0x0",
        maxFeePerGas: "0x3b9aca00",
        maxPriorityFeePerGas: "0x1dcd6500",
        paymasterAndData: "0x",
        signature: DUMMY_SIGNATURE,
      });
    });

    it("uses the raised callGasLimit when the estimate exceeds it", async () => {
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => null,
        eth_estimateUserOperationGas: () => ({ callGasLimit: "0xf4240" }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op.callGasLimit).toBe(1_000_000n);
      // zero estimates for the other fields keep the op's own values
      expect(op.verificationGasLimit).toBe(DRAFT.verificationGasLimit);
      expect(op.preVerificationGas).toBe(DRAFT.preVerificationGas);
    });

    it("keeps the draft when estimation fails", async () => {
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => null,
      });
      expect(
        await prepareGasAndSponsorship(DRAFT, ENTRY_POINT, CHAIN, PIMLICO_URL),
      ).toEqual(DRAFT);
    });

    it("still tries sponsorship with the draft's fees if the fee quote fails", async () => {
      const rpc = installRpc({
        pm_sponsorUserOperation: () => null,
        eth_estimateUserOperationGas: () => ({}),
      });
      await prepareGasAndSponsorship(DRAFT, ENTRY_POINT, CHAIN, PIMLICO_URL);
      expect(
        rpc.named("pm_sponsorUserOperation")[0].params[0].maxFeePerGas,
      ).toBe("0x59682f00");
    });

    it("is not sponsored when the paymaster call fails", async () => {
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => {
          throw new Error("nope");
        },
        eth_estimateUserOperationGas: () => ({}),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op.paymasterAndData).toBe("0x");
    });
  });

  describe("branch 2: sponsored, paymaster returned all limits", () => {
    it("adopts Thirdweb's fees and the paymaster's data and limits without estimating", async () => {
      const rpc = installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () => ({
          paymasterAndData: SPONSORED,
          callGasLimit: "0x11",
          verificationGasLimit: "0x22",
          preVerificationGas: "0x33",
        }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op).toEqual({
        ...DRAFT,
        paymasterAndData: SPONSORED,
        callGasLimit: 0x11n,
        verificationGasLimit: 0x22n,
        preVerificationGas: 0x33n,
        maxFeePerGas: 0x3b9aca00n,
        maxPriorityFeePerGas: 0x1dcd6500n,
      });
      expect(rpc.named("eth_estimateUserOperationGas")).toHaveLength(0);
      expect(rpc.named("pm_sponsorUserOperation")).toHaveLength(1);
      expect(rpc.calls.every((c) => c.url === THIRDWEB_URL)).toBe(true);
    });
  });

  describe("branch 3: sponsored without (complete) limits", () => {
    it("estimates on Thirdweb with the paymaster attached, then has the paymaster sign again", async () => {
      let pmCalls = 0;
      const rpc = installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () =>
          ++pmCalls === 1
            ? { paymasterAndData: SPONSORED }
            : { paymasterAndData: RE_SIGNED },
        eth_estimateUserOperationGas: () => ({
          callGasLimit: "0x7a120", // 500000
          verificationGasLimit: "0x61a80", // 400000
          preVerificationGas: "0x1388", // 5000
        }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );

      expect(urlsOf(rpc.calls)).toEqual([
        ["thirdweb_getUserOperationGasPrice", THIRDWEB_URL],
        ["pm_sponsorUserOperation", THIRDWEB_URL],
        ["eth_estimateUserOperationGas", THIRDWEB_URL],
        ["pm_sponsorUserOperation", THIRDWEB_URL],
      ]);
      const [estimate] = rpc.named("eth_estimateUserOperationGas");
      expect(estimate.headers["x-client-id"]).toBe("cid-123");
      expect(estimate.params[0].paymasterAndData).toBe(SPONSORED);
      expect(estimate.params[0].maxFeePerGas).toBe("0x3b9aca00");

      // The second sponsorship request is for the estimated limits
      const [, resign] = rpc.named("pm_sponsorUserOperation");
      expect(resign.params[0]).toMatchObject({
        callGasLimit: "0x7a120",
        verificationGasLimit: "0x61a80",
        preVerificationGas: "0x1388",
        paymasterAndData: "0x",
      });

      expect(op).toMatchObject({
        paymasterAndData: RE_SIGNED,
        callGasLimit: 500_000n,
        verificationGasLimit: 400_000n,
        preVerificationGas: 5_000n,
        maxFeePerGas: 0x3b9aca00n,
        maxPriorityFeePerGas: 0x1dcd6500n,
      });
    });

    it("treats a partial limit set as 'no limits'", async () => {
      let pmCalls = 0;
      const rpc = installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () =>
          ++pmCalls === 1
            ? {
                paymasterAndData: SPONSORED,
                callGasLimit: "0x10",
                verificationGasLimit: "0x20",
              }
            : { paymasterAndData: RE_SIGNED },
        eth_estimateUserOperationGas: () => ({}),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(rpc.named("eth_estimateUserOperationGas")).toHaveLength(1);
      expect(op.paymasterAndData).toBe(RE_SIGNED);
    });

    it("keeps the draft limits when the estimate fails, and still re-signs", async () => {
      let pmCalls = 0;
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () =>
          ++pmCalls === 1
            ? { paymasterAndData: SPONSORED }
            : { paymasterAndData: RE_SIGNED },
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op.paymasterAndData).toBe(RE_SIGNED);
      expect(op.callGasLimit).toBe(DRAFT.callGasLimit);
      expect(op.verificationGasLimit).toBe(DRAFT.verificationGasLimit);
    });

    it("lets the re-signed paymaster limits override the estimate", async () => {
      let pmCalls = 0;
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () =>
          ++pmCalls === 1
            ? { paymasterAndData: SPONSORED }
            : { paymasterAndData: RE_SIGNED, callGasLimit: "0x99" },
        eth_estimateUserOperationGas: () => ({ callGasLimit: "0x10" }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op.callGasLimit).toBe(0x99n);
    });
  });

  describe("branch 4: paymaster declines the estimated limits", () => {
    it("falls back to the original op, unsponsored, with its own fees", async () => {
      let pmCalls = 0;
      installRpc({
        thirdweb_getUserOperationGasPrice: () => TW_FEES,
        pm_sponsorUserOperation: () =>
          ++pmCalls === 1 ? { paymasterAndData: SPONSORED } : null,
        eth_estimateUserOperationGas: () => ({
          callGasLimit: "0x7a120",
          verificationGasLimit: "0x61a80",
          preVerificationGas: "0x1388",
        }),
      });
      const op = await prepareGasAndSponsorship(
        DRAFT,
        ENTRY_POINT,
        CHAIN,
        PIMLICO_URL,
      );
      expect(op).toEqual({ ...DRAFT, paymasterAndData: "0x" });
      expect(op.maxFeePerGas).toBe(DRAFT.maxFeePerGas);
    });
  });

  it("makes no request other than to the bundlers", async () => {
    const rpc = installRpc({
      thirdweb_getUserOperationGasPrice: () => TW_FEES,
      pm_sponsorUserOperation: () => null,
      eth_estimateUserOperationGas: () => ({}),
    });
    await prepareGasAndSponsorship(DRAFT, ENTRY_POINT, CHAIN, PIMLICO_URL);
    expect(new Set(rpc.calls.map((c) => c.url))).toEqual(
      new Set([THIRDWEB_URL, PIMLICO_URL]),
    );
  });
});
