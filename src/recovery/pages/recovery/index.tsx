import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components/non-home-header";
import { SafetyNotice } from "@/components/safety-notice";
import {
  AccountCard,
  AccountError,
  AccountSkeleton,
  FactoryMissing,
  NetworkSelector,
  TransferPanel,
} from "@/recovery/components";
import { useRecoveryAccount, useRecoveryNetwork } from "@/recovery/hooks";

/**
 * Token recovery screen: pick the network the funds were sent on, see the
 * smart account there and its balances, and send a token out.
 */
export function RecoveryPage() {
  const { t } = useTranslation();
  const { network, setNetwork } = useRecoveryNetwork();
  const account = useRecoveryAccount(network);
  const [isTransferring, setIsTransferring] = useState(false);

  const isFactoryMissing = account.error?.code === "FactoryNotDeployed";

  return (
    <>
      <NonHomeHeader title={t("RECOVERY_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-6">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("RECOVERY_INTRO")}
        </p>

        <NetworkSelector
          selected={network}
          onSelect={setNetwork}
          disabled={isTransferring}
        />

        {/* No data yet also covers the moment before the wallet is ready */}
        {account.isPending && <AccountSkeleton />}
        {account.isError &&
          (isFactoryMissing ? (
            <FactoryMissing key={network} network={network} />
          ) : (
            <AccountError
              onRetry={() => account.refetch()}
              isRetrying={account.isFetching}
            />
          ))}
        {account.data && (
          <>
            <AccountCard
              key={`account:${network}`}
              network={network}
              account={account.data}
            />
            {/* Keyed so a network or account switch resets form and result */}
            <TransferPanel
              key={`${network}:${account.data.address}`}
              network={network}
              smartAccount={account.data.address}
              onBusyChange={setIsTransferring}
            />
          </>
        )}

        <SafetyNotice variant="wallet" />
      </main>
    </>
  );
}
