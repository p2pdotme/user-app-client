/**
 * EVM side of the outbound bridge: approve P2PGovToken + call bridgeOutbound.
 * Uses thirdweb account — same pattern as redeem-on-base.ts in p2p-sol-bridge.
 */
import type { Account } from "thirdweb";
import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { createPublicClient, encodeFunctionData, http, parseEventLogs } from "viem";
import { sepolia as sepoliaViem } from "viem/chains";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { SOL_SEPOLIA } from "./constants";

const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const REDEEMER_ABI = [
  {
    name: "bridgeOutbound",
    type: "function",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "recipientOnSolana", type: "bytes32" },
    ],
    outputs: [{ name: "sequence", type: "uint64" }],
    stateMutability: "payable",
  },
  {
    name: "Bridged",
    type: "event",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "sequence", type: "uint64", indexed: false },
    ],
  },
] as const;

const TOKEN_BRIDGE_ABI = [
  {
    name: "wormhole",
    type: "function",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
] as const;

const CORE_BRIDGE_ABI = [
  {
    name: "messageFee",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Read-only public client for fee reads + receipt
const sepoliaPublicClient = createPublicClient({
  chain: sepoliaViem,
  transport: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
});

async function getWormholeMessageFee(): Promise<bigint> {
  const coreAddr = await sepoliaPublicClient.readContract({
    address: SOL_SEPOLIA.TOKEN_BRIDGE,
    abi: TOKEN_BRIDGE_ABI,
    functionName: "wormhole",
  });
  return sepoliaPublicClient.readContract({
    address: coreAddr,
    abi: CORE_BRIDGE_ABI,
    functionName: "messageFee",
  });
}

export async function bridgeOutbound(
  amount: bigint,
  recipientSolanaBytes32: `0x${string}`,
  account: Account,
): Promise<{ evmTxHash: string; sequence: string }> {
  console.log("[bridgeOutbound] amount:", amount.toString(), "recipient:", recipientSolanaBytes32);

  const fee = await getWormholeMessageFee();
  console.log("[bridgeOutbound] wormhole fee:", fee.toString());

  // Step 1: approve P2PGovToken for Redeemer
  const approveData = encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: "approve",
    args: [SOL_SEPOLIA.REDEEMER_ADDRESS, amount],
  });
  console.log("[bridgeOutbound] sending approve…");
  await sendAndConfirmTransaction({
    account,
    transaction: prepareTransaction({
      to: SOL_SEPOLIA.P2P_GOV_TOKEN,
      chain: sepolia,
      client: thirdwebClient,
      data: approveData,
    }),
  });
  console.log("[bridgeOutbound] approve confirmed");

  // Step 2: bridgeOutbound
  const bridgeData = encodeFunctionData({
    abi: REDEEMER_ABI,
    functionName: "bridgeOutbound",
    args: [amount, recipientSolanaBytes32],
  });
  console.log("[bridgeOutbound] sending bridgeOutbound…");
  const { transactionHash } = await sendAndConfirmTransaction({
    account,
    transaction: prepareTransaction({
      to: SOL_SEPOLIA.REDEEMER_ADDRESS,
      chain: sepolia,
      client: thirdwebClient,
      data: bridgeData,
      value: fee,
    }),
  });
  console.log("[bridgeOutbound] bridge hash:", transactionHash);

  // Parse Bridged event to get Wormhole sequence
  const receipt = await sepoliaPublicClient.getTransactionReceipt({
    hash: transactionHash,
  });
  const logs = parseEventLogs({ abi: REDEEMER_ABI, eventName: "Bridged", logs: receipt.logs });
  if (!logs.length) throw new Error("Bridged event not found in receipt");
  const sequence = logs[0].args.sequence.toString();
  console.log("[bridgeOutbound] sequence:", sequence);

  return { evmTxHash: transactionHash, sequence };
}
