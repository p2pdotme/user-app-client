import { describe, expect, it } from "vitest";
import { isUsdc, parseTransfersCsv, USDC_BASE } from "@/tax/core/onchain";

const W = `0x${"ab".repeat(20)}`;
const X = `0x${"cd".repeat(20)}`;
const H1 = `0x${"1".repeat(64)}`;
const H2 = `0x${"2".repeat(64)}`;

describe("explorer CSV import", () => {
  it("reads the current BaseScan ERC-20 export", () => {
    const csv = [
      '"Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"',
      `"${H1}","30000000","1780000000","2026-05-28 20:26:40","${X}","${W}","1,234.5","1234.5","${USDC_BASE}","USD Coin","USDC"`,
    ].join("\n");
    const r = parseTransfersCsv(`﻿${csv}`)._unsafeUnwrap();
    expect(r.skipped).toBe(0);
    expect(r.transfers).toHaveLength(1);
    const [t] = r.transfers;
    expect(t.amount.toFixed(2)).toBe("1234.50");
    expect(t.time.toISOString()).toBe("2026-05-28T20:26:40.000Z");
    expect(t.from).toBe(X);
    expect(t.to).toBe(W);
    expect(isUsdc(t)).toBe(true);
  });

  it("reads the older BaseScan export (Txhash / Value) using DateTime when no timestamp", () => {
    const csv = [
      "Txhash,Blockno,DateTime,From,To,Value,ContractAddress,TokenName,TokenSymbol",
      `${H1},1,2026-05-28 20:26:40,${X},${W},10,${USDC_BASE},USD Coin,USDC`,
    ].join("\n");
    const [t] = parseTransfersCsv(csv)._unsafeUnwrap().transfers;
    expect(t.time.toISOString()).toBe("2026-05-28T20:26:40.000Z");
    expect(t.amount.toString()).toBe("10");
  });

  it("reads the Blockscout export", () => {
    const csv = [
      "TxHash,BlockNumber,UnixTimestamp,FromAddress,ToAddress,ContractAddress,Type,TokenSymbol,TokensTransferred,TransactionFee,Status",
      `${H2},1,1780000000,${W},${X},${USDC_BASE},OUT,USDC,25.75,0.0001,ok`,
    ].join("\n");
    const [t] = parseTransfersCsv(csv)._unsafeUnwrap().transfers;
    expect(t.amount.toString()).toBe("25.75");
    expect(t.from).toBe(W);
  });

  it("skips malformed rows and counts them", () => {
    const csv = [
      "Transaction Hash,UnixTimestamp,From,To,TokenValue,ContractAddress,TokenSymbol",
      `${H1},1780000000,${X},${W},5,${USDC_BASE},USDC`,
      `not-a-hash,1780000000,${X},${W},5,${USDC_BASE},USDC`,
      `${H2},1780000000,${X},${W},-5,${USDC_BASE},USDC`,
    ].join("\n");
    const r = parseTransfersCsv(csv)._unsafeUnwrap();
    expect(r.transfers).toHaveLength(1);
    expect(r.skipped).toBe(2);
  });

  it("rejects a file without the needed columns", () => {
    const r = parseTransfersCsv("a,b,c\n1,2,3");
    expect(r.isErr()).toBe(true);
    expect(r._unsafeUnwrapErr().code).toBe("OCCsvError");
  });

  it("decides USDC by contract, never by a look-alike symbol", () => {
    expect(isUsdc({ token: `0x${"9".repeat(40)}` })).toBe(false);
    expect(isUsdc({ token: USDC_BASE })).toBe(true);
    const noContract = parseTransfersCsv(
      `Txhash,UnixTimestamp,From,To,Value,TokenSymbol\n${H1},1780000000,${X},${W},5,USDC`,
    );
    expect(noContract.isErr()).toBe(true);
  });
});
