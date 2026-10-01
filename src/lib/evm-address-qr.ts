import { type Address, getAddress, isAddress } from "viem";

const EVM_ADDRESS_PATTERN = /0x[0-9a-fA-F]{40}/;

/**
 * Extracts a recipient EVM address from a scanned wallet QR payload.
 *
 * Handles a bare `0x…` address and EIP-681 payment links
 * (`ethereum:0x…@8453`, `base:0x…`). For an ERC-20 transfer link
 * (`ethereum:<token>@8453/transfer?address=<recipient>&uint256=…`) the
 * recipient is the `address` query param, not the token contract.
 * Returns `null` when no valid address is found.
 */
export function extractEvmAddressFromQr(data: string): Address | null {
  const trimmed = data.trim();
  if (!trimmed) return null;

  const [, query = ""] = trimmed.split("?");
  const recipient = new URLSearchParams(query).get("address");
  const candidate =
    recipient ?? trimmed.match(EVM_ADDRESS_PATTERN)?.[0] ?? null;

  if (!candidate || !isAddress(candidate, { strict: false })) return null;
  return getAddress(candidate as Address);
}
