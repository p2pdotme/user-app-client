import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CompactQrUpload } from "@/components/compact-qr-upload";
import {
  decodeVenQrImage,
  isValidVenQrPayload,
  type VenQrError,
} from "@/lib/ven-qr";

/**
 * Venezuela Pago Móvil QR upload: decode the bank image to the raw S7B
 * payload and surface it via `onChange`.
 */
export function VenQrUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQr = !!value && isValidVenQrPayload(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsDecoding(true);
    try {
      const details = await decodeVenQrImage(file);
      onChange(details.payload);
      toast.success(t("VEN_QR_DETECTED"));
    } catch (err) {
      const code = (err as VenQrError) ?? "READ_ERROR";
      const message =
        code === "INVALID_QR" ? t("VEN_QR_INVALID_QR") : t("VEN_QR_READ_ERROR");
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
      uploadLabel={t("VEN_QR_UPLOAD")}
      viewLabel={t("VEN_QR_VIEW")}
      changeLabel={t("VEN_QR_CHANGE")}
      decodingLabel={t("VEN_QR_DECODING")}
    />
  );
}
