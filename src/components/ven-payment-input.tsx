import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { VenQrUpload } from "@/components/ven-qr-upload";
import {
  deserializeCompoundPaymentId,
  getPaymentIdFields,
  serializeCompoundPaymentId,
} from "@/lib/compound-payment-id";
import { CURRENCY } from "@/lib/constants";
import {
  getVenCompoundPaymentId,
  getVenQrPayload,
  serializeVenPaymentId,
} from "@/lib/ven-qr";

function manualFromValue(
  value: string,
  fields: { key: string }[],
): Record<string, string> {
  const compound = getVenCompoundPaymentId(value);
  const parts = compound ? deserializeCompoundPaymentId(compound) : [];
  const initial: Record<string, string> = {};
  for (const [i, f] of fields.entries()) {
    initial[f.key] = parts[i] || "";
  }
  return initial;
}

/**
 * Venezuela sell payment input: optional QR plus required phone / RIF / bank.
 * Stored as `qr||phone|rif|bank` when both are present, or `phone|rif|bank`.
 */
export function VenPaymentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const fields = getPaymentIdFields(CURRENCY.VEN);
  const qr = getVenQrPayload(value) ?? "";
  const [manualValues, setManualValues] = useState<Record<string, string>>(() =>
    manualFromValue(value, fields),
  );

  useEffect(() => {
    const next = manualFromValue(value, fields);
    setManualValues((prev) =>
      fields.every((f) => prev[f.key] === next[f.key]) ? prev : next,
    );
  }, [value, fields]);

  const emit = (nextQr: string, nextManual: Record<string, string>) => {
    const parts = fields.map((f) => nextManual[f.key] || "");
    const compound = parts.some((v) => v.length > 0)
      ? serializeCompoundPaymentId(...parts)
      : "";
    onChange(serializeVenPaymentId(nextQr || null, compound || null));
  };

  const updateManual = (key: string, raw: string) => {
    const next = { ...manualValues, [key]: raw.replace(/\|/g, "") };
    setManualValues(next);
    emit(qr, next);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("VEN_QR_OPTIONAL_QR")}</p>
      <VenQrUpload
        value={qr}
        onChange={(nextQr) => emit(nextQr, manualValues)}
      />
      <p className="text-muted-foreground text-xs">
        {t("VEN_QR_FALLBACK_HINT")}
      </p>
      {fields.map((fieldConfig) => (
        <Input
          key={fieldConfig.key}
          className="rounded-sm bg-background placeholder:text-primary/30"
          autoComplete="off"
          placeholder={t("ENTER_PAYMENT_DETAILS", {
            paymentAddressName: t(fieldConfig.label),
          })}
          value={manualValues[fieldConfig.key] || ""}
          onChange={(e) => updateManual(fieldConfig.key, e.target.value)}
        />
      ))}
    </div>
  );
}
