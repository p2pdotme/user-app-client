import { describe, expect, it } from "vitest";
import { D, fromUnits, parseAmount, sum } from "@/tax/lib/decimal";

describe("decimal arithmetic", () => {
  it("adds and subtracts exactly where floats do not", () => {
    expect(new D("0.1").plus("0.2").toString()).toBe("0.3");
    expect(new D("0.3").minus("0.1").toString()).toBe("0.2");
    expect(new D(1).minus("0.9").toString()).toBe("0.1");
    expect(sum([new D("0.1"), new D("0.2"), new D("0.7")]).toString()).toBe(
      "1",
    );
  });

  it("multiplies and divides, rounding half-up at the 30th place", () => {
    expect(new D("65100").minus(new D("700").mul("89.5")).toString()).toBe(
      "2450",
    );
    expect(new D(1).div(3).toString()).toBe(`0.${"3".repeat(30)}`);
    expect(new D(2).div(3).toString()).toBe(`0.${"6".repeat(29)}7`);
    expect(new D(-2).div(3).toString()).toBe(`-0.${"6".repeat(29)}7`);
    expect(new D(1).div(3).mul(3).toFixed(6)).toBe("1.000000");
    expect(new D("1499.999974").div("15.262515").toFixed(2)).toBe("98.28");
  });

  it("keeps large amounts exact", () => {
    const big = new D("123456789012345678901234567890.123456");
    expect(big.plus("0.000001").toString()).toBe(
      "123456789012345678901234567890.123457",
    );
    expect(big.mul(2).toString()).toBe("246913578024691357802469135780.246912");
  });

  it("rounds for display half away from zero", () => {
    expect(new D("2.345").toFixed(2)).toBe("2.35");
    expect(new D("-2.345").toFixed(2)).toBe("-2.35");
    expect(new D("2.344999").toFixed(2)).toBe("2.34");
    expect(new D("999.9999995").toFixed(6)).toBe("1000.000000");
    expect(new D("0.5").toFixed(0)).toBe("1");
    expect(new D("-0.004").toFixed(2)).toBe("0.00");
    expect(new D(7).toFixed(2)).toBe("7.00");
  });

  it("rounds to decimal places half-up by default, or up", () => {
    expect(new D("1.2345").toDecimalPlaces(2).toString()).toBe("1.23");
    expect(new D("1.235").toDecimalPlaces(2).toString()).toBe("1.24");
    expect(new D("1.230001").toDecimalPlaces(2, D.ROUND_UP).toString()).toBe(
      "1.24",
    );
    expect(new D("1.23").toDecimalPlaces(2, D.ROUND_UP).toString()).toBe(
      "1.23",
    );
    expect(new D("-1.230001").toDecimalPlaces(2, D.ROUND_UP).toString()).toBe(
      "-1.24",
    );
  });

  it("compares values and numbers", () => {
    const a = new D("10.5");
    expect(a.greaterThan(10)).toBe(true);
    expect(a.greaterThan("10.5")).toBe(false);
    expect(a.greaterThanOrEqualTo("10.5")).toBe(true);
    expect(a.lessThan(new D(11))).toBe(true);
    expect(a.lessThanOrEqualTo(10)).toBe(false);
    expect(a.comparedTo(11)).toBe(-1);
    expect(a.comparedTo("10.50")).toBe(0);
    expect(a.comparedTo(-3)).toBe(1);
    expect(new D("0.000").isZero()).toBe(true);
    expect(new D("-0.01").isNegative()).toBe(true);
    expect(new D("-0.01").abs().toString()).toBe("0.01");
    expect(new D(5).neg().toString()).toBe("-5");
  });

  it("parses numbers, signs, bare points and exponents", () => {
    expect(new D(9_999.99).toString()).toBe("9999.99");
    expect(new D(-500).toString()).toBe("-500");
    expect(new D(" +1.50 ").toString()).toBe("1.5");
    expect(new D(".5").toString()).toBe("0.5");
    expect(new D("5.").toString()).toBe("5");
    expect(new D("1.5e3").toString()).toBe("1500");
    expect(new D(1e-7).toString()).toBe("0.0000001");
    expect(new D(1e21).toString()).toBe("1000000000000000000000");
    expect(new D(new D("3.25")).toString()).toBe("3.25");
    expect(new D("1.25").toNumber()).toBe(1.25);
  });

  it("rejects text that is not a number", () => {
    for (const bad of ["", ".", "abc", "1,000", "1.2.3", "0x10", "NaN"]) {
      expect(() => new D(bad)).toThrow("Invalid decimal");
    }
    expect(() => new D(Number.NaN)).toThrow("Invalid decimal");
    expect(() => new D(Number.POSITIVE_INFINITY)).toThrow("Invalid decimal");
    expect(() => new D(1).div(0)).toThrow("Division by zero");
  });

  it("raises to whole powers only", () => {
    expect(new D(10).pow(0).toString()).toBe("1");
    expect(new D(10).pow(18).toString()).toBe("1000000000000000000");
    expect(new D("1.5").pow(2).toString()).toBe("2.25");
    expect(() => new D(2).pow(0.5)).toThrow("Unsupported exponent");
    expect(() => new D(2).pow(-1)).toThrow("Unsupported exponent");
  });
});

describe("amount helpers", () => {
  it("scales subgraph integers by their decimals", () => {
    expect(fromUnits("15262515", 6).toString()).toBe("15.262515");
    expect(fromUnits("1", 18).toString()).toBe("0.000000000000000001");
    expect(fromUnits("-2500000", 6).toString()).toBe("-2.5");
    expect(fromUnits(null, 6).isZero()).toBe(true);
    expect(fromUnits("", 6).isZero()).toBe(true);
    expect(() => fromUnits("1.5", 6)).toThrow("Invalid integer amount");
  });

  it("parses user amounts, refusing negatives and junk", () => {
    expect(parseAmount(" 1,23,456.78 ")?.toString()).toBe("123456.78");
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });
});
