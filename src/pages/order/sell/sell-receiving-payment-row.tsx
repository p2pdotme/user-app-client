import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { formatPaymentIdForDisplay } from "@/lib/compound-payment-id";
import type { CurrencyType } from "@/lib/constants";
import { isValidPeruQrPayload, isValidPeruvianCci } from "@/lib/peru-qr";

/**
 * Sell-order row for the user's receiving payment details.
 * PEN EMVCo → QR only. PEN CCI → 20 digits. Other currencies → plain text.
 */
export function SellReceivingPaymentRow({
  currency,
  address,
  paymentAddressName,
}: {
  currency: CurrencyType | string;
  address: string | null | undefined;
  /** i18n key for the payment method name (e.g. currency.paymentAddressName). */
  paymentAddressName: string;
}) {
  const { t } = useTranslation();
  const addr = address?.trim() || "";
  const isPenQr = currency === "PEN" && !!addr && isValidPeruQrPayload(addr);
  const isPenCci = currency === "PEN" && !!addr && isValidPeruvianCci(addr);

  if (isPenQr) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-medium">
          {t("RECEIVING_PAYMENT_ADDRESS", {
            paymentAddressName: t(paymentAddressName),
          })}
        </span>
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="rounded-xl border-2 border-primary bg-white p-3">
            <QRCodeSVG value={addr} size={160} level="L" />
          </div>
        </div>
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
        {!addr
          ? t("NOT_FOUND")
          : isPenCci
            ? addr
            : formatPaymentIdForDisplay(addr, currency as CurrencyType)}
      </span>
    </div>
  );
}
