import { getStoredQrPayload } from "@p2pdotme/sdk/country";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import {
  formatPaymentIdForDisplay,
  getPaymentIdDisplayParts,
} from "@/lib/compound-payment-id";
import {
  type CurrencyType,
  uploadsPaymentQR,
  usesPackedPaymentId,
} from "@/lib/constants";

/**
 * Sell-order row for the user's receiving payment details.
 * Catalog fields each get their own row. Packed currencies also show the
 * uploaded QR when the country flag allows it. Never dumps the blob.
 */
export function SellReceivingPaymentRow({
  currency,
  address,
  paymentAddressName,
}: {
  currency: CurrencyType | string;
  address: string | null | undefined;
  paymentAddressName: string;
}) {
  const { t } = useTranslation();
  const addr = address?.trim() || "";
  const code = currency as CurrencyType;
  const packed = usesPackedPaymentId(code);
  const qrValue =
    packed && uploadsPaymentQR(code) ? getStoredQrPayload(code, addr) : null;
  const catalogParts = addr ? getPaymentIdDisplayParts(addr, code) : [];

  if (qrValue || catalogParts.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-medium">
          {t("RECEIVING_PAYMENT_ADDRESS", {
            paymentAddressName: t(paymentAddressName),
          })}
        </span>
        {qrValue ? (
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="rounded-xl border-2 border-primary bg-white p-3">
              <QRCodeSVG value={qrValue} size={160} level="L" />
            </div>
          </div>
        ) : null}
        {catalogParts.map((part) => (
          <div
            key={part.key}
            className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {t(part.labelKey)}
            </span>
            <span className="max-w-[55%] truncate text-right text-xs">
              {part.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 font-medium">
        {t("RECEIVING_PAYMENT_ADDRESS", {
          paymentAddressName: t(paymentAddressName),
        })}{" "}
      </span>
      <span className="max-w-[55%] truncate text-right text-muted-foreground text-xs">
        {!addr ? t("NOT_FOUND") : formatPaymentIdForDisplay(addr, code)}
      </span>
    </div>
  );
}
