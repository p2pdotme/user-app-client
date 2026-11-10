import { ArrowRight, ReceiptIndianRupee } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TaxReportCardProps {
  onClick: () => void;
}

/**
 * Entry to the India tax report (/tax). Says plainly that filing is the
 * user's own responsibility and that the tool only helps with the numbers.
 */
export function TaxReportCard({ onClick }: TaxReportCardProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-start gap-3 rounded-lg bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <ReceiptIndianRupee className="size-5 text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-semibold text-sm leading-tight">
          {t("TAX_REPORT_HELP_TITLE")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("TAX_REPORT_HELP_DESCRIPTION")}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-1 font-medium text-primary text-sm">
          {t("TAX_REPORT_HELP_CTA")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
