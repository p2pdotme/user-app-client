import { AlertTriangle, Clipboard, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OFFICIAL_RANGO_SUPPORT_CHANNELS } from "@/core/rango";
import { handleWithdraw as executeWithdrawTransaction } from "@/core/rango/bridgeHandler/withdraw";
import type {
  RangoSwapResponse,
  SupportedBridgeChains,
} from "@/core/rango/types";
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
import { cn, truncateAddress } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
import { FromToCards } from "./from-to-cards";
import { QuoteDetails } from "./quote-details";
import { isValidAddressForChain, type WithdrawState } from "./shared";

export function Withdraw() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const sounds = useSounds();
  const { track } = useAnalytics();

  const [withdrawData, setWithdrawData] = useState<WithdrawState>({
    destinationChain: null,
    destinationToken: null,
    amount: "",
    recipientAddress: "",
    status: "idle",
  });

  const [swapResponse, setSwapResponse] = useState<RangoSwapResponse | null>(
    null,
  );

  const [isPasting, setIsPasting] = useState(false);

  // Validate recipient address for the selected chain
  const isValidAddress = useMemo(() => {
    if (!withdrawData.recipientAddress.trim()) return null;
    if (!withdrawData.destinationChain) return null;

    return isValidAddressForChain(
      withdrawData.destinationChain.id as SupportedBridgeChains,
      withdrawData.recipientAddress,
    );
  }, [withdrawData.recipientAddress, withdrawData.destinationChain]);

  // Don't fetch quotes when we have swap response or are beyond preparing stage
  const shouldFetchQuote =
    withdrawData.status === "idle" || withdrawData.status === "preparing";

  const {
    data: rangoQuote,
    isLoading: isRangoQuoteLoading,
    isError: isRangoQuoteError,
    error: rangoQuoteError,
  } = useRangoQuote(
    "WITHDRAW",
    {
      blockchain: shouldFetchQuote
        ? (withdrawData.destinationChain?.id as string)
        : "",
      address: shouldFetchQuote
        ? (withdrawData.destinationToken?.address as string | null)
        : null,
    },
    shouldFetchQuote && withdrawData.amount && Number(withdrawData.amount) > 0
      ? parseUnits(withdrawData.amount, 6).toString() // USDC has 6 decimals
      : "0",
  );

  const rangoSwapMutation = useRangoSwap();

  const resetWithdraw = () => {
    setWithdrawData({
      destinationChain: null,
      destinationToken: null,
      amount: "",
      recipientAddress: "",
      status: "idle",
    });
    setSwapResponse(null);
  };

  const handleWithdraw = async () => {
    // First check if wallet is connected
    if (!account?.address) {
      toast.error(t("WALLET_NOT_CONNECTED"));
      return;
    }

    // Validate all required data is available
    if (!withdrawData.destinationChain) {
      toast.error(t("PLEASE_SELECT_DESTINATION_CHAIN"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "no_destination_chain",
        errorMessage: "No destination chain selected",
      });
      return;
    }

    if (!withdrawData.destinationToken) {
      toast.error(t("PLEASE_SELECT_DESTINATION_TOKEN"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "no_destination_token",
        errorMessage: "No destination token selected",
      });
      return;
    }

    if (!withdrawData.amount || Number(withdrawData.amount) <= 0) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "invalid_amount",
        errorMessage: "Invalid amount entered",
      });
      return;
    }

    if (!withdrawData.recipientAddress) {
      toast.error(t("PLEASE_ENTER_RECIPIENT_ADDRESS"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "no_recipient_address",
        errorMessage: "No recipient address provided",
      });
      return;
    }

    if (!isValidAddress) {
      toast.error(t("INVALID_RECIPIENT_ADDRESS"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "invalid_recipient_address",
        errorMessage: "Invalid recipient address format",
      });
      return;
    }

    if (!rangoQuote) {
      toast.error(t("QUOTE_NOT_AVAILABLE"));
      track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw",
        status: "failed",
        amount: Number(withdrawData.amount) || 0,
        errorCode: "no_quote",
        errorMessage: "Quote not available",
      });
      return;
    }

    // Track withdraw transaction started
    track(EVENTS.TRANSACTION, {
      transaction_type: "withdraw",
      status: "started",
      amount: Number(withdrawData.amount),
      fromChain: "Base",
      toChain: withdrawData.destinationChain?.name,
    });

    // Update status to preparing
    setWithdrawData((prev) => ({ ...prev, status: "preparing" }));

    // Prepare swap parameters
    const swapParams = {
      bridgeType: "WITHDRAW" as const,
      token: {
        blockchain: withdrawData.destinationChain.id,
        address: withdrawData.destinationToken.address,
      },
      amount: parseUnits(withdrawData.amount, 6).toString(), // USDC has 6 decimals
      recipientAddress: withdrawData.recipientAddress,
    };

    console.log("[Withdraw] Executing swap with params:", swapParams);

    try {
      console.log("[Withdraw] Getting swap response from Rango...");
      const swapRes = await rangoSwapMutation.mutateAsync(swapParams);
      console.log("[Withdraw] Swap response received:", swapRes);

      // Store swap response for UI display
      setSwapResponse(swapRes);

      if (swapRes.error) {
        setWithdrawData((prev) => ({
          ...prev,
          status: "failed",
        }));
        return;
      }

      // Use the bridge handler to execute the withdraw
      await executeWithdrawTransaction(
        swapRes,
        account,
        setWithdrawData,
        sounds,
      );

      console.log("[Withdraw] Withdraw process completed successfully");

      // Success state will be handled by the bridge handler
    } catch (error: unknown) {
      console.error("[Withdraw] Withdraw process failed:", error);
      const err = error as AppError<"RangoWithdraw">;

      // Set failed status
      setWithdrawData((prev) => ({ ...prev, status: "failed" }));

      toast.error(t("SWAP_TXN_NOT_CREATED"), {
        description: err.message,
      });
    }
  };

  return (
    <>
      <NonHomeHeader title={t("WITHDRAW")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto py-8">
        {/* Only show FromToCards and recipient input when status is idle or preparing */}
        {(withdrawData.status === "idle" ||
          withdrawData.status === "preparing") && (
          <>
            <FromToCards
              withdrawState={[withdrawData, setWithdrawData]}
              rangoQuote={rangoQuote}
              isRangoQuoteLoading={isRangoQuoteLoading}
              isRangoQuoteError={isRangoQuoteError}
              rangoQuoteError={rangoQuoteError}
            />
            <div className="flex flex-col gap-2 py-2">
              <Label className="font-medium text-sm">
                {t("ENTER_RECIPIENT_ADDRESS")}
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  className={cn(
                    "h-10 p-4 pr-12 text-primary placeholder:text-primary/50",
                    isValidAddress === true && "border-success",
                    isValidAddress === false && "border-destructive",
                  )}
                  placeholder={
                    withdrawData.destinationChain?.id === "SOLANA"
                      ? "7eEz...NuTz"
                      : "0x0000...0000"
                  }
                  value={withdrawData.recipientAddress}
                  onChange={(e) =>
                    setWithdrawData((prev) => ({
                      ...prev,
                      recipientAddress: e.target.value,
                    }))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
                  onClick={async () => {
                    setIsPasting(true);
                    try {
                      const text = await navigator.clipboard.readText();
                      const trimmedText = text.trim();

                      // Validate address for the selected chain before pasting
                      if (!withdrawData.destinationChain) {
                        toast.error(t("PLEASE_SELECT_DESTINATION_CHAIN_FIRST"));
                        return;
                      }

                      const isValid = isValidAddressForChain(
                        withdrawData.destinationChain
                          .id as SupportedBridgeChains,
                        trimmedText,
                      );

                      if (!isValid) {
                        toast.error(t("INVALID_ADDRESS_FORMAT"));
                        return;
                      }

                      setWithdrawData((prev) => ({
                        ...prev,
                        recipientAddress: trimmedText,
                      }));
                      toast.success(t("ADDRESS_PASTED"));
                    } catch {
                      toast.error(t("FAILED_TO_READ_CLIPBOARD"));
                    } finally {
                      setIsPasting(false);
                    }
                  }}
                  disabled={isPasting}>
                  {isPasting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Clipboard className="size-4 text-primary" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        <QuoteDetails
          withdrawState={withdrawData}
          rangoQuote={rangoQuote}
          swapResponse={swapResponse}
          isLoading={isRangoQuoteLoading}
          isError={isRangoQuoteError}
          error={rangoQuoteError}
          onReset={resetWithdraw}
        />

        {/* Only show withdraw button when not in progress */}
        {(withdrawData.status === "idle" ||
          withdrawData.status === "failed") && (
          <Button
            className="w-full p-6"
            disabled={
              !account?.address ||
              !rangoQuote ||
              isRangoQuoteLoading ||
              isRangoQuoteError ||
              rangoSwapMutation.isPending ||
              !withdrawData.destinationChain ||
              !withdrawData.destinationToken ||
              !withdrawData.amount ||
              !withdrawData.recipientAddress ||
              !isValidAddress
            }
            onClick={handleWithdraw}>
            {rangoSwapMutation.isPending
              ? t("PROCESSING")
              : isRangoQuoteLoading
                ? t("PROCESSING")
                : t("WITHDRAW")}
          </Button>
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
          <FAQAccordion faqs={getPageFAQs("WITHDRAW_PAGE")} />
        </section>
      </main>
    </>
  );
}
