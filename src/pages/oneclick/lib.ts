// Convert a human-entered decimal string to base units of the asset.
// Returns null for invalid or zero input.
export function toBaseUnits(value: string, decimals: number): string | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const whole = match[1] ?? "0";
  const frac = (match[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  const units = BigInt(whole + frac);
  return units === 0n ? null : units.toString();
}
