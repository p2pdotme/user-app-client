export type P2PErrorDomain =
  | "usdc"
  | "p2p-config"
  | "order"
  | "reputation-manager"
  | "validation"
  | "subgraph";

export type P2PErrorCode =
  | "P2PPrepareFunctionCallError"
  | "P2PValidateError"
  | "P2PSubgraphError";

export interface P2PError<D extends P2PErrorDomain = P2PErrorDomain> {
  readonly domain: D; // where the error occurred
  readonly code: P2PErrorCode; // what kind of error it is
  readonly message: string; // Human/developer-readable message
  readonly cause?: unknown; // Original error for debugging
  readonly context?: Record<string, unknown>; // Additional relevant data
}

/**
 * Creates a generic P2PError
 * @param message - Human/developer-readable message
 * @param options - Additional options
 * @returns P2PError
 */
export function createP2PError<D extends P2PErrorDomain>(
  message: string,
  options: {
    domain: D;
    code: P2PErrorCode;
    cause: unknown;
    context: Record<string, unknown>;
  },
) {
  return {
    domain: options.domain,
    code: options.code,
    message,
    cause: options.cause,
    context: options.context,
  };
}
