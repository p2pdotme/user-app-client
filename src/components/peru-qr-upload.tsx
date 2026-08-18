import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CompactQrUpload } from "@/components/compact-qr-upload";
import {
  decodePeruQrImage,
  isValidPeruQrPayload,
  type PeruQrError,
} from "@/lib/peru-qr";

/**
 * Peru (PEN) sell payment-address input: instead of a text field, the user
 * uploads their Yape/Plin QR image. We decode it to the raw EMVCo payload and
 * surface it via `onChange` (same slot other currencies use for typed values).
 */
export function PeruQrUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQr = !!value && isValidPeruQrPayload(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsDecoding(true);
    try {
      const details = await decodePeruQrImage(file);
      onChange(details.payload);
      toast.success(t("PERU_QR_DETECTED"));
    } catch (err) {
      const code = (err as PeruQrError) ?? "READ_ERROR";
      const message =
        code === "INVALID_QR"
          ? t("PERU_QR_INVALID_QR")
          : t("PERU_QR_READ_ERROR");
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
      uploadLabel={t("PERU_QR_UPLOAD")}
      viewLabel={t("PERU_QR_VIEW")}
      changeLabel={t("PERU_QR_CHANGE")}
      decodingLabel={t("PERU_QR_DECODING")}
    />
  );
}
