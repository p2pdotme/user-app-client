import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PeruQrUpload } from "@/components/peru-qr-upload";
import { Input } from "@/components/ui/input";
import { CURRENCY, uploadsPaymentQR } from "@/lib/constants";
import {
  getPeruQrPayload,
  parsePeruPaymentId,
  serializePeruPaymentId,
} from "@/lib/peru-qr";

/**
 * Peru sell payment input: CCI and/or Yape/Plin phone, plus optional QR
 * upload when `uploadPaymentQR` is on.
 *
 * Local drafts are the source of truth while typing. Serialize only keeps
 * complete phone/CCI, so we must not re-parse `value` after our own emit or
 * an incomplete phone gets wiped when the CCI becomes valid.
 */
export function PeruSellPaymentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const allowQr = uploadsPaymentQR(CURRENCY.PEN);
  const qr = allowQr ? (getPeruQrPayload(value) ?? "") : "";
  const parsed = parsePeruPaymentId(value);
  const [phone, setPhone] = useState(parsed.phone ?? "");
  const [cci, setCci] = useState(parsed.cci ?? "");
  const lastEmitted = useRef(value || "");

  useEffect(() => {
    if ((value || "") === lastEmitted.current) return;
    lastEmitted.current = value || "";
    const next = parsePeruPaymentId(value);
    setPhone(next.phone ?? "");
    setCci(next.cci ?? "");
  }, [value]);

  const emit = (nextQr: string, nextPhone: string, nextCci: string) => {
    const payload = serializePeruPaymentId(
      allowQr ? nextQr || null : null,
      nextPhone,
      nextCci,
    );
    lastEmitted.current = payload;
    onChange(payload);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {allowQr ? (
        <>
          <p className="text-muted-foreground text-xs">
            {t("PERU_QR_OPTIONAL_QR")}
          </p>
          <PeruQrUpload
            value={qr}
            onChange={(nextQr) => {
              const extracted = parsePeruPaymentId(nextQr).phone ?? "";
              const nextPhone = phone || extracted;
              if (extracted && !phone) setPhone(extracted);
              emit(nextQr, nextPhone, cci);
            }}
          />
          <p className="text-muted-foreground text-xs">
            {t("PERU_QR_FALLBACK_HINT")}
          </p>
        </>
      ) : null}
      <Input
        className="rounded-sm bg-background placeholder:text-primary/30"
        inputMode="tel"
        autoComplete="off"
        placeholder={t("PERU_PHONE_PLACEHOLDER")}
        value={phone}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d+]/g, "").slice(0, 12);
          setPhone(next);
          emit(qr, next, cci);
        }}
      />
      <Input
        className="rounded-sm bg-background placeholder:text-primary/30"
        inputMode="numeric"
        autoComplete="off"
        placeholder={t("PERU_CCI_PLACEHOLDER")}
        value={cci}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, 20);
          setCci(next);
          emit(qr, phone, next);
        }}
      />
    </div>
  );
}
