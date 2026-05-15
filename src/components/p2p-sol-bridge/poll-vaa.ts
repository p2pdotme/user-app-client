import { WORMHOLE } from "./constants";

export function parseSequenceFromLogs(logMessages: string[]): string {
  const prefix = "Program log: Sequence: ";
  const line = logMessages.find((m) => m.startsWith(prefix));
  if (!line) throw new Error("Sequence not found in tx logs — bridge may not have reached Token Bridge CPI");
  return line.replace(prefix, "");
}

export async function fetchVaaOnce(
  emitterHex: string,
  sequence: string,
): Promise<string | null> {
  const url = `${WORMHOLE.WORMHOLESCAN_API}/api/v1/vaas/1/${emitterHex}/${sequence}`;
  try {
    const res = await fetch(url);
    if (res.status !== 200) return null;
    const json = await res.json();
    return (json?.data?.vaa as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function pollVaa(
  emitterHex: string,
  sequence: string,
  onElapsed?: (ms: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const start = Date.now();
  while (!signal?.aborted) {
    const vaaB64 = await fetchVaaOnce(emitterHex, sequence);
    if (vaaB64) return vaaB64;
    onElapsed?.(Date.now() - start);
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));
  }
  throw new DOMException("VAA polling aborted", "AbortError");
}

export function vaaB64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
