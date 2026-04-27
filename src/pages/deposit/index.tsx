import { AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { parseUnits } from "viem";
import ASSETS from "@/assets";
import { FAQAccordion, NonHomeHeader, SectionHeader } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSafeDynamicContext } from "@/contexts";
import { OFFICIAL_RANGO_SUPPORT_CHANNELS } from "@/core/rango";
import { handleDeposit as executeDepositTransaction } from "@/core/rango/bridgeHandler/deposit";
import type { RangoSwapResponse } from "@/core/rango/types";
import {
  useAnalytics,
  useRangoQuote,
  useRangoSwap,
  useSounds,
  useThirdweb,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import type { AppError } from "@/lib/errors";
import { truncateAddress } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
import { ConnectSourceWallet } from "./connect-source-wallet";
import { FromToCards } from "./from-to-cards";
import { QuoteDetails } from "./quote-details";
import type { DepositState } from "./shared";

export function Deposit() {
  const { t } = useTranslation();
  const { isAvailable: isDynamicAvailable, primaryWallet } =
    useSafeDynamicContext();
  const { account } = useThirdweb();
  const sounds = useSounds();
  const { track } = useAnalytics();

  const [depositData, setDepositData] = useState<DepositState>({
    sourceChain: null,
    sourceToken: null,
    amount: "",
    status: "idle",
  });

  const [swapResponse, setSwapResponse] = useState<RangoSwapResponse | null>(
    null,
  );

  // Don't fetch quotes when we have swap response or are beyond preparing stage
  const shouldFetchQuote =
    depositData.status === "idle" || depositData.status === "preparing";

  const {
    data: rangoQuote,
    isLoading: isRangoQuoteLoading,
    isError: isRangoQuoteError,
    error: rangoQuoteError,
  } = useRangoQuote(
    "DEPOSIT",
    {
      blockchain: shouldFetchQuote
        ? (depositData.sourceChain?.id as string)
        : "",
      address: shouldFetchQuote
        ? (depositData.sourceToken?.address as string | null)
        : null,
    },
    shouldFetchQuote && depositData.amount && depositData.sourceToken?.decimals
      ? parseUnits(
          depositData.amount,
          depositData.sourceToken.decimals,
        ).toString()
      : "0",
  );

  const rangoSwapMutation = useRangoSwap();

  const resetDeposit = () => {
    setDepositData({
      sourceChain: null,
      sourceToken: null,
      amount: "",
      status: "idle",
    });
    setSwapResponse(null);
  };

  const handleDeposit = async () => {
    // Validate all required data is available
    if (!depositData.sourceChain) {
      toast.error(t("PLEASE_SELECT_SOURCE_CHAIN"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "deposit",
        status: "failed",
        amount: Number(depositData.amount) || 0,
        errorCode: "no_source_chain",
        errorMessage: "No source chain selected",
      });
      return;
    }

    if (!depositData.sourceToken) {
      toast.error(t("PLEASE_SELECT_SOURCE_TOKEN"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "deposit",
        status: "failed",
        amount: Number(depositData.amount) || 0,
        errorCode: "no_source_token",
        errorMessage: "No source token selected",
      });
      return;
    }

    if (!depositData.amount || Number(depositData.amount) <= 0) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "deposit",
        status: "failed",
        amount: Number(depositData.amount) || 0,
        errorCode: "invalid_amount",
        errorMessage: "Invalid amount entered",
      });
      return;
    }

    if (!rangoQuote) {
      toast.error(t("QUOTE_NOT_AVAILABLE"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "deposit",
        status: "failed",
        amount: Number(depositData.amount) || 0,
        errorCode: "no_quote",
        errorMessage: "Quote not available",
      });
      return;
    }

    // Track deposit transaction started
    track(EVENTS.TRANSACTION, {
      transaction_type: "deposit",
      status: "started",
      amount: Number(depositData.amount),
      fromChain: depositData.sourceChain?.name,
      toChain: "Base",
    });

    // Update status to preparing
    setDepositData((prev) => ({ ...prev, status: "preparing" }));

    // Prepare swap parameters
    const swapParams = {
      bridgeType: "DEPOSIT" as const,
      token: {
        blockchain: depositData.sourceChain.id,
        address: depositData.sourceToken.address,
      },
      amount: parseUnits(
        depositData.amount,
        depositData.sourceToken.decimals,
      ).toString(),
    };

    console.log("[Deposit] Executing swap with params:", swapParams);

    try {
      console.log("[Deposit] Getting swap response from Rango...");
      const swapRes = await rangoSwapMutation.mutateAsync(swapParams);
      console.log("[Deposit] Swap response received:", swapRes);

      // Store swap response for UI display
      setSwapResponse(swapRes);

      if (swapRes.error) {
        setDepositData((prev) => ({
          ...prev,
          status: "failed",
        }));

        return;
      }

      // Use the bridge handler to execute the deposit
      await executeDepositTransaction(
        swapRes,
        primaryWallet,
        setDepositData,
        sounds,
      );

      console.log("[Deposit] Deposit process completed successfully");

      // Success state will be handled by the bridge handler
    } catch (error: unknown) {
      console.error("[Deposit] Deposit process failed:", error);

      // Set failed status
      setDepositData((prev) => ({ ...prev, status: "failed" }));

      // Handle user rejection specifically
      if (
        error instanceof Error &&
        error.message.includes("User rejected the request")
      ) {
        toast.error(t("TRANSACTION_REJECTED"), {
          description: t("TRANSACTION_REJECTED_DESCRIPTION"),
        });
        return;
      }

      // Handle other errors
      const err = error as AppError<"RangoDeposit">;
      toast.error(err.code || t("DEPOSIT_FAILED"), {
        description: err.message || t("DEPOSIT_FAILED_GENERIC"),
      });
    }
  };

  return (
    <>
      <NonHomeHeader title={t("DEPOSIT")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto py-8">
        <ConnectSourceWallet disabled={!isDynamicAvailable} />
        {primaryWallet?.isConnected && (
          <>
            {/* Only show FromToCards when status is idle or preparing */}
            {(depositData.status === "idle" ||
              depositData.status === "preparing") && (
              <FromToCards depositState={[depositData, setDepositData]} />
            )}

            <QuoteDetails
              depositState={depositData}
              rangoQuote={rangoQuote}
              swapResponse={swapResponse}
              isLoading={isRangoQuoteLoading}
              isError={isRangoQuoteError}
              error={rangoQuoteError}
              onReset={resetDeposit}
            />

            {/* Only show deposit button when not in progress */}
            {(depositData.status === "idle" ||
              depositData.status === "failed") && (
              <Button
                className="w-full p-6"
                disabled={
                  !isDynamicAvailable ||
                  !rangoQuote ||
                  isRangoQuoteLoading ||
                  isRangoQuoteError ||
                  rangoSwapMutation.isPending
                }
                onClick={handleDeposit}>
                {rangoSwapMutation.isPending
                  ? t("PROCESSING")
                  : isRangoQuoteLoading
                    ? t("PROCESSING")
                    : t("DEPOSIT")}
              </Button>
            )}
          </>
        )}
        <section className="flex w-full flex-col gap-4 py-2">
          <h3 className="font-medium text-lg">{t("HISTORY_AND_SUPPORT")}</h3>
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-4">
              <div className="flex w-[6%] items-center justify-center">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs">{t("BRIDGING_MAY_TAKE_TIME")}</p>
                {account?.address ? (
                  <Link
                    to={`https://explorer.rango.exchange/search?query=${account.address}`}
                    target="_blank"
                    className="flex items-center gap-2 rounded-md border border-primary p-2 text-primary text-sm">
                    {truncateAddress(account.address, 10)}
                    <ExternalLink className="size-4" />
                  </Link>
                ) : (
                  <p className="text-destructive text-sm">
                    {t("WALLET_NOT_CONNECTED")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
        <section className="flex w-full flex-col gap-4 py-2">
          <Card className="border-none bg-primary/10 shadow-none">
            <CardHeader>
              <CardTitle>{t("OFFICIAL_RANGO_SUPPORT_CHANNELS")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
              {OFFICIAL_RANGO_SUPPORT_CHANNELS.map((channel) => (
                <Link
                  to={channel.url}
                  key={channel.name}
                  target="_blank"
                  className="flex items-center gap-2 rounded-md bg-primary/20 p-2">
                  <channel.icon className="size-6 text-primary" />
                </Link>
              ))}
            </CardContent>
            <CardFooter>
              <p className="text-xs">
                {t("OFFICIAL_RANGO_SUPPORT_CHANNELS_NOTE")}
              </p>
            </CardFooter>
          </Card>
        </section>
        <section className="flex w-full items-center justify-center py-2">
          <Link
            to="https://rango.exchange"
            target="_blank"
            className="flex items-center gap-2">
            <img
              src={ASSETS.ICONS.RANGO_LOGO}
              alt="Rango"
              className="h-5 w-5"
            />
            <p className="text-xs underline">{t("POWERED_BY_RANGO")}</p>
          </Link>
        </section>
        <section className="flex w-full flex-col justify-between gap-4 py-2">
          <SectionHeader title={t("FAQS")} seeAllLink={INTERNAL_HREFS.HELP} />
          <FAQAccordion faqs={getPageFAQs("DEPOSIT_PAGE")} />
        </section>
      </main>
    </>
  );
}
