import { AlertTriangle, Loader2, RotateCcw, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "@/recovery/core";
import { useDeployFactory } from "@/recovery/hooks";
import { toErrorDetail } from "@/recovery/lib/format";

export function AccountSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col gap-3 rounded-xl bg-primary/10 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

interface AccountErrorProps {
  onRetry: () => void;
  isRetrying: boolean;
}

/** The account address could not be read from the network. */
export function AccountError({ onRetry, isRetrying }: AccountErrorProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-4 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="font-medium">{t("RECOVERY_ACCOUNT_ERROR_TITLE")}</p>
      <p className="text-muted-foreground text-sm">
        {t("RECOVERY_ACCOUNT_ERROR_DESCRIPTION")}
      </p>
      <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        {t("RETRY")}
      </Button>
    </div>
  );
}

interface FactoryMissingProps {
  network: RecoveryNetworkKey;
}

/**
 * The account factory has no code on this network, so no address can be
 * derived until someone deploys it. Any user can do that once.
 */
export function FactoryMissing({ network }: FactoryMissingProps) {
  const { t } = useTranslation();
  const deployFactory = useDeployFactory(network);
  const { label, chain } = RECOVERY_NETWORKS[network];
  const symbol = chain.nativeCurrency.symbol;

  const handleDeploy = () => {
    deployFactory.mutate(undefined, {
      onSuccess: () => toast.success(t("RECOVERY_DEPLOY_FACTORY_SUCCESS")),
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium text-sm">
            {t("RECOVERY_FACTORY_MISSING_TITLE", { network: label })}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("RECOVERY_FACTORY_MISSING_DESCRIPTION", {
              network: label,
              symbol,
            })}
          </p>
        </div>
      </div>
      {deployFactory.error && (
        <p role="alert" className="break-words text-destructive text-sm">
          {t("RECOVERY_DEPLOY_FACTORY_FAILED")}{" "}
          <span className="text-muted-foreground">
            {toErrorDetail(deployFactory.error.message)}
          </span>
        </p>
      )}
      <Button
        className="h-12 w-full"
        onClick={handleDeploy}
        disabled={deployFactory.isPending}>
        {deployFactory.isPending ? (
          <>
            <Loader2 className="animate-spin" />
            {t("RECOVERY_DEPLOYING_FACTORY")}
          </>
        ) : deployFactory.error ? (
          t("TRY_AGAIN")
        ) : (
          t("RECOVERY_DEPLOY_FACTORY")
        )}
      </Button>
    </div>
  );
}
