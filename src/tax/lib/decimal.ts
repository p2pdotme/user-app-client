/**
 * Exact decimal arithmetic for ALL money and token math, on native bigint.
 * Never use JS floats.
 *
 * A value is held as an integer count of 10^-30 units, so plus, minus and
 * compare are exact and mul / div are rounded half-up at the 30th decimal
 * place. INR needs 2 dp and USDC 6 dp, so intermediate results never lose
 * precision that could reach a displayed figure. The surface mirrors the
 * subset of decimal.js the tax engine uses.
 */
const SCALE_DP = 30;
const SCALE = 10n ** BigInt(SCALE_DP);

type Rounding = "HALF_UP" | "UP";
export type DecInput = D | string | number;

const NUMERIC = /^([+-])?(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

/** Integer division with the remainder rounded half away from zero, or up. */
function divRound(n: bigint, d: bigint, mode: Rounding = "HALF_UP"): bigint {
  if (d === 0n) throw new RangeError("Division by zero");
  const negative = n < 0n !== d < 0n;
  const num = n < 0n ? -n : n;
  const den = d < 0n ? -d : d;
  const quotient = num / den;
  const remainder = num % den;
  const bump = mode === "UP" ? remainder > 0n : remainder * 2n >= den;
  const magnitude = bump ? quotient + 1n : quotient;
  return negative ? -magnitude : magnitude;
}

function parseUnits(input: string | number): bigint {
  const text = typeof input === "number" ? String(input) : input.trim();
  const match = NUMERIC.exec(text);
  const int = match?.[2] ?? "";
  const frac = match?.[3] ?? "";
  if (!match || int.length + frac.length === 0) {
    throw new Error(`Invalid decimal: "${text}"`);
  }
  const sign = match[1] === "-" ? -1n : 1n;
  const shift = BigInt(SCALE_DP - frac.length + Number(match[4] ?? 0));
  const digits = BigInt(int + frac);
  const units =
    shift >= 0n ? digits * 10n ** shift : divRound(digits, 10n ** -shift);
  return sign * units;
}

/** An already-scaled value, for results built inside this module. */
class Units {
  constructor(readonly value: bigint) {}
}

export class D {
  /** Round half away from zero (the default everywhere). */
  static readonly ROUND_HALF_UP: Rounding = "HALF_UP";
  /** Round away from zero. */
  static readonly ROUND_UP: Rounding = "UP";

  /** The value × 10^30 */
  private readonly units: bigint;

  constructor(value: DecInput | Units) {
    this.units = value instanceof Units ? value.value : D.unitsOf(value);
  }

  private static of(units: bigint): D {
    return new D(new Units(units));
  }

  private static unitsOf(value: DecInput): bigint {
    return value instanceof D ? value.units : parseUnits(value);
  }

  plus(other: DecInput): D {
    return D.of(this.units + D.unitsOf(other));
  }

  minus(other: DecInput): D {
    return D.of(this.units - D.unitsOf(other));
  }

  mul(other: DecInput): D {
    return D.of(divRound(this.units * D.unitsOf(other), SCALE));
  }

  div(other: DecInput): D {
    return D.of(divRound(this.units * SCALE, D.unitsOf(other)));
  }

  /** Raise to a non-negative whole power. */
  pow(exponent: number): D {
    if (!Number.isInteger(exponent) || exponent < 0) {
      throw new RangeError(`Unsupported exponent: ${exponent}`);
    }
    let result = D.of(SCALE);
    for (let i = 0; i < exponent; i++) result = result.mul(this);
    return result;
  }

  neg(): D {
    return D.of(-this.units);
  }

  abs(): D {
    return this.units < 0n ? this.neg() : this;
  }

  comparedTo(other: DecInput): number {
    const b = D.unitsOf(other);
    return this.units === b ? 0 : this.units < b ? -1 : 1;
  }

  lessThan(other: DecInput): boolean {
    return this.units < D.unitsOf(other);
  }

  lessThanOrEqualTo(other: DecInput): boolean {
    return this.units <= D.unitsOf(other);
  }

  greaterThan(other: DecInput): boolean {
    return this.units > D.unitsOf(other);
  }

  greaterThanOrEqualTo(other: DecInput): boolean {
    return this.units >= D.unitsOf(other);
  }

  isZero(): boolean {
    return this.units === 0n;
  }

  isNegative(): boolean {
    return this.units < 0n;
  }

  /** Round to `dp` decimal places. */
  toDecimalPlaces(dp: number, mode: Rounding = D.ROUND_HALF_UP): D {
    if (dp >= SCALE_DP) return this;
    const step = 10n ** BigInt(SCALE_DP - dp);
    return D.of(divRound(this.units, step, mode) * step);
  }

  /** Plain notation with exactly `dp` decimal places (rounded half-up). */
  toFixed(dp: number): string {
    const rounded = this.toDecimalPlaces(dp).units;
    const digits = (rounded < 0n ? -rounded : rounded)
      .toString()
      .padStart(SCALE_DP + 1, "0");
    const int = digits.slice(0, -SCALE_DP);
    const frac = digits.slice(-SCALE_DP).slice(0, dp).padEnd(dp, "0");
    const sign = rounded < 0n ? "-" : "";
    return `${sign}${int}${dp > 0 ? `.${frac}` : ""}`;
  }

  /** Plain notation with no trailing zeros. */
  toString(): string {
    const fixed = this.toFixed(SCALE_DP);
    return fixed.replace(/0+$/, "").replace(/\.$/, "");
  }

  toNumber(): number {
    return Number(this.toString());
  }
}

export type Dec = D;

export const ZERO: Dec = new D(0);

/** Parse untrusted user text into a non-negative Decimal, or null if invalid. */
export function parseAmount(input: string): Dec | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return new D(trimmed);
}

/** Scale an integer string from the subgraph (e.g. "15262515") by `decimals`. */
export function fromUnits(
  raw: string | null | undefined,
  decimals: number,
): Dec {
  if (raw === null || raw === undefined || raw === "") return ZERO;
  if (!/^-?\d+$/.test(raw))
    throw new Error(`Invalid integer amount from subgraph: "${raw}"`);
  return new D(raw).div(new D(10).pow(decimals));
}

export function sum(values: readonly Dec[]): Dec {
  return values.reduce<Dec>((acc, v) => acc.plus(v), ZERO);
}

export function decMin(a: Dec, b: Dec): Dec {
  return a.lessThan(b) ? a : b;
}

export function decMax(a: Dec, b: Dec): Dec {
  return a.greaterThan(b) ? a : b;
}
