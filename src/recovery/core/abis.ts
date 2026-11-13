import { parseAbi } from "viem";

/** EntryPoint v0.6: nonce lookup plus the calls used for direct submission. */
export const ENTRY_POINT_ABI = parseAbi([
  "struct UserOperation { address sender; uint256 nonce; bytes initCode; bytes callData; uint256 callGasLimit; uint256 verificationGasLimit; uint256 preVerificationGas; uint256 maxFeePerGas; uint256 maxPriorityFeePerGas; bytes paymasterAndData; bytes signature; }",
  "function getNonce(address sender, uint192 key) view returns (uint256)",
  "function handleOps(UserOperation[] ops, address beneficiary)",
  "function depositTo(address account) payable",
  "function balanceOf(address account) view returns (uint256)",
  "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)",
  "error FailedOp(uint256 opIndex, string reason)",
]);

export const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const SMART_ACCOUNT_ABI = parseAbi([
  "function execute(address dest, uint256 value, bytes func)",
]);

export const ACCOUNT_FACTORY_ABI = parseAbi([
  "function getAddress(address admin, bytes data) view returns (address)",
  "function createAccount(address admin, bytes data) returns (address)",
]);
