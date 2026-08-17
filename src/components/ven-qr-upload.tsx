import { CheckCircle2, Loader2, QrCode, Upload } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  decodeVenQrImage,
  isValidVenQrPayload,
  type VenQrError,
} from "@/lib/ven-qr";

/**
 * Venezuela Pago Móvil QR upload: decode the bank image to the raw S7B
 * payload, preview the reconstructed QR, and surface it via `onChange`.
 */
export function VenQrUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={isDecoding}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {hasQr ? (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-primary/40 border-dashed bg-primary/5 p-4 transition-colors hover:bg-primary/10">
          <div className="flex items-center gap-2 font-medium text-green-600 text-sm">
            <CheckCircle2 className="size-5" />
            {t("VEN_QR_DETECTED")}
          </div>
          <div className="rounded-md bg-white p-2">
            <QRCodeSVG value={value} size={112} />
          </div>
          <p className="text-center text-muted-foreground text-xs">
            {t("VEN_QR_CONFIRM")}
          </p>
          <span className="text-primary text-xs underline">
            {t("VEN_QR_CHANGE")}
          </span>
        </label>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border border-dashed bg-background p-6 text-center transition-colors hover:bg-muted/40">
          {isDecoding ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="font-medium text-muted-foreground text-sm">
                {t("VEN_QR_DECODING")}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary">
                <QrCode className="size-6" />
                <Upload className="size-5" />
              </div>
              <span className="font-medium text-sm">
                {t("VEN_QR_UPLOAD_TITLE")}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("VEN_QR_UPLOAD_HINT")}
              </span>
            </>
          )}
        </label>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
