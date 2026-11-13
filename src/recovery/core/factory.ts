import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import type { Wallet } from "thirdweb/wallets";
import {
  type Address,
  createPublicClient,
  getContractAddress,
  type Hex,
  http,
  isAddressEqual,
} from "viem";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import {
  getPublicClient,
  hasCode,
  isFactoryDeployed,
  waitForCode,
} from "./account";
import { RecoveryError } from "./errors";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "./networks";
import { getDirectSenderAccount, getOwnerAddress } from "./signer";

/**
 * Deterministic deployment proxy; its calldata is a 32-byte salt followed by
 * the init code.
 */
const CREATE2_DEPLOYER: Address = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

/** Original factory deployment on Base, replayed where the factory is missing. */
const SOURCE_RPC = "https://mainnet.base.org";
const SOURCE_TX: Hex =
  "0x4d6d0a066f13ade9e4fe503f176e58de4261d2e5936a64d58fb10fe8afac8ef0";

const SALT_HEX_LENGTH = 64;

/**
 * Fetch the original deployment calldata and prove it creates the expected
 * factory. The CREATE2 address commits to the salt and init code, so the
 * calldata needs no further trust.
 */
export async function getFactoryDeploymentData(
  factoryAddress: Address,
): Promise<Hex> {
  const sourceClient = createPublicClient({ transport: http(SOURCE_RPC) });
  const { input } = await sourceClient.getTransaction({ hash: SOURCE_TX });
  verifyFactoryDeploymentData(input, factoryAddress);
  return input;
}

/** Throws unless replaying `data` through the deployer creates `factoryAddress`. */
export function verifyFactoryDeploymentData(
  data: Hex,
  factoryAddress: Address,
): void {
  const salt = `0x${data.slice(2, 2 + SALT_HEX_LENGTH)}` as Hex;
  const bytecode = `0x${data.slice(2 + SALT_HEX_LENGTH)}` as Hex;
  const created = getContractAddress({
    opcode: "CREATE2",
    from: CREATE2_DEPLOYER,
    salt,
    bytecode,
  });
  if (!isAddressEqual(created, factoryAddress)) {
    throw new RecoveryError(
      "FactoryDeployFailed",
      `Factory deployment data does not match ${factoryAddress}; refusing to deploy`,
    );
  }
}

/**
 * Deploy the account factory on a network by replaying its original CREATE2
 * deployment. Same salt + init code => same factory address, so smart account
 * addresses match the ones users funded. The sender only pays gas.
 */
export async function deployFactory(
  wallet: Wallet,
  key: RecoveryNetworkKey,
): Promise<{ txHash?: Hex }> {
  const network = RECOVERY_NETWORKS[key];
  const chainName = network.chain.name;

  if (await isFactoryDeployed(key)) return {};

  const prerequisites = [
    ["CREATE2 deployer", CREATE2_DEPLOYER],
    ["EntryPoint", network.entryPoint],
  ] as const;
  for (const [label, address] of prerequisites) {
    if (!(await hasCode(key, address))) {
      throw new RecoveryError(
        "FactoryDeployFailed",
        `${label} (${address}) is not deployed on ${chainName}, so the factory cannot be deployed there`,
      );
    }
  }

  const data = await getFactoryDeploymentData(network.factoryAddress);

  const account = await getDirectSenderAccount(wallet, key);
  // Only a sender that pays its own gas needs a balance up front; a relaying
  // smart wallet may be sponsored, so it is allowed to try.
  const paysOwnGas = isAddressEqual(
    account.address as Address,
    getOwnerAddress(wallet),
  );
  const balance = paysOwnGas
    ? await getPublicClient(key).getBalance({
        address: account.address as Address,
      })
    : null;
  if (balance === 0n) {
    throw new RecoveryError(
      "InsufficientGas",
      `Send a small amount of ${network.chain.nativeCurrency.symbol} on ${chainName} to ${account.address} to pay for gas, then try again`,
      { fundingAddress: account.address },
    );
  }

  const receipt = await sendAndConfirmTransaction({
    account,
    transaction: prepareTransaction({
      client: thirdwebClient,
      chain: network.thirdwebChain,
      to: CREATE2_DEPLOYER,
      data,
    }),
  });
  if (receipt.status !== "success") {
    throw new RecoveryError(
      "FactoryDeployFailed",
      `Factory deployment reverted: ${receipt.transactionHash}`,
    );
  }
  if (!(await waitForCode(() => isFactoryDeployed(key)))) {
    throw new RecoveryError(
      "FactoryDeployFailed",
      `Factory code not found on ${chainName} after transaction ${receipt.transactionHash}`,
    );
  }
  return { txHash: receipt.transactionHash };
}
