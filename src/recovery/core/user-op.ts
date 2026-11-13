import {
  type Address,
  encodeAbiParameters,
  type Hex,
  keccak256,
  toHex,
} from "viem";

/** ERC-4337 v0.6 UserOperation. */
export type UserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
};

/** A UserOperation as bundlers expect it: every number hex-encoded. */
export type RpcUserOperation = {
  [K in keyof UserOperation]: UserOperation[K] extends bigint
    ? Hex
    : UserOperation[K];
};

/** Placeholder signature used while estimating gas and requesting sponsorship. */
export const DUMMY_SIGNATURE: Hex =
  "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";

function packUserOp(userOp: UserOperation): Hex {
  return encodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "bytes32" },
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      keccak256(userOp.paymasterAndData),
    ],
  );
}

/** The hash the account owner signs. The signature field is not part of it. */
export function getUserOpHash(
  userOp: UserOperation,
  entryPoint: Address,
  chainId: number,
): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
      [keccak256(packUserOp(userOp)), entryPoint, BigInt(chainId)],
    ),
  );
}

export function formatUserOpForBundler(
  userOp: UserOperation,
): RpcUserOperation {
  return {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: toHex(userOp.callGasLimit),
    verificationGasLimit: toHex(userOp.verificationGasLimit),
    preVerificationGas: toHex(userOp.preVerificationGas),
    maxFeePerGas: toHex(userOp.maxFeePerGas),
    maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}

export function isSponsored(userOp: { paymasterAndData: Hex }): boolean {
  return userOp.paymasterAndData !== "0x";
}
