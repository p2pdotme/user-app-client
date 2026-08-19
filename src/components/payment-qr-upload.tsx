import type { CurrencyCode } from "@p2pdotme/sdk/country";
import { getCountryOption } from "@p2pdotme/sdk/country";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CompactQrUpload } from "@/components/compact-qr-upload";
import { decodePaymentQrImage, type PaymentQrError } from "@/lib/payment-qr";

export function PaymentQrUpload({
  currency,
  value,
  onChange,
}: {
  currency: CurrencyCode;
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const option = getCountryOption(currency);
  const hasQr = !!value && !!option?.validateQr?.(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsDecoding(true);
    try {
      const details = await decodePaymentQrImage(file, currency);
      onChange(details.payload);
      toast.success(t("PAYMENT_QR_DETECTED"));
    } catch (err) {
      const code = (err as PaymentQrError) ?? "READ_ERROR";
      const message =
        code === "INVALID_QR"
          ? t("PAYMENT_QR_INVALID")
          : t("PAYMENT_QR_READ_ERROR");
      setError(message);
      onChange("");
      toast.error(message);
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <CompactQrUpload
      value={value}
      hasQr={hasQr}
      isDecoding={isDecoding}
      error={error}
      onFile={handleFile}
      uploadLabel={t("PAYMENT_QR_UPLOAD")}
      viewLabel={t("PAYMENT_QR_VIEW")}
      changeLabel={t("PAYMENT_QR_CHANGE")}
      decodingLabel={t("PAYMENT_QR_DECODING")}
    />
  );
}
