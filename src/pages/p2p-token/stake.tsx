import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";

export function P2PStake() {
  const { t } = useTranslation();

  return (
    <>
      <NonHomeHeader title={t("P2P_STAKE_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 py-6 pb-28">
        {/* Stake amount card */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {t("P2P_STAKE_INPUT_LABEL")}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              aria-label={t("P2P_STAKE_INPUT_LABEL")}
              className="min-w-0 flex-1 bg-transparent font-bold text-4xl text-foreground tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
            />
            <span className="font-semibold text-muted-foreground text-base">
              $P2P
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs tabular-nums">
            ≈ 0.00 USDC
          </p>
        </section>

        {/* Quick picks */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm transition-colors hover:bg-primary/10"
          >
            25%
          </button>
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm transition-colors hover:bg-primary/10"
          >
            50%
          </button>
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card/40 py-2.5 font-semibold text-foreground text-sm uppercase transition-colors hover:bg-primary/10"
          >
            {t("MAX")}
          </button>
        </div>
      </main>
    </>
  );
}
