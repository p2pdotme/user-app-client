import { Clipboard, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PeruQrUpload } from "@/components/peru-qr-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isValidPeruQrPayload,
  isValidPeruvianCci,
  normalizePeruvianCci,
} from "@/lib/peru-qr";

type PeruInputMode = "qr" | "cci";

/**
 * Peru sell payment input: QR upload first, optional CCI (20 digits) fallback.
 */
export function PeruSellPaymentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (payload: string) => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PeruInputMode>(() =>
    value && isValidPeruvianCci(value) && !isValidPeruQrPayload(value)
      ? "cci"
      : "qr",
  );

  // Keep mode in sync when parent clears / loads a saved address.
  useEffect(() => {
    if (!value) return;
    if (isValidPeruQrPayload(value)) setMode("qr");
    else if (isValidPeruvianCci(value)) setMode("cci");
  }, [value]);

  const switchToCci = () => {
    setMode("cci");
    if (value && isValidPeruQrPayload(value)) onChange("");
  };

  const switchToQr = () => {
    setMode("qr");
    if (value && isValidPeruvianCci(value)) onChange("");
  };

  const handleCciChange = (raw: string) => {
    // Allow spaces while typing; store digits only (max 20).
    const digits = raw.replace(/\D/g, "").slice(0, 20);
    onChange(digits);
  };

  const handlePasteCci = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const normalized = normalizePeruvianCci(clipboardText);
      if (!isValidPeruvianCci(normalized)) {
        toast.error(t("PERU_CCI_INVALID"));
        return;
      }
      onChange(normalized);
    } catch {
      toast.error(t("COULD_NOT_ACCESS_CLIPBOARD"));
    }
  };

  if (mode === "cci") {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="relative flex items-center gap-2">
          <Input
            className="rounded-sm bg-background pr-10 placeholder:text-primary/30"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t("PERU_CCI_PLACEHOLDER")}
            value={value && !isValidPeruQrPayload(value) ? value : ""}
            onChange={(e) => handleCciChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0"
            onClick={value ? () => onChange("") : handlePasteCci}>
            {value && !isValidPeruQrPayload(value) ? (
              <X className="size-4 text-primary" />
            ) : (
              <Clipboard className="size-4 text-primary" />
            )}
          </Button>
        </div>
        {value &&
          !isValidPeruQrPayload(value) &&
          !isValidPeruvianCci(value) && (
            <p className="text-destructive text-xs">{t("PERU_CCI_INVALID")}</p>
          )}
        <button
          type="button"
          className="text-left text-primary text-xs underline"
          onClick={switchToQr}>
          {t("PERU_USE_QR_INSTEAD")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <PeruQrUpload
        value={isValidPeruQrPayload(value) ? value : ""}
        onChange={onChange}
      />
      {!isValidPeruQrPayload(value) && (
        <button
          type="button"
          className="text-left text-muted-foreground text-xs underline hover:text-primary"
          onClick={switchToCci}>
          {t("PERU_NO_QR_ENTER_CCI")}
        </button>
      )}
    </div>
  );
}
