import {
  assignStoredPaymentIdToFieldValues,
  type CurrencyCode,
  getStoredQrPayload,
  packStoredPaymentId,
  uploadsPaymentQR,
} from "@p2pdotme/sdk/country";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PaymentQrUpload } from "@/components/payment-qr-upload";
import { Input } from "@/components/ui/input";
import { PAYMENT_ID_FIELDS } from "@/lib/constants";

/**
 * Catalog-driven payment input: typed fields, then optional QR upload below.
 * Local drafts stay in state while typing; pack only keeps valid fields.
 */
export function PackedPaymentInput({
  currency,
  value,
  onChange,
}: {
  currency: CurrencyCode;
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const fields = PAYMENT_ID_FIELDS[currency] ?? [];
  const allowQr = uploadsPaymentQR(currency);
  const qr = allowQr ? (getStoredQrPayload(currency, value) ?? "") : "";
  const [manualValues, setManualValues] = useState(() =>
    assignStoredPaymentIdToFieldValues(currency, value),
  );
  const lastEmitted = useRef(value || "");

  useEffect(() => {
    if ((value || "") === lastEmitted.current) return;
    lastEmitted.current = value || "";
    setManualValues(assignStoredPaymentIdToFieldValues(currency, value));
  }, [currency, value]);

  const emit = (nextQr: string, nextManual: Record<string, string>) => {
    const payload = packStoredPaymentId(
      currency,
      allowQr ? nextQr || null : null,
      nextManual,
    );
    lastEmitted.current = payload;
    onChange(payload);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {fields.map((field) => (
        <Input
          key={field.key}
          className="rounded-sm bg-background placeholder:text-primary/30"
          autoComplete="off"
          placeholder={t(field.placeholder)}
          value={manualValues[field.key] || ""}
          onChange={(e) => {
            const next = {
              ...manualValues,
              [field.key]: e.target.value.replace(/\|/g, ""),
            };
            setManualValues(next);
            emit(qr, next);
          }}
        />
      ))}
      {allowQr ? (
        <>
          <p className="text-muted-foreground text-xs">
            {t("PAYMENT_QR_OPTIONAL")}
          </p>
          <PaymentQrUpload
            currency={currency}
            value={qr}
            onChange={(nextQr) => {
              const extracted = assignStoredPaymentIdToFieldValues(
                currency,
                nextQr,
              );
              const merged = { ...manualValues };
              for (const field of fields) {
                if (!merged[field.key] && extracted[field.key]) {
                  merged[field.key] = extracted[field.key];
                }
              }
              setManualValues(merged);
              emit(nextQr, merged);
            }}
          />
          <p className="text-muted-foreground text-xs">
            {t("PAYMENT_QR_FALLBACK_HINT")}
          </p>
        </>
      ) : null}
    </div>
  );
}
