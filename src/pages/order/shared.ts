export const BUY_FLOW_PROGRESS_TEXT = [
  {
    key: "PLACED",
    activeTextKey: "MERCHANT_ACCEPTING",
    completedTextKey: "MERCHANT_ACCEPTED",
  },
  {
    key: "ACCEPTED",
    activeTextKey: "PAY_MERCHANT",
    completedTextKey: "PAID_MERCHANT",
  },
  {
    key: "PAID",
    activeTextKey: "PROCESSING_USDC",
    completedTextKey: "USDC_RECEIVED",
  },
] as const;

export const SELL_FLOW_PROGRESS_TEXT = [
  {
    key: "PLACED",
    activeTextKey: "MERCHANT_ACCEPTING",
    completedTextKey: "MERCHANT_ACCEPTED",
  },
  {
    key: "ACCEPTED",
    activeTextKey: "SENDING_PAYMENT_DETAILS",
    completedTextKey: "DETAILS_SENT",
  },
  {
    key: "PAID",
    activeTextKey: "PROCESSING_PAYMENT",
    completedTextKey: "MERCHANT_PAID",
  },
] as const;

export const PAY_FLOW_PROGRESS_TEXT = [
  {
    key: "PLACED",
    activeTextKey: "MERCHANT_ACCEPTING",
    completedTextKey: "MERCHANT_ACCEPTED",
  },
  {
    key: "ACCEPTED",
    activeTextKey: "SCAN_UPLOAD_QR",
    completedTextKey: "QR_PROCESSED",
  },
  {
    key: "PAID",
    activeTextKey: "PROCESSING_PAYMENT",
    completedTextKey: "MERCHANT_PAID",
  },
] as const;

export type BuyFlowStep = (typeof BUY_FLOW_PROGRESS_TEXT)[number]["key"];
export type SellFlowStep = (typeof SELL_FLOW_PROGRESS_TEXT)[number]["key"];
export type PayFlowStep = (typeof PAY_FLOW_PROGRESS_TEXT)[number]["key"];
