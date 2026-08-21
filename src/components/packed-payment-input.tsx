import {
  assignStoredPaymentIdToFieldValues,
  type CurrencyCode,
  getStoredQrPayload,
  type PaymentIdFieldConfig,
  packStoredPaymentId,
  uploadsPaymentQR,
  validateCatalogPaymentDraft,
} from "@p2pdotme/sdk/country";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PaymentQrUpload } from "@/components/payment-qr-upload";
import { Input } from "@/components/ui/input";
import { PAYMENT_ID_FIELDS } from "@/lib/constants";

function fieldError(
  field: PaymentIdFieldConfig,
  values: Record<string, string>,
  showErrors: boolean,
): string | null {
  if (!showErrors) return null;
  const value = (values[field.key] || "").trim();
  if (value) return field.validate(value) ? null : field.validationErrorMessage;
  if (field.optional === true) return null;
  return field.validationErrorMessage;
}

/**
 * Catalog-driven payment input: typed fields and optional QR may coexist.
 * QR upload first; one generic fallback hint above the fields.
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

  const hasQr = qr.length > 0;
  const hasTyped = fields.some(
    (field) => (manualValues[field.key] || "").trim().length > 0,
  );
  const draftOk = validateCatalogPaymentDraft(
    currency,
    allowQr ? qr || null : null,
    manualValues,
  );
  const showFieldErrors = hasTyped && !draftOk;

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
      {allowQr ? (
        <>
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
          {hasQr ? (
            <p className="text-muted-foreground text-xs">
              {t("PAYMENT_QR_REMOVE_HINT")}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            {t("PAYMENT_QR_FALLBACK_HINT")}
          </p>
        </>
      ) : null}
      {fields.map((field) => {
        const error = fieldError(field, manualValues, showFieldErrors);
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <Input
              className="rounded-sm bg-background placeholder:text-primary/30"
              autoComplete="off"
              placeholder={t(field.placeholder)}
              value={manualValues[field.key] || ""}
              aria-invalid={!!error}
              onChange={(e) => {
                const next = {
                  ...manualValues,
                  [field.key]: e.target.value.replace(/\|/g, ""),
                };
                setManualValues(next);
                emit(qr, next);
              }}
            />
            {error ? (
              <p className="text-destructive text-xs">
                {t(error, { defaultValue: error })}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
