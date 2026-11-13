import { type Address, formatUnits, getAbiItem, isAddressEqual } from "viem";
import { ERC20_ABI } from "./abis";
import { getPublicClient } from "./account";
import {
  NATIVE_TOKEN_ADDRESS,
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
} from "./networks";

export type RecoveryToken = {
  symbol: string;
  name: string;
  /** NATIVE_TOKEN_ADDRESS for the network's native coin. */
  address: Address;
  decimals: number;
  /** Balance in base units. */
  balance: bigint;
  /** Balance as a decimal string, for display. */
  formatted: string;
};

const TRANSFER_EVENT = getAbiItem({ abi: ERC20_ABI, name: "Transfer" });

export function isNativeToken(token: { address: Address }): boolean {
  return isAddressEqual(token.address, NATIVE_TOKEN_ADDRESS);
}

function toToken(
  meta: Omit<RecoveryToken, "balance" | "formatted">,
  balance: bigint,
): RecoveryToken {
  return { ...meta, balance, formatted: formatUnits(balance, meta.decimals) };
}

function readBalance(
  key: RecoveryNetworkKey,
  token: Address,
  account: Address,
): Promise<bigint> {
  return getPublicClient(key).readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  });
}

/**
 * Contracts that emitted a Transfer to or from the account in the last few
 * blocks. Best-effort: public RPCs cap or reject eth_getLogs, and a failed scan
 * must not hide the tokens that are always listed.
 */
async function findRecentlyTransferredTokens(
  key: RecoveryNetworkKey,
  account: Address,
): Promise<Address[]> {
  const client = getPublicClient(key);
  try {
    const toBlock = await client.getBlockNumber();
    const span = BigInt(RECOVERY_NETWORKS[key].logScanBlocks);
    const fromBlock = toBlock > span ? toBlock - span : 1n;
    const [sent, received] = await Promise.all([
      client.getLogs({
        event: TRANSFER_EVENT,
        args: { from: account },
        fromBlock,
        toBlock,
      }),
      client.getLogs({
        event: TRANSFER_EVENT,
        args: { to: account },
        fromBlock,
        toBlock,
      }),
    ]);
    const unique = new Set(
      [...sent, ...received].map((log) => log.address.toLowerCase()),
    );
    return [...unique] as Address[];
  } catch {
    return [];
  }
}

/** A discovered token with a non-zero balance, or null. */
async function readDiscoveredToken(
  key: RecoveryNetworkKey,
  address: Address,
  account: Address,
): Promise<RecoveryToken | null> {
  const client = getPublicClient(key);
  const read = <T>(functionName: "symbol" | "name" | "decimals", fallback: T) =>
    client
      .readContract({ address, abi: ERC20_ABI, functionName })
      .catch(() => fallback);
  try {
    const balance = await readBalance(key, address, account);
    if (balance === 0n) return null;
    const [symbol, name, decimals] = await Promise.all([
      read("symbol", "UNKNOWN"),
      read("name", "Unknown Token"),
      read("decimals", 18),
    ]);
    return toToken(
      {
        address,
        symbol: String(symbol),
        name: String(name),
        decimals: Number(decimals),
      },
      balance,
    );
  } catch {
    return null;
  }
}

/**
 * Tokens held by an account on a network, in display order: the native coin,
 * USDC, the network's configured extra tokens, then anything else seen in
 * recent transfers. The first three groups are listed even at zero balance.
 */
export async function fetchRecoveryTokens(
  key: RecoveryNetworkKey,
  account: Address,
): Promise<RecoveryToken[]> {
  const network = RECOVERY_NETWORKS[key];
  const native = network.chain.nativeCurrency;
  const known = [
    {
      address: network.usdcAddress,
      symbol: "USDC",
      name: "USD Coin",
      decimals: network.usdcDecimals,
    },
    ...network.extraTokens,
  ];

  const [nativeBalance, knownTokens, recent] = await Promise.all([
    getPublicClient(key).getBalance({ address: account }),
    Promise.all(
      known.map((token) =>
        readBalance(key, token.address, account).then(
          (balance) => toToken(token, balance),
          () => null,
        ),
      ),
    ),
    findRecentlyTransferredTokens(key, account),
  ]);

  const discovered = await Promise.all(
    recent
      .filter(
        (address) => !known.some((t) => isAddressEqual(t.address, address)),
      )
      .map((address) => readDiscoveredToken(key, address, account)),
  );

  return [
    toToken({ ...native, address: NATIVE_TOKEN_ADDRESS }, nativeBalance),
    ...knownTokens,
    ...discovered,
  ].filter((token): token is RecoveryToken => token !== null);
}
