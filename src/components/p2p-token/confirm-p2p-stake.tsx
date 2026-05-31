import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useP2PBoost } from "@/hooks";

interface ConfirmP2pStakeProps {
  amount: string;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * ConfirmP2pStake — step 2 of the staking flow.
 *
 * Shows a summary of the pending stake (amount, unlocked limit, cost,
 * timing) and triggers the on-chain `p2pBoostStake` transaction via
 * `useP2PBoost`. The amount is converted from the human-readable string to
 * base units with `parseUnits(amount, 18)`. Disables both buttons while the
 * transaction is pending; advances to the success step on confirmation.
 */
export function ConfirmP2pStake({
  amount,
  onBack,
  onConfirm,
}: ConfirmP2pStakeProps) {
  const { t } = useTranslation();
  const { p2pBoostStakeMutation } = useP2PBoost();
  const numericAmount = Number(amount) || 0;
  const isProcessing = p2pBoostStakeMutation.isPending;

  // TODO: 18 decimal to 6
  const handleConfirm = () => {
    p2pBoostStakeMutation.mutate(
      { tokens: parseUnits(amount, 18) },
      { onSuccess: () => onConfirm() },
    );
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        {/* Staking amount */}
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("P2P_STAKE_CONFIRM_STAKING")}
        </p>
        <p className="mt-1 font-bold text-4xl text-foreground tabular-nums tracking-tight">
          {numericAmount} <span className="text-muted-foreground">$P2P</span>
        </p>

        <div className="my-4 h-px bg-border/60" />

        {/* Rows */}
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Unlocks</dt>
            <dd className="font-semibold text-emerald-500 tabular-nums">
              +${numericAmount} per txn · Buy + Sell
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">You pay</dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {numericAmount.toFixed(2)} USDC
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Applies</dt>
            <dd className="font-semibold text-foreground">Instantly</dd>
          </div>
        </dl>
      </section>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {t("CANCEL")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Staking...
            </span>
          ) : (
            t("CONFIRM")
          )}
        </Button>
      </div>
    </main>
  );
}
