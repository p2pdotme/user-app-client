import { describe, expect, it } from "vitest";
import { isUpiMandateQr } from "@/lib/qr-parsers/upi-mandate";

const MANDATE_QR =
  "upi://mandate?ver=01&pa=anomaly.cfp@cashfreensdlpb&pn=Anomaly&tr=enroll403842870&am=15000.00&cu=INR&amrule=MAX&mode=04&recur=ASPRESENTED&validitystart=18112026&validityend=15112036&mc=5734&txnType=CREATE&tn=OPENCODE&fam=943.70&purpose=14&block=N&rev=Y&orgid=000000";

describe("isUpiMandateQr", () => {
  it.each([
    ["upi://mandate", MANDATE_QR],
    ["uppercase scheme", MANDATE_QR.replace("upi://mandate", "UPI://MANDATE")],
    ["pay + recur", "upi://pay?pa=foo@bar&am=10&recur=MONTHLY"],
    ["pay + amrule", "upi://pay?pa=foo@bar&amrule=MAX"],
    ["scheme-less + validityend", "pa=foo@bar&validityend=15112036"],
  ])("flags %s", (_label, qr) => {
    expect(isUpiMandateQr(qr)).toBe(true);
  });

  it.each([
    ["plain pay", "upi://pay?pa=merchant@okaxis&am=800&cu=INR"],
    ["uppercase pay", "UPI://PAY?pa=merchant@okaxis"],
    ["scheme-less pay", "pa=merchant@okaxis&am=10"],
    ["pay with txnType", "upi://pay?pa=foo@bar&txnType=PAY"],
    ["non-mandate intent", "upi://collect?pa=foo@bar&am=10"],
    [
      "fonepay EMVCo",
      "0002010102110216427142002163748726400011fonepay.com5802NP6304ecfd",
    ],
  ])("allows %s", (_label, qr) => {
    expect(isUpiMandateQr(qr)).toBe(false);
  });
});
