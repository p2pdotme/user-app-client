import { Loader2, QrCode, Upload } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * Compact QR file picker: one upload button, then View / Change after a
 * payload is stored. The QR itself only appears in a preview overlay.
 */
export function CompactQrUpload({
  value,
  hasQr,
  isDecoding,
  error,
  onFile,
  uploadLabel,
  viewLabel,
  changeLabel,
  decodingLabel,
  previewCaption,
}: {
  value: string;
  hasQr: boolean;
  isDecoding: boolean;
  error: string | null;
  onFile: (file: File | undefined) => void;
  uploadLabel: string;
  viewLabel: string;
  changeLabel: string;
  decodingLabel: string;
  previewCaption?: string;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!hasQr) setPreviewOpen(false);
  }, [hasQr]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const pickFile = () => inputRef.current?.click();

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={isDecoding}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {hasQr ? (
        <div className="flex w-full gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1"
            onClick={() => setPreviewOpen(true)}>
            <QrCode />
            {viewLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1"
            disabled={isDecoding}
            onClick={pickFile}>
            {isDecoding ? <Loader2 className="animate-spin" /> : <Upload />}
            {isDecoding ? decodingLabel : changeLabel}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          disabled={isDecoding}
          onClick={pickFile}>
          {isDecoding ? <Loader2 className="animate-spin" /> : <Upload />}
          {isDecoding ? decodingLabel : uploadLabel}
        </Button>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {previewOpen && hasQr && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewOpen(false)}>
          <div
            className="flex w-full max-w-xs flex-col items-center gap-4 rounded-lg bg-background p-6 shadow-lg"
            role="document"
            onClick={(event) => event.stopPropagation()}>
            <div className="rounded-md bg-white p-3">
              <QRCodeSVG value={value} size={200} />
            </div>
            {previewCaption && (
              <p className="text-center text-muted-foreground text-sm">
                {previewCaption}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPreviewOpen(false)}>
              {t("CLOSE")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
