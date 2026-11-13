import { ArrowRight, LifeBuoy } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RecoveryCardProps {
  onClick: () => void;
}

/**
 * Entry to token recovery (/recovery): for funds sent to the user's P2P.me
 * address on a network other than Base.
 */
export function RecoveryCard({ onClick }: RecoveryCardProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-start gap-3 rounded-lg bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <LifeBuoy className="size-5 text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-semibold text-sm leading-tight">
          {t("RECOVERY_HELP_TITLE")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("RECOVERY_HELP_DESCRIPTION")}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-1 font-medium text-primary text-sm">
          {t("RECOVERY_HELP_CTA")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
