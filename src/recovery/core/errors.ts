/**
 * Failures the recovery UI reacts to specifically. Anything else surfaces as
 * `Unknown` with the underlying message.
 */
export type RecoveryErrorCode =
  /** No wallet is connected, or it exposes no signer. */
  | "WalletNotConnected"
  /** The account factory has no code on the network yet. */
  | "FactoryNotDeployed"
  /** The smart account address could not be read from the factory. */
  | "DeriveFailed"
  /** Nobody sponsored the gas and the paying address has no native coin. */
  | "InsufficientGas"
  /** The factory or one of its prerequisites cannot be deployed. */
  | "FactoryDeployFailed"
  /** The operation was mined but reverted. */
  | "ExecutionFailed"
  /** The account is already deployed. */
  | "AlreadyDeployed"
  | "Unknown";

export class RecoveryError extends Error {
  readonly code: RecoveryErrorCode;
  /** Address that needs native coin, for `InsufficientGas`. */
  readonly fundingAddress?: string;

  constructor(
    code: RecoveryErrorCode,
    message: string,
    options: { cause?: unknown; fundingAddress?: string } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "RecoveryError";
    this.code = code;
    this.fundingAddress = options.fundingAddress;
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    // JSON.stringify returns undefined for undefined, functions and symbols
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

/** EntryPoint's "account didn't pay prefund" revert, however it is reported. */
export function isPrefundError(error: unknown): boolean {
  const message = messageOf(error);
  return message.includes("AA21") || message.includes("didn't pay prefund");
}

/** Normalises anything thrown into a RecoveryError. */
export function toRecoveryError(
  error: unknown,
  fundingAddress?: string,
): RecoveryError {
  if (error instanceof RecoveryError) return error;
  if (isPrefundError(error)) {
    return new RecoveryError("InsufficientGas", messageOf(error), {
      cause: error,
      fundingAddress,
    });
  }
  return new RecoveryError("Unknown", messageOf(error), { cause: error });
}
