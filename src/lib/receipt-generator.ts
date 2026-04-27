import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import type { TFunction } from "i18next";
import moment from "moment";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { ORDER_TYPES } from "@/lib/constants";
import { formatFiatAmount, truncateAddress } from "@/lib/utils";

/**
 * Receipt-specific color palette using theme colors
 */
const RECEIPT_COLORS = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.19 0 0)",
  primary: "oklch(0.51 0.2488 275.3)",
  success: "oklch(0.68 0.1432 164.63)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.39 0 0)",
  border: "oklch(0.92 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.19 0 0)",
} as const;

export interface ReceiptData {
  orderId: string;
  amount: string;
  currency: CurrencyType;
  fiatAmount: string;
  formattedFiatAmount: string;
  paymentDetails: {
    from?: string;
    to?: string;
  };
  timestamp: string;
  formattedTimestamp: string;
  type: (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
  recipientAddress?: string;
}

export interface ReceiptGeneratorOptions {
  showSensitiveData?: boolean;
  devicePixelRatio?: number;
}

/**
 * Transforms Order data into receipt-ready format
 */
export async function transformOrderToReceipt(
  order: Order,
  paymentFrom?: string,
  paymentTo?: string,
): Promise<ReceiptData> {
  // Get actual amounts from contract (includes fees deducted)
  const feeDetailsResult = await getOrderFeeDetails(Number(order.id)).match(
    (details) => details,
    (error) => {
      console.error("Failed to get fee details for receipt:", error);
      // Fallback to original values if contract call fails
      return {
        fixedFeePaid: 0,
        actualUsdtAmount: Number(order.amount),
        actualFiatAmount: Number(order.fiatAmount),
      };
    },
  );

  // Use actual amounts directly from contract
  const amount = feeDetailsResult.actualUsdtAmount.toString();
  const fiatAmount = feeDetailsResult.actualFiatAmount.toString();

  return {
    orderId: order.id,
    amount,
    currency: order.currency,
    fiatAmount,
    formattedFiatAmount: formatFiatAmount(fiatAmount, order.currency),
    paymentDetails: {
      from: paymentFrom,
      to: paymentTo,
    },
    timestamp: order.completedTimestamp,
    formattedTimestamp: moment
      .unix(Number(order.completedTimestamp))
      .format("DD-MM-YYYY, HH:mm:ss"),
    type: order.orderType,
    recipientAddress: order.recipientAddr,
  };
}

/**
 * Generates a receipt image using Canvas API
 */
export async function generateReceiptImage(
  receiptData: ReceiptData,
  t: TFunction,
  options: ReceiptGeneratorOptions = {},
): Promise<Blob> {
  const { devicePixelRatio = 2 } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // Receipt dimensions (optimized for mobile sharing)
  const width = 400;
  const height = 700;

  // Scale for high DPI
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Scale context for high DPI
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // Background
  ctx.fillStyle = RECEIPT_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Success icon background
  ctx.fillStyle = RECEIPT_COLORS.success;
  ctx.beginPath();
  ctx.arc(200, 100, 40, 0, 2 * Math.PI);
  ctx.fill();

  // Success checkmark
  ctx.strokeStyle = RECEIPT_COLORS.background;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(180, 100);
  ctx.lineTo(195, 115);
  ctx.lineTo(220, 85);
  ctx.stroke();

  // Main amount display
  ctx.fillStyle = RECEIPT_COLORS.primary;
  ctx.font = "bold 48px 'Outfit', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";

  if (receiptData.type === ORDER_TYPES.BUY) {
    ctx.fillText(`${receiptData.amount} USDC`, 200, 200);
  } else {
    ctx.fillText(receiptData.formattedFiatAmount, 200, 200);
  }

  // Transaction successful text
  ctx.fillStyle = RECEIPT_COLORS.success;
  ctx.font = "16px 'Outfit', system-ui, -apple-system, sans-serif";
  ctx.fillText(t("TRANSACTION_SUCCESSFUL"), 200, 240);

  // Receipt details card background
  ctx.fillStyle = RECEIPT_COLORS.muted;
  ctx.fillRect(30, 280, 340, 320);

  // Receipt details card border
  ctx.strokeStyle = RECEIPT_COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 280, 340, 320);

  // Receipt details
  const details = [
    { label: t("ORDER_ID"), value: receiptData.orderId },
    {
      label:
        receiptData.type === ORDER_TYPES.BUY ? t("YOU_PAID") : t("YOU_SENT"),
      value:
        receiptData.type === ORDER_TYPES.BUY
          ? receiptData.formattedFiatAmount
          : `${receiptData.amount} USDC`,
    },
    {
      label: t("YOU_RECEIVED"),
      value:
        receiptData.type === ORDER_TYPES.BUY
          ? `${receiptData.amount} USDC`
          : receiptData.formattedFiatAmount,
    },
  ];

  // Add payment details for all order types
  if (
    receiptData.type === ORDER_TYPES.SELL ||
    receiptData.type === ORDER_TYPES.PAY
  ) {
    if (receiptData.paymentDetails.from) {
      details.push({
        label: t("PAID_BY"),
        value: receiptData.paymentDetails.from,
      });
    }
    if (receiptData.paymentDetails.to) {
      details.push({
        label: t("PAID_TO"),
        value: receiptData.paymentDetails.to,
      });
    }
  } else if (receiptData.type === ORDER_TYPES.BUY) {
    // Add recipient address for BUY orders
    if (receiptData.recipientAddress) {
      details.push({
        label: t("RECEIVING_ADDRESS"),
        value: truncateAddress(receiptData.recipientAddress),
      });
    }

    // Add payment details for BUY orders
    if (receiptData.paymentDetails.to) {
      details.push({
        label: t("PAID_TO"),
        value: receiptData.paymentDetails.to,
      });
    }
  }

  details.push({
    label: t("DATE_AND_TIME"),
    value: receiptData.formattedTimestamp,
  });

  // Render details
  ctx.fillStyle = RECEIPT_COLORS.cardForeground;
  ctx.font = "14px 'Outfit', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";

  details.forEach((detail, index) => {
    const y = 320 + index * 35;

    // Label
    ctx.fillStyle = RECEIPT_COLORS.mutedForeground;
    ctx.fillText(detail.label, 50, y);

    // Value
    ctx.fillStyle = RECEIPT_COLORS.cardForeground;
    ctx.textAlign = "right";
    ctx.fillText(detail.value, 350, y);
    ctx.textAlign = "left";
  });

  // P2P.me logo/branding - Using actual logo SVG (matching TextLogo component)
  ctx.textAlign = "left";

  // Calculate centered position for logo+text combination
  const logoWidth = 24; // size-6 equivalent
  const gap = 4; // gap-1 equivalent
  const textWidth = 60; // estimated width of "P2P.ME" in 18px bold
  const totalWidth = logoWidth + gap + textWidth;
  const startX = (width - totalWidth) / 2; // Center horizontally

  // Draw the P2P.me logo SVG path
  const logoPath = new Path2D(
    "M13.4992 0.92952H23.0781L23.0751 16.0377C23.0751 16.3142 23.0423 16.7652 22.9968 17.0381C22.3274 21.0307 19.4142 23.8918 15.3694 23.897C12.3353 23.9008 5.8469 23.897 5.8469 23.897C5.8469 23.897 5.84391 17.2669 5.84839 14.4051C5.85062 13.1401 6.72653 12.2045 7.94163 12.168C9.14181 12.1315 10.7945 12.1003 10.7945 12.1003V14.0868L15.959 10.285C15.959 10.285 10.5545 10.3251 7.90286 10.3998C5.54871 10.4661 4.02574 12.4528 4.06003 14.5162C4.11818 18.0713 4.07643 22.0893 4.07643 25.6451H12.839L9.54825 29.0705H0C0 29.0705 0.0069885 19.2774 0.00624305 14.4081C0.00624305 14.0622 0.0286067 13.7148 0.066625 13.3712C0.516881 9.30174 3.984 6.17008 8.07879 6.14771C10.9891 6.13206 17.1614 6.13891 17.1614 6.13891C17.1614 9.199 17.1629 12.6227 17.1614 15.6828C17.1607 16.9427 16.2475 17.8693 14.9922 17.8752C13.5929 17.8819 11.8491 17.8774 11.8491 17.8774V15.9505L7.07818 19.6472C7.07818 19.6472 12.1974 19.6845 15.0197 19.6472C17.3128 19.6166 18.9475 17.8872 18.9475 15.5844C18.9475 11.9913 18.9475 4.32731 18.9475 4.32731H10.2578L13.4992 0.92952Z",
  );

  // Position and scale the logo (SVG viewBox is 0 0 24 30, scale to 24px width)
  ctx.save();
  ctx.translate(startX, 635); // Position logo at calculated start
  ctx.scale(1, 0.8); // Scale to 24px width, slightly compressed height
  ctx.fillStyle = RECEIPT_COLORS.primary;
  ctx.fill(logoPath);
  ctx.restore();

  // Company text (positioned with gap-1 spacing like in TextLogo component)
  ctx.fillStyle = RECEIPT_COLORS.foreground;
  ctx.font = "bold 18px 'Outfit', system-ui, -apple-system, sans-serif"; // text-lg font-bold
  ctx.fillText("P2P.ME", startX + logoWidth + gap, 655);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(t("FAILED_TO_GENERATE_RECEIPT_IMAGE")));
        }
      },
      "image/png",
      0.9,
    );
  });
}

/**
 * Generates engaging, shareable text for different order types
 */
export function generateShareText(
  receiptData: ReceiptData,
  t: TFunction,
): string {
  switch (receiptData.type) {
    case ORDER_TYPES.BUY:
      return t("SHARE_TEXT_BUY", {
        amount: receiptData.amount,
        fiatAmount: receiptData.formattedFiatAmount,
      });
    case ORDER_TYPES.SELL:
      return t("SHARE_TEXT_SELL", {
        amount: receiptData.amount,
        fiatAmount: receiptData.formattedFiatAmount,
      });
    case ORDER_TYPES.PAY:
      return t("SHARE_TEXT_PAY", {
        amount: receiptData.amount,
        fiatAmount: receiptData.formattedFiatAmount,
      });
    default:
      return t("SHARE_TEXT_DEFAULT");
  }
}
