import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
  toRecoveryError,
} from "@/recovery/core";
import { type RecoveryAccount, useDeploySmartAccount } from "@/recovery/hooks";
import { toErrorDetail } from "@/recovery/lib/format";
import { CopyButton } from "./copy-button";
import { FundingDrawer } from "./funding-drawer";

interface AccountCardProps {
  network: RecoveryNetworkKey;
  account: RecoveryAccount;
}

/** The user's smart account on the selected network and whether it exists yet. */
export function AccountCard({ network, account }: AccountCardProps) {
  const { t } = useTranslation();
  const deployAccount = useDeploySmartAccount(network);
  const [fundingAddress, setFundingAddress] = useState<string | null>(null);
  const { label } = RECOVERY_NETWORKS[network];

  const handleDeploy = () => {
    deployAccount.mutate(account.address, {
      onSuccess: (result) => {
        if (result.status === "confirmed") {
          toast.success(t("RECOVERY_DEPLOY_ACCOUNT_SUCCESS"));
        } else {
          toast.info(t("RECOVERY_DEPLOY_ACCOUNT_PENDING"));
        }
      },
      onError: (raw) => {
        const error = toRecoveryError(raw);
        if (error.code === "InsufficientGas") {
          setFundingAddress(error.fundingAddress ?? account.address);
          return;
        }
        toast.error(t("RECOVERY_DEPLOY_ACCOUNT_FAILED"), {
          description: toErrorDetail(error.message),
        });
      },
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-primary/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-muted-foreground text-sm">
          {t("RECOVERY_ACCOUNT_TITLE", { network: label })}
        </p>
        {account.isDeployed ? (
          <Badge className="border-transparent bg-success/10 text-success">
            {t("RECOVERY_ACCOUNT_ACTIVE")}
          </Badge>
        ) : (
          <Badge className="border-transparent bg-muted text-muted-foreground">
            {t("RECOVERY_ACCOUNT_NOT_ACTIVE")}
          </Badge>
        )}
      </div>
      <CopyButton
        value={account.address}
        copiedMessage={t("ADDRESS_COPIED")}
        ariaLabel={t("RECOVERY_COPY_ADDRESS")}
        className="bg-background/60 hover:bg-background/80"
      />
      {!account.isDeployed && (
        <div className="flex flex-col items-start gap-1">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("RECOVERY_ACCOUNT_NOT_DEPLOYED_NOTE", { network: label })}
          </p>
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={handleDeploy}
            disabled={deployAccount.isPending}>
            {deployAccount.isPending ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                {t("RECOVERY_DEPLOYING_ACCOUNT")}
              </>
            ) : (
              t("RECOVERY_DEPLOY_ACCOUNT")
            )}
          </Button>
        </div>
      )}
      <FundingDrawer
        network={network}
        fundingAddress={fundingAddress}
        onClose={() => setFundingAddress(null)}
        onRetry={handleDeploy}
      />
    </section>
  );
}
