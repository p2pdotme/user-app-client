import {
  type Address,
  createPublicClient,
  encodeFunctionData,
  type Hex,
  http,
  type PublicClient,
  zeroAddress,
} from "viem";
import { ACCOUNT_FACTORY_ABI } from "./abis";
import { CODE_POLL_ATTEMPTS, CODE_POLL_DELAY_MS, sleep } from "./config";
import { RecoveryError } from "./errors";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "./networks";

const clients = new Map<RecoveryNetworkKey, PublicClient>();

/** Read-only client for a recovery network, on its public RPC. */
export function getPublicClient(key: RecoveryNetworkKey): PublicClient {
  const cached = clients.get(key);
  if (cached) return cached;
  const { chain } = RECOVERY_NETWORKS[key];
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });
  clients.set(key, client);
  return client;
}

/** True when the address has contract code. Throws if the RPC can't be reached. */
export async function hasCode(
  key: RecoveryNetworkKey,
  address: Address,
): Promise<boolean> {
  const code = await getPublicClient(key).getCode({ address });
  return !!code && code !== "0x";
}

export function isFactoryDeployed(key: RecoveryNetworkKey): Promise<boolean> {
  return hasCode(key, RECOVERY_NETWORKS[key].factoryAddress);
}

/** Like hasCode, but an unreachable RPC counts as "not deployed". */
export function isAccountDeployed(
  account: Address,
  key: RecoveryNetworkKey,
): Promise<boolean> {
  return hasCode(key, account).catch(() => false);
}

/** Polls for code at an address that was just deployed. */
export async function waitForCode(
  check: () => Promise<boolean>,
  attempts = CODE_POLL_ATTEMPTS,
  delayMs = CODE_POLL_DELAY_MS,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await check()) return true;
    if (i < attempts - 1) await sleep(delayMs);
  }
  return false;
}

export function waitForAccountDeployment(
  account: Address,
  key: RecoveryNetworkKey,
  attempts?: number,
  delayMs?: number,
): Promise<boolean> {
  return waitForCode(() => isAccountDeployed(account, key), attempts, delayMs);
}

/**
 * The smart account the factory creates for an owner. The address only depends
 * on the factory and the owner, so it is the same on every network — including
 * the ones where the account was never deployed.
 */
export async function deriveSmartAccountAddress(
  owner: Address,
  key: RecoveryNetworkKey,
): Promise<Address> {
  const { factoryAddress } = RECOVERY_NETWORKS[key];

  let factoryDeployed: boolean;
  try {
    factoryDeployed = await isFactoryDeployed(key);
  } catch (cause) {
    throw new RecoveryError(
      "DeriveFailed",
      "Failed to derive smart account address",
      { cause },
    );
  }
  if (!factoryDeployed) {
    throw new RecoveryError(
      "FactoryNotDeployed",
      "Factory not deployed on this network yet",
    );
  }

  try {
    const address = await getPublicClient(key).readContract({
      address: factoryAddress,
      abi: ACCOUNT_FACTORY_ABI,
      functionName: "getAddress",
      args: [owner, "0x"],
    });
    if (!address || address === zeroAddress) {
      throw new Error("Factory returned no address");
    }
    return address;
  } catch (cause) {
    throw new RecoveryError(
      "DeriveFailed",
      "Failed to derive smart account address",
      { cause },
    );
  }
}

/** initCode that makes the EntryPoint deploy the account before its first op. */
export function getInitCode(factory: Address, owner: Address): Hex {
  const createAccount = encodeFunctionData({
    abi: ACCOUNT_FACTORY_ABI,
    functionName: "createAccount",
    args: [owner, "0x"],
  });
  return `${factory.toLowerCase()}${createAccount.slice(2)}` as Hex;
}
