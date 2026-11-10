/**
 * Structured application errors with the same shape as user-app-client's AppError.
 * Errors travel through neverthrow `Result`s instead of being thrown.
 */
export type Domain = "Subgraph" | "ManualData" | "Onchain" | "Utils";

export type ErrorCode =
  | "ValidationError"
  | "SGInvalidAddress"
  | "SGNetworkError"
  | "SGParseError"
  | "SGTooManyPages"
  | "ImportParseError"
  | "ImportVersionError"
  | "OCNetworkError"
  | "OCParseError"
  | "OCTooManyPages"
  | "OCCsvError";

export interface AppError<D extends Domain = Domain> {
  readonly domain: D; // where the error occurred
  readonly code: ErrorCode; // what kind of error it is
  readonly message: string; // Human/developer-readable message
  readonly cause?: unknown; // Original error for debugging
  readonly context?: Record<string, unknown>; // Additional relevant data
}

export function createAppError<D extends Domain = Domain>(
  message: string,
  options: {
    domain: D;
    code: ErrorCode;
    cause?: unknown;
    context?: Record<string, unknown>;
  },
): AppError<D> {
  return {
    domain: options.domain,
    code: options.code,
    message,
    cause: options.cause,
    context: options.context,
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "domain" in value &&
    "code" in value &&
    "message" in value
  );
}

/** User-facing copy for each error code (never leaks internals). */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  ValidationError: "Some data could not be validated.",
  SGInvalidAddress: "Enter a valid wallet address.",
  SGNetworkError:
    "The P2P.me subgraph did not respond. Check your connection and try again.",
  SGParseError:
    "The P2P.me subgraph returned data in an unexpected format. Please try again later.",
  SGTooManyPages: "This wallet has too many orders to load in one go.",
  ImportParseError: "This file is not valid JSON.",
  ImportVersionError: "This file was not exported by this app.",
  OCNetworkError:
    "The block explorer did not respond. Try again, or upload the CSV you download from BaseScan instead.",
  OCParseError:
    "The block explorer returned data in an unexpected format. Upload the CSV you download from BaseScan instead.",
  OCTooManyPages:
    "This wallet has too many token transfers to load in one go. Upload the CSV you download from BaseScan instead.",
  OCCsvError:
    "This file does not look like a token-transfer CSV from BaseScan or Blockscout.",
};
