import { ABIS } from "@p2pdotme";
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
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { parseUnits, zeroAddress } from "viem";
import ASSETS from "@/assets";
import { DashedSeparator, NonHomeHeader } from "@/components";
import { PWAUpdateDrawer } from "@/components/pwa-update-drawer";
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
import { useSettings } from "@/contexts/settings";
import {
  useAnalytics,
  useOrderFlow,
  useProcessingTimes,
  useSellAddressBook,
  useThirdweb,
} from "@/hooks";
import { useContractVersion } from "@/hooks/use-contract-version";
import { EVENTS } from "@/lib/analytics";
import {
  getPaymentIdFields,
  serializeCompoundPaymentId,
} from "@/lib/compound-payment-id";
import { INTERNAL_HREFS, ORDER_TYPE } from "@/lib/constants";
import { placeOrderErrorKey } from "@/lib/errors";
import {
  addLocalOrderPaymentDetails,
  cn,
  extractOrderIdFromOrderPlaced,
  formatFiatAmount,
  validatePaymentAddress,
} from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../../order/help-drawer";
import { FundProtectionGuidelines } from "./fund-protection-guidelines";
import { SellAddressesDrawer } from "./sell-addresses-drawer";
import {
  getAvatarContent,
  type SellPreviewState,
  SellPreviewStateSchema,
} from "./shared";

/**
 * @description This page uses the amount passed from the previous page.
 * It takes a "receiving address" input from the user and places an order on the P2P.me protocol.
 * The protocol returns an order ID, which is the single source of truth.
 * This order ID is then sent to the next page as the `order/orderId` URL parameter.
 * The order details will be fetched on the next page directly from the protocol using the order ID.
 */
export function SellPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const {
    settings: { currency },
  } = useSettings();

  const { addressBook, refresh: refreshAddressBook } = useSellAddressBook();
  const { placeOrderMutation } = useOrderFlow();
  const { account } = useThirdweb();
  const {
    data: processingTimes,
    isLoading: isProcessingTimesLoading,
    isError: isProcessingTimesError,
    error: processingTimesError,
  } = useProcessingTimes();
  const { track } = useAnalytics();

  const [sellPreviewState, setSellPreviewState] = useState<SellPreviewState>({
    amount: {
      crypto: 0,
      fiat: 0,
    },
  });

  // State for manual address input
  // Determine if we're using manual input (no saved payment methods)
  const hasNoSavedPaymentMethods = !addressBook?.active;
  const [showInput, setShowInput] = useState(hasNoSavedPaymentMethods);
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Compound payment ID support (e.g. VEN: phone + RIF)
  const paymentIdFields = getPaymentIdFields(currency.currency);
  const isCompound = paymentIdFields.length > 1;
  const [compoundValues, setCompoundValues] = useState<Record<string, string>>(
    {},
  );

  // State for contract version mismatch dialog
  const [showContractMismatch, setShowContractMismatch] = useState(false);

  const { checkContractSync } = useContractVersion();
  // validate the state being passed from the previous page
  useEffect(() => {
    safeParseWithResult(SellPreviewStateSchema, locationState).match(
      (data) => {
        setSellPreviewState(data);
      },
      (error) => {
        console.error("SellPreviewLocationState", error);
        navigate(INTERNAL_HREFS.SELL);
      },
    );
  }, [navigate, locationState]);

  // initial load of address book
  useEffect(() => {
    refreshAddressBook();
  }, [refreshAddressBook]);

  // Get the current active address, either from addressBook or manual input
  const getCurrentAddress = () => {
    if (showInput && manualAddress) {
      return manualAddress;
    }

    if (addressBook?.active) {
      return addressBook.active.address;
    }

    return ""; // No fallback - user must enter payment details
  };

  // Get current address label
  const getCurrentLabel = () => {
    if (showInput && manualAddress) {
      return `${t(`ONE_TIME_PAYMENT_ADDRESS`, {
        paymentAddressName: currency.paymentAddressName,
      })}`;
    }

    if (addressBook?.active) {
      return addressBook.active.label;
    }

    return t(`ENTER_PAYMENT_DETAILS`, {
      paymentMethod: currency.paymentMethod,
    }); // Prompt user to enter details
  };

  const clearAddress = () => {
    setShowInput(true);
    setManualAddress("");
    setCompoundValues({});
  };

  const handleManualAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setManualAddress(e.target.value);
  };

  const updateCompoundValue = (key: string, value: string) => {
    setCompoundValues((prev) => ({ ...prev, [key]: value.replace(/\|/g, "") }));
  };

  // Sync compound values to manual address
  useEffect(() => {
    if (!isCompound) return;
    const values = paymentIdFields.map((f) => compoundValues[f.key] || "");
    if (values.some((v) => v.length > 0)) {
      setManualAddress(serializeCompoundPaymentId(...values));
    } else {
      setManualAddress("");
    }
  }, [compoundValues, isCompound, paymentIdFields]);

  const handlePasteAddress = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText?.trim()) {
        setManualAddress(clipboardText.trim());
        setShowInput(true);
      } else {
        toast.error(t("INVALID_WALLET_ADDRESS_FORMAT"));
      }
    } catch (error) {
      toast.error(t("COULD_NOT_ACCESS_CLIPBOARD"));
      console.error("Clipboard error:", error);
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
    (!addressBook?.active && !manualAddress.trim()) || // No saved method and no manual input
    (showInput && !validatePaymentAddress(manualAddress, currency.currency)) || // Manual input mode but invalid
    (addressBook?.active && !addressBook.active.address.trim()); // Saved method but invalid

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);

    // Check contract version before proceeding
    const isSynced = await checkContractSync();
    if (!isSynced) {
      setShowContractMismatch(true);
      setIsPlacingOrder(false);
      return;
    }

    await placeOrderMutation.mutateAsync(
      {
        amount: parseUnits(sellPreviewState.amount.crypto.toString(), 6),
        recipientAddr: zeroAddress,
        orderType: ORDER_TYPE.SELL,
        currency: currency.currency,
        fiatAmount: parseUnits(sellPreviewState.amount.fiat.toString(), 6),
        user: account?.address as `0x${string}`,
      },
      {
        onSuccess: (receipt) => {
          const orderId = extractOrderIdFromOrderPlaced(
            ABIS.DIAMOND,
            receipt.logs,
          );
          if (!orderId) {
            toast.error(t("ORDER_ID_NOT_FOUND"));
            return;
          }

          // Track transaction started upon successful order placement
          track(EVENTS.TRANSACTION, {
            transaction_type: "sell",
            status: "placed",
            amount: sellPreviewState.amount.crypto,
            orderId: orderId.toString(),
            currency: currency.currency,
            paymentChannel: 0,
          });
          // Store payment details (IDR gets GO_PAY prefix, others store address directly)
          addLocalOrderPaymentDetails(
            orderId.toString(),
            currentAddress,
            currency.currency === "IDR" ? "GO_PAY" : undefined,
          );
          navigate(`${INTERNAL_HREFS.ORDER}/${orderId}`);
        },
        onError: (error) => {
          // Track failed sell transaction
          track(EVENTS.TRANSACTION, {
            transaction_type: "sell",
            status: "failed",
            amount: sellPreviewState.amount.crypto,
            errorMessage: error.message,
            currency: currency.currency,
            paymentChannel: 0,
          });

          console.error("Error placing order", error);
          const key = placeOrderErrorKey(error);
          toast.error(
            t(key),
            key === "FAILED_TO_PLACE_ORDER"
              ? {
                  description: error.message,
                }
              : undefined,
          );
          setIsPlacingOrder(false);
        },
      },
    );
  };

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        orderType="SELL"
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
            {t("CONFIRM_SALE_OF_USDC_WITH_CURRENCY", {
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
                {sellPreviewState.amount.crypto} USDC
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("YOU_RECEIVE")}</p>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {formatFiatAmount(
                  sellPreviewState.amount.fiat,
                  currency.currency,
                )}
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
                    from: processingTimes?.sellMin,
                    to: processingTimes?.sellMax,
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
          <p className="font-medium text-md">{t("CONFIRM_PAYMENT_DETAILS")}</p>
          <Card className="w-full gap-0 border-none bg-primary/10 shadow-none">
            {(showInput && manualAddress) || addressBook?.active ? (
              <div className="-translate-x-2 -translate-y-4 w-fit bg-background">
                <div className="flex w-fit items-center gap-2 rounded-sm bg-primary/30 px-2 py-1">
                  {showInput ? (
                    <ClockFading className="size-4" />
                  ) : (
                    <Wallet className="size-4" />
                  )}
                  <p className="rounded-sm font-medium text-xs">
                    {showInput
                      ? t("ONE_TIME_PAYMENT_ADDRESS", {
                          paymentAddressName: t(currency.paymentAddressName),
                        })
                      : t("SAVED_PAYMENT_ADDRESS", {
                          paymentAddressName: t(currency.paymentAddressName),
                        })}
                  </p>
                </div>
              </div>
            ) : null}
            <CardContent className="flex flex-col gap-2">
              {showInput || hasNoSavedPaymentMethods ? (
                isCompound ? (
                  <div className="flex flex-col gap-2">
                    {paymentIdFields.map((fieldConfig) => (
                      <div
                        key={fieldConfig.key}
                        className="relative flex items-center gap-2">
                        <Input
                          className="rounded-sm bg-background pr-10 placeholder:text-primary/30"
                          placeholder={t("ENTER_PAYMENT_DETAILS", {
                            paymentAddressName: t(fieldConfig.label),
                          })}
                          value={compoundValues[fieldConfig.key] || ""}
                          onChange={(e) =>
                            updateCompoundValue(fieldConfig.key, e.target.value)
                          }
                        />
                        {manualAddress &&
                          fieldConfig ===
                            paymentIdFields[paymentIdFields.length - 1] && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0"
                              onClick={clearAddress}>
                              <X className="size-4 text-primary" />
                            </Button>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2">
                    <Input
                      className="rounded-sm bg-background pr-10 placeholder:text-primary/30"
                      placeholder={t("ENTER_PAYMENT_DETAILS", {
                        paymentAddressName: t(currency.paymentAddressName),
                      })}
                      value={manualAddress}
                      onChange={handleManualAddressChange}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0"
                      onClick={
                        manualAddress ? clearAddress : handlePasteAddress
                      }>
                      {manualAddress ? (
                        <X className="size-4 text-primary" />
                      ) : (
                        <Clipboard className="size-4 text-primary" />
                      )}
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between rounded-md bg-background p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <span className="font-medium text-primary text-sm">
                        {getAvatarContent(currentLabel)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{currentLabel}</p>
                      <p className="font-light text-muted-foreground text-xs">
                        {currentAddress}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearAddress}>
                    <X className="size-4 text-primary" />
                  </Button>
                </div>
              )}
              <SellAddressesDrawer onAddressSelected={handleAddressSelection}>
                <Button variant="outline" className="w-full">
                  <BookUser className="mr-2 size-4" />
                  <p className="font-medium text-sm">
                    {t("SAVED_ADDRESSES", {
                      paymentAddressName: t(currency.paymentAddressName),
                    })}
                  </p>
                </Button>
              </SellAddressesDrawer>
            </CardContent>
          </Card>
        </section>
        <FundProtectionGuidelines />
      </main>
      <footer className="container-narrow flex w-full items-center justify-center gap-2 p-4">
        <Button
          onClick={handlePlaceOrder}
          className="w-full p-6"
          disabled={isPlacingOrderDisabled}>
          {isPlacingOrder ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              <p className="font-medium text-sm">{t("PLACING_ORDER")}...</p>
            </>
          ) : (
            <p className="font-medium text-sm">{t("PLACE_ORDER")}</p>
          )}
        </Button>
      </footer>
    </>
  );
}
