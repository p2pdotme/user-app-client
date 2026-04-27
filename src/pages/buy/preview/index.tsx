import { useFraudEngine } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BookUser,
  Clipboard,
  Clock4,
  ClockFading,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import { isAddress, parseUnits, zeroAddress } from "viem";
import ASSETS from "@/assets";
import { DashedSeparator, NonHomeHeader } from "@/components";
import { PWAUpdateDrawer } from "@/components/pwa-update-drawer";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { getFeeConfig } from "@/core/fees";
import { ABIS } from "@/core/p2pdotme";
import {
  useAnalytics,
  useHapticInteractions,
  useOrderFlow,
  useProcessingTimes,
  useThirdweb,
  useWalletAddressBook,
} from "@/hooks";
import { useContractVersion } from "@/hooks/use-contract-version";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS, ORDER_TYPE } from "@/lib/constants";
import { placeOrderErrorKey } from "@/lib/errors";
import {
  addLocalOrderPaymentDetails,
  calculateFee,
  cn,
  extractOrderIdFromOrderPlaced,
  formatFiatAmount,
  truncateAddress,
} from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../../order/help-drawer";
import {
  type BuyPreviewState,
  BuyPreviewStateSchema,
  getAvatarContent,
} from "./shared";
import { WalletAddressesDrawer } from "./wallet-addresses-drawer";

/**
 * @description This page uses the amount passed from the previous page.
 * It takes a "receiving address" input from the user and places an order on the P2P.me protocol.
 * The protocol returns an order ID, which is the single source of truth.
 * This order ID is then sent to the next page as the `order/orderId` URL parameter.
 * The order details will be fetched on the next page directly from the protocol using the order ID.
 */
export function BuyPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { account, wallet } = useThirdweb();
  const fraudEngine = useFraudEngine();
  const { addressBook, refresh: refreshAddressBook } = useWalletAddressBook();
  const {
    settings: { currency },
  } = useSettings();

  const { data: feeConfig } = useQuery({
    queryKey: ["feeConfig", currency.currency],
    queryFn: () =>
      getFeeConfig(currency.currency).match(
        (config) => config,
        (error) => {
          throw error;
        },
      ),
    enabled: !!currency.currency,
  });

  const feeConfigSmallOrderThreshold = feeConfig?.smallOrderThreshold ?? 0;
  const feeConfigSmallOrderFixedFee = feeConfig?.smallOrderFixedFee ?? 0;
  const {
    onOrderPlaced,
    onOrderFailed,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerTapHaptic,
  } = useHapticInteractions();
  const { track } = useAnalytics();

  const {
    data: processingTimes,
    isLoading: isProcessingTimesLoading,
    isError: isProcessingTimesError,
    error: processingTimesError,
  } = useProcessingTimes();
  const { placeOrderMutation } = useOrderFlow();

  const [buyPreviewState, setBuyPreviewState] = useState<BuyPreviewState>({
    amount: {
      crypto: 0,
      fiat: 0,
    },
  });

  // State for manual address input
  const [showInput, setShowInput] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // State for contract version mismatch dialog
  const [showContractMismatch, setShowContractMismatch] = useState(false);
  const [fraudStatus, setFraudStatus] = useState<
    "idle" | "checking" | "approved" | "rejected"
  >("idle");
  const fraudStatusTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { checkContractSync } = useContractVersion();

  // validate the state being passed from the previous page
  useEffect(() => {
    safeParseWithResult(BuyPreviewStateSchema, locationState).match(
      (data) => {
        setBuyPreviewState(data);
      },
      (error) => {
        console.error("BuyPreviewLocationState", error);
        navigate(INTERNAL_HREFS.BUY);
      },
    );
  }, [navigate, locationState]);

  // Clean up fraud status timeout on unmount
  useEffect(() => {
    return () => {
      if (fraudStatusTimeoutRef.current) {
        clearTimeout(fraudStatusTimeoutRef.current);
      }
    };
  }, []);

  // initial load of address book
  useEffect(() => {
    refreshAddressBook();
  }, [refreshAddressBook]);

  // Determine if we're using the built-in wallet
  const isUsingInAppWallet = !addressBook?.active;

  // Get the current active address, either from addressBook or manual input
  const getCurrentAddress = () => {
    if (showInput && manualAddress) {
      return manualAddress as Address;
    }

    if (addressBook?.active) {
      return addressBook.active.address as Address;
    }

    if (account?.address) {
      return account.address as Address;
    }

    return zeroAddress as Address;
  };

  // Get current address label
  const getCurrentLabel = () => {
    if (showInput && manualAddress) {
      return t("ONE_TIME_ADDRESS");
    }

    if (addressBook?.active) {
      return addressBook.active.label;
    }

    return t("P2P_ME_WALLET");
  };

  const clearAddress = () => {
    triggerTapHaptic(); // Haptic feedback for clear action
    setShowInput(true);
    setManualAddress("");
  };

  const handleManualAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setManualAddress(e.target.value);
  };

  const handlePasteAddress = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText?.startsWith("0x")) {
        setManualAddress(clipboardText);
        triggerSuccessHaptic(); // Success haptic for successful paste
      } else {
        triggerErrorHaptic(); // Error haptic for invalid address
        toast.error(t("INVALID_WALLET_ADDRESS_FORMAT"));
      }
    } catch (err) {
      triggerErrorHaptic(); // Error haptic for clipboard error
      toast.error((err as Error).message);
      console.error("Clipboard error:", err);
    }
  };

  // Function to handle address selection from the drawer
  const handleAddressSelection = useCallback(() => {
    refreshAddressBook();
    setShowInput(false);
  }, [refreshAddressBook]);

  // Current effective address for display and form submission
  const currentAddress = getCurrentAddress();
  const currentLabel = getCurrentLabel();

  const isPlacingOrderDisabled =
    isPlacingOrder ||
    fraudStatus === "checking" ||
    fraudStatus === "approved" ||
    fraudStatus === "rejected" ||
    currentAddress === zeroAddress ||
    (!addressBook?.active && account?.address && !isAddress(account.address)) || // active === undefined should check for built-in wallet
    (showInput && !isAddress(manualAddress)) || // showInput should check for manual address input
    (addressBook?.active && !isAddress(addressBook.active.address)); // addressBook?.active.address should check if the active saved address is valid

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    const isINR = currency.currency === "INR";
    setFraudStatus(isINR ? "checking" : "idle");

    console.log("Placing order with...", buyPreviewState, currentAddress);
    const isSynced = await checkContractSync();
    if (!isSynced) {
      setShowContractMismatch(true);
      setFraudStatus("idle");
      setIsPlacingOrder(false);
      return;
    }

    // Calculate fee and deduct from amount for buy orders
    const fee = calculateFee(
      buyPreviewState.amount.crypto,
      feeConfigSmallOrderThreshold,
      feeConfigSmallOrderFixedFee,
    );
    const amountAfterFee = buyPreviewState.amount.crypto - fee;

    // Build signer from thirdweb wallet. For account-abstraction smart wallets
    // the tracked subject (smart account) and the signing key (admin EOA) are
    // different addresses — the fraud engine must track the smart wallet (it's
    // what places on-chain orders and what reports/watchlist key on), while
    // the EIP-191 signature has to come from the admin EOA because smart
    // wallet contracts can't sign EIP-191 directly. For plain EOA wallets,
    // `getAdminAccount?.()` is undefined and both addresses collapse to the
    // same account.
    const adminAccount = wallet?.getAdminAccount?.() ?? wallet?.getAccount();
    if (!account?.address || !adminAccount) {
      setFraudStatus("idle");
      setIsPlacingOrder(false);
      toast.error(t("FAILED_TO_PLACE_ORDER"));
      return;
    }
    const signer = {
      address: account.address,
      signerAddress: adminAccount.address,
      signMessage: (msg: string) => adminAccount.signMessage({ message: msg }),
    };

    // Use SDK's processBuyOrder: fraud check → place order → auto-link
    const result = await fraudEngine.processBuyOrder({
      signer,
      orderDetails: {
        cryptoAmount: buyPreviewState.amount.crypto,
        fiatAmount: buyPreviewState.amount.fiat,
        currency: currency.currency,
        recipientAddress: currentAddress,
        fee,
        amountAfterFee,
        paymentMethod: currency.paymentMethod,
        estimatedProcessingTime: processingTimes
          ? `${processingTimes.buyMin}-${processingTimes.buyMax} minutes`
          : undefined,
      },
      userDetails: {
        currency: currency.currency,
        country: currency.country,
      },
      orderSource: window.location.origin,
      placeOrder: async () => {
        setFraudStatus("approved");
        toast.success(t("FRAUD_ASSESSMENT_APPROVED"));

        const receipt = await placeOrderMutation.mutateAsync(
          {
            amount: parseUnits(amountAfterFee.toString(), 6),
            recipientAddr: currentAddress,
            orderType: ORDER_TYPE.BUY,
            currency: currency.currency,
            fiatAmount: parseUnits(buyPreviewState.amount.fiat.toString(), 6),
            user: account?.address as `0x${string}`,
          },
          {
            onError: (error) => {
              const key = placeOrderErrorKey(error);
              toast.error(
                t(key),
                key === "FAILED_TO_PLACE_ORDER"
                  ? {
                      description: error.message,
                    }
                  : undefined,
              );
            },
          },
        );
        onOrderPlaced();

        const orderId = extractOrderIdFromOrderPlaced(
          ABIS.DIAMOND,
          receipt.logs,
        );
        if (!orderId) {
          triggerErrorHaptic();
          throw new Error("ORDER_ID_NOT_FOUND");
        }

        // Track transaction started upon successful order placement
        track(EVENTS.TRANSACTION, {
          transaction_type: "buy",
          status: "placed",
          amount: buyPreviewState.amount.crypto,
          currency: currency.currency,
          orderId: orderId.toString(),
          paymentChannel: 0,
        });
        // Store payment details (IDR gets GO_PAY prefix, others store address directly)
        addLocalOrderPaymentDetails(
          orderId.toString(),
          currentAddress,
          currency.currency === "IDR" ? "GO_PAY" : undefined,
        );

        return orderId.toString();
      },
    });

    if (result.isErr()) {
      // PLACE_ORDER_ERROR — the placeOrder callback threw
      onOrderFailed();
      setFraudStatus("idle");
      setIsPlacingOrder(false);

      track(EVENTS.TRANSACTION, {
        transaction_type: "buy",
        status: "failed",
        amount: buyPreviewState.amount.crypto,
        currency: currency.currency,
        errorMessage: result.error.message,
        paymentChannel: 0,
      });

      console.error("Error placing order", result.error);
      return;
    }

    if (result.value.status === "rejected") {
      triggerErrorHaptic();
      setFraudStatus("rejected");
      setIsPlacingOrder(false);
      toast.error(t("FRAUD_ASSESSMENT_REJECTED"), { duration: 5000 });
      fraudStatusTimeoutRef.current = setTimeout(
        () => setFraudStatus("idle"),
        5000,
      );
      return;
    }

    // Order placed & linked successfully
    setFraudStatus("idle");
    navigate(`${INTERNAL_HREFS.ORDER}/${result.value.orderId}`);
  };

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        orderType="BUY"
      />
      <PWAUpdateDrawer
        open={showContractMismatch}
        onReload={() => window.location.reload()}
      />
      <NonHomeHeader
        title={t("ORDER_PREVIEW")}
        onHelpClick={() => setShowHelpDrawer(true)}
      />
      <main
        className={cn(
          "no-scrollbar container-narrow flex h-full w-full flex-col items-center gap-8 overflow-y-auto py-8 transition-all duration-300",
          isPlacingOrder && "pointer-events-none",
        )}>
        <section className="flex w-full items-start justify-start">
          {ASSETS.IMAGES.USDCFiatOverlapped(currency.currency, {
            className: "h-18",
          })}
        </section>
        <section className="flex w-full items-start justify-start">
          <h2 className="w-3/4 font-medium text-xl">
            {t("CONFIRM_PURCHASE_OF_USDC_WITH_CURRENCY", {
              currency: currency.currency,
            })}
          </h2>
        </section>
        <section className="flex w-full flex-col gap-3">
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("YOU_SEND")}</p>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {formatFiatAmount(
                  buyPreviewState.amount.fiat,
                  currency.currency,
                )}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("FEE")}</p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm">
                {calculateFee(
                  buyPreviewState.amount.crypto,
                  feeConfigSmallOrderThreshold,
                  feeConfigSmallOrderFixedFee,
                ).toFixed(3)}{" "}
                USDC
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("YOU_RECEIVE")}</p>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {(
                  buyPreviewState.amount.crypto -
                  calculateFee(
                    buyPreviewState.amount.crypto,
                    feeConfigSmallOrderThreshold,
                    feeConfigSmallOrderFixedFee,
                  )
                ).toFixed(3)}{" "}
                USDC
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("NETWORK")}</p>
            <div className="flex items-center gap-2">
              <ASSETS.ICONS.NetworkBase className="size-4" />
              <p className="text-muted-foreground text-sm">
                {t("BASE_NETWORK")}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("ESTIMATED_TIME")}</p>
            <div className="flex items-center gap-2">
              <Clock4 className="size-4 text-muted-foreground" />
              {isProcessingTimesLoading ? (
                <Skeleton className="h-4 w-24 rounded-sm" />
              ) : isProcessingTimesError ? (
                <>
                  <AlertTriangle className="size-4 text-destructive" />
                  <p className="text-destructive text-sm">
                    {processingTimesError.message}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("FROM_TO_MINUTES", {
                    from: processingTimes?.buyMin,
                    to: processingTimes?.buyMax,
                  })}
                </p>
              )}
            </div>
          </div>
        </section>
        <DashedSeparator
          className="h-0.5 w-full text-border"
          dashSize="10px"
          dashGap="10px"
        />
        <section className="flex w-full flex-col gap-3">
          {currency.currency === "IDR" ? (
            <>
              <p className="font-medium text-md">{t("PAYMENT_METHOD")}</p>
              <Select defaultValue="GO_PAY">
                <SelectTrigger className="h-10 w-full border-none bg-primary/10">
                  <SelectValue placeholder={t("SELECT_PAYMENT_METHOD")} />
                </SelectTrigger>
                <SelectContent className="h-10 rounded-md border-none bg-primary/10">
                  <SelectItem value="GO_PAY">
                    <div className="flex items-center gap-2">
                      <ASSETS.ICONS.GoPay className="size-4" />
                      <p className="font-medium text-sm">{t("GO_PAY")}</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : null}

          <p className="font-medium text-md">{t("RECEIVING_WALLET_ADDRESS")}</p>
          <Alert variant="warning">
            <AlertTriangle className="size-4" />
            <AlertTitle>
              <p className="font-normal text-foreground text-sm">
                {t("DOUBLE_CHECK_YOUR_RECEIVING_ADDRESS")}
              </p>
            </AlertTitle>
          </Alert>
          <Card className="w-full gap-0 border-none bg-primary/10 shadow-none">
            {showInput || addressBook?.active ? (
              <div className="-translate-x-2 -translate-y-4 w-fit bg-background">
                <div className="flex w-fit items-center gap-2 rounded-sm bg-primary/30 px-2 py-1">
                  {showInput ? (
                    <ClockFading className="size-4" />
                  ) : (
                    <Wallet className="size-4" />
                  )}
                  <p className="rounded-sm font-medium text-xs">
                    {showInput ? t("ONE_TIME_ADDRESS") : t("SAVED_ADDRESS")}
                  </p>
                </div>
              </div>
            ) : null}
            <CardContent className="flex flex-col gap-2">
              {showInput ? (
                <div className="relative flex items-center gap-2">
                  <Input
                    className="rounded-sm bg-background pr-10 placeholder:text-primary/30"
                    placeholder="0x..."
                    value={manualAddress}
                    onChange={handleManualAddressChange}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0"
                    onClick={manualAddress ? clearAddress : handlePasteAddress}>
                    {manualAddress ? (
                      <X className="size-4 text-primary" />
                    ) : (
                      <Clipboard className="size-4 text-primary" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md bg-background p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      {isUsingInAppWallet ? (
                        <ASSETS.ICONS.Logo className="size-5 text-primary" />
                      ) : (
                        <span className="font-medium text-primary text-sm">
                          {getAvatarContent(currentLabel)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-medium text-sm",
                          isUsingInAppWallet &&
                            "bg-linear-to-b from-primary to-primary/70 bg-clip-text font-bold text-transparent",
                        )}>
                        {currentLabel}
                      </p>
                      <p className="font-light text-muted-foreground text-xs">
                        {truncateAddress(currentAddress, 10)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearAddress}>
                    <X className="size-4 text-primary" />
                  </Button>
                </div>
              )}
              <WalletAddressesDrawer onAddressSelected={handleAddressSelection}>
                <Button variant="outline" className="w-full">
                  <BookUser className="mr-2 size-4" />
                  <p className="font-medium text-sm">
                    {t("SAVED_WALLET_ADDRESSES")}
                  </p>
                </Button>
              </WalletAddressesDrawer>
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="container-narrow flex w-full items-center justify-center gap-2 p-4">
        <Button
          onClick={handlePlaceOrder}
          className="w-full p-6"
          disabled={isPlacingOrderDisabled}>
          {fraudStatus === "checking" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              <p className="font-medium text-sm">
                {t("FRAUD_ASSESSMENT_IN_PROGRESS")}
              </p>
            </>
          ) : isPlacingOrder ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              <p className="font-medium text-sm">{t("PLACING_ORDER")}...</p>
            </>
          ) : (
            <p className="font-medium text-sm">{t("PROCEED_TO_PAY")}</p>
          )}
        </Button>
      </footer>
    </>
  );
}
