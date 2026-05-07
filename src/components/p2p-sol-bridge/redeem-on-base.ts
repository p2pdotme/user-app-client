import type { Account } from "thirdweb";
import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { encodeFunctionData } from "viem";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { WORMHOLE } from "./constants";

const REDEEMER_ABI = [
  {
    name: "redeemInbound",
    type: "function",
    inputs: [{ name: "encodedVm", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Custom Redeemer error selectors for friendly error messages
const REDEEMER_ERRORS: Record<string, string> = {
  "0x12bacdd3": "Transfer already redeemed — your P2PGovBase tokens have already arrived",
  "0x4caa0a26": "Inbound bridge is paused — please try again later",
  "0xf28de4d1": "Emitter not configured — contact support",
  "0x1ce1d54c": "Wrapped token not resolved — contact support",
};

function parseRedeemerError(message: string): string {
  for (const [selector, friendly] of Object.entries(REDEEMER_ERRORS)) {
    if (message.includes(selector)) return friendly;
  }
  return message;
}

export async function redeemOnBase(
  vaaBytes: Uint8Array,
  account: Account,
): Promise<string> {
  const vaaHex = `0x${Buffer.from(vaaBytes).toString("hex")}` as `0x${string}`;

  const data = encodeFunctionData({
    abi: REDEEMER_ABI,
    functionName: "redeemInbound",
    args: [vaaHex],
  });

  const tx = prepareTransaction({
    to: WORMHOLE.REDEEMER_ADDRESS,
    chain: baseSepolia,
    client: thirdwebClient,
    data,
  });

  try {
    const { transactionHash } = await sendAndConfirmTransaction({
      account,
      transaction: tx,
    });
    return transactionHash;
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    // AlreadyConsumed — treat as success (funds already arrived)
    if (raw.includes("12bacdd3") || raw.toLowerCase().includes("already")) {
      throw new Error("ALREADY_CONSUMED");
    }
    throw new Error(parseRedeemerError(raw));
  }
}
