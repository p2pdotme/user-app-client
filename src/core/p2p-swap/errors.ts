export function getBackendErrorKey(message: string): string | undefined {
  // Case 1: message is already an UPPER_SNAKE_CASE key
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) {
    return `P2P_SWAP_ERROR_${message}`;
  }
  return message;
}
