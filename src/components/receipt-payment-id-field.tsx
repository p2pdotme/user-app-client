import { Copy, Eye, EyeOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatReceiptPaymentId } from "@/lib/receipt-payment-id";

/**
 * Receipt row for a payment ID. Renders a packed QR when present; typed
 * fields stay as copyable text below the QR.
 */
export function ReceiptPaymentIdField({
  labelKey,
  paymentId,
  currency,
  show,
  onToggleShow,
  onCopy,
}: {
  labelKey: string;
  paymentId: string | null | undefined;
  currency: string | null | undefined;
  show: boolean;
  onToggleShow: () => void;
  onCopy: (value?: string) => void;
}) {
  const { t } = useTranslation();
  const details = formatReceiptPaymentId(paymentId, currency, t);
  const hasQr = !!details.qr;
  const showInlineText = !hasQr || !show;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 whitespace-nowrap font-medium">
          {t(labelKey)}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {showInlineText ? (
            <span
              className={`min-w-0 truncate text-right text-muted-foreground transition-all duration-200 ${!show ? "select-none blur-sm" : ""}`}>
              {details.display}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleShow}
            className="export-screenshot-ignore size-4 shrink-0 p-0 text-muted-foreground transition-colors hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(details.copyValue ?? undefined)}
            disabled={!details.copyValue}
            className="export-screenshot-ignore size-4 shrink-0 p-0 text-muted-foreground transition-colors hover:text-foreground">
            <Copy className="size-4" />
          </Button>
        </div>
      </div>
      {hasQr && show && details.qr ? (
        <>
          <div className="flex justify-center py-1">
            <div className="flex h-[218px] w-[218px] items-center justify-center rounded-sm border border-primary bg-white p-4 shadow-2xl shadow-primary/20">
              <QRCodeSVG value={details.qr} size={200} level="L" />
            </div>
          </div>
          {details.copyValue ? (
            <p className="break-all text-right text-muted-foreground text-xs">
              {details.display}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
