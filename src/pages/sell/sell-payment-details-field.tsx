import { CURRENCY } from "@p2pdotme/sdk/country";
import { BookUser, Clipboard, ClockFading, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PackedPaymentInput, TransferWarningAlert } from "@/components";
import {
  DEFAULT_IDR_PAYMENT_METHOD,
  type IdrPaymentMethod,
  IdrPaymentMethodSelect,
} from "@/components/idr-payment-method-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/settings";
import { useAnalytics, useSellAddressBook } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { formatPaymentIdPreview } from "@/lib/compound-payment-id";
import { usesCatalogPaymentForm } from "@/lib/constants";
import { resolveManualPaymentAddress } from "@/lib/manual-payment-address";
import { SellAddressesDrawer } from "./preview/sell-addresses-drawer";
import { getAvatarContent, resolveSellCurrency } from "./preview/shared";

export type SellPaymentDetailsValue = {
  /** Value stored locally and sent to the contract (IDR packs `Provider|number`). */
  paymentId: string;
  isValid: boolean;
  source: "saved" | "manual" | "none";
};

/**
 * Payment details picker for SELL orders: saved address book entry or a
 * one-time manual entry (with paste, IDR provider select and catalog forms).
 * Shared by the sell preview and the ACCEPTED order screen so both validate
 * the payout ID the same way.
 */
export function SellPaymentDetailsField({
  onChange,
  initialManualAddress,
  analyticsContext,
  currency: currencyOverride,
}: {
  onChange: (value: SellPaymentDetailsValue) => void;
  /** Prefills the manual input (e.g. details the user typed on an earlier attempt). */
  initialManualAddress?: string;
  analyticsContext: "preview" | "accepted";
  /**
   * Currency of an existing order (ACCEPTED screen). Drives validation, IDR
   * packing, catalog forms and which saved address book is shown, so they
   * match the order rather than the app's current currency. The preview
   * omits it and uses the settings currency.
   */
  currency?: string;
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const currency = resolveSellCurrency(settings.currency, currencyOverride);
  const { track } = useAnalytics();
  const { addressBook, refresh: refreshAddressBook } =
    useSellAddressBook(currencyOverride);

  const [manualAddress, setManualAddress] = useState<string>(
    initialManualAddress ?? "",
  );
  // `addressBook` is undefined until the query resolves, so the initial value
  // here can be wrong; it is re-synced once below unless the user already
  // interacted with the field.
  const [showInput, setShowInput] = useState(
    !!initialManualAddress || !addressBook?.active,
  );
  const userInteractedRef = useRef(!!initialManualAddress);
  const [idrPaymentMethod, setIdrPaymentMethod] = useState<IdrPaymentMethod>(
    DEFAULT_IDR_PAYMENT_METHOD,
  );

  const catalogForm = usesCatalogPaymentForm(currency.currency);
  const isIDR = currency.currency === CURRENCY.IDR;
  const {
    paymentAddressName,
    isValid: isManualAddressValid,
    paymentId: manualPaymentId,
  } = resolveManualPaymentAddress({
    currency,
    manualAddress,
    idrPaymentMethod,
  });

  // initial load of address book
  useEffect(() => {
    refreshAddressBook();
  }, [refreshAddressBook]);

  // Sync the saved/manual mode once the address book has loaded.
  const hasActiveSaved = !!addressBook?.active;
  useEffect(() => {
    if (addressBook === undefined || userInteractedRef.current) return;
    setShowInput(!hasActiveSaved);
  }, [addressBook, hasActiveSaved]);

  const usingManual = showInput || !addressBook?.active;
  const savedAddress = addressBook?.active?.address ?? "";

  const value: SellPaymentDetailsValue = usingManual
    ? {
        paymentId: manualAddress.trim() ? manualPaymentId : "",
        isValid: !!manualAddress.trim() && isManualAddressValid,
        source: manualAddress.trim() ? "manual" : "none",
      }
    : {
        paymentId: savedAddress,
        isValid: !!savedAddress.trim(),
        source: "saved",
      };

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current({
      paymentId: value.paymentId,
      isValid: value.isValid,
      source: value.source,
    });
  }, [value.paymentId, value.isValid, value.source]);

  const showInvalidHint =
    usingManual && !!manualAddress.trim() && !isManualAddressValid;

  const markInteracted = () => {
    userInteractedRef.current = true;
  };

  const clearAddress = () => {
    markInteracted();
    setShowInput(true);
    setManualAddress("");
  };

  const handlePasteAddress = async () => {
    markInteracted();
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText?.trim()) {
        setManualAddress(clipboardText.trim());
        setShowInput(true);
        track(EVENTS.TRANSACTION, {
          transaction_type: "sell",
          status: "payment_details_paste_used",
          context: analyticsContext,
          currency: currency.currency,
        });
      } else {
        toast.error(
          t("SELL_UX_CLIPBOARD_EMPTY", {
            paymentAddressName: t(paymentAddressName),
          }),
        );
      }
    } catch (error) {
      toast.error(t("COULD_NOT_ACCESS_CLIPBOARD"));
      console.error("Clipboard error:", error);
    }
  };

  const handleAddressSelection = useCallback(() => {
    userInteractedRef.current = true;
    refreshAddressBook();
    setShowInput(false);
  }, [refreshAddressBook]);

  const savedLabel = addressBook?.active?.label ?? "";

  return (
    <section className="flex w-full flex-col gap-3">
      {/* IDR-specific: provider dropdown above the payment details input */}
      {isIDR ? (
        <IdrPaymentMethodSelect
          value={idrPaymentMethod}
          onChange={(method) => {
            markInteracted();
            setIdrPaymentMethod(method);
          }}
        />
      ) : null}
      <p className="font-medium text-md">{t("CONFIRM_PAYMENT_DETAILS")}</p>
      <TransferWarningAlert currency={currency.currency} />
      <Card className="w-full gap-0 border-none bg-primary/10 shadow-none">
        {(usingManual && manualAddress) || !usingManual ? (
          <div className="-translate-x-2 -translate-y-4 w-fit bg-background">
            <div className="flex w-fit items-center gap-2 rounded-sm bg-primary/30 px-2 py-1">
              {usingManual ? (
                <ClockFading className="size-4" />
              ) : (
                <Wallet className="size-4" />
              )}
              <p className="rounded-sm font-medium text-xs">
                {usingManual
                  ? t("ONE_TIME_PAYMENT_ADDRESS", {
                      paymentAddressName: t(paymentAddressName),
                    })
                  : t("SAVED_PAYMENT_ADDRESS", {
                      paymentAddressName: t(currency.paymentAddressName),
                    })}
              </p>
            </div>
          </div>
        ) : null}
        <CardContent className="flex flex-col gap-2">
          {usingManual ? (
            catalogForm ? (
              <PackedPaymentInput
                currency={currency.currency}
                value={manualAddress}
                onChange={(payload) => {
                  markInteracted();
                  setManualAddress(payload);
                  setShowInput(true);
                }}
              />
            ) : (
              <div className="relative flex items-center gap-2">
                <Input
                  className="rounded-sm bg-background pr-10 placeholder:text-primary/30"
                  placeholder={t("ENTER_PAYMENT_DETAILS", {
                    paymentAddressName: t(paymentAddressName),
                  })}
                  value={manualAddress}
                  aria-invalid={showInvalidHint || undefined}
                  onChange={(e) => {
                    markInteracted();
                    setManualAddress(e.target.value);
                  }}
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
            )
          ) : (
            <div className="flex items-center justify-between rounded-md bg-background p-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-medium text-primary text-sm">
                    {getAvatarContent(savedLabel)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{savedLabel}</p>
                  <p className="max-w-[14rem] truncate font-light text-muted-foreground text-xs">
                    {formatPaymentIdPreview(savedAddress, currency.currency, t)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearAddress}>
                <X className="size-4 text-primary" />
              </Button>
            </div>
          )}
          {showInvalidHint ? (
            <p className="text-destructive text-xs" role="alert">
              {t("SELL_UX_INVALID_PAYMENT_ID", {
                paymentAddressName: t(paymentAddressName),
              })}
            </p>
          ) : null}
          <SellAddressesDrawer
            onAddressSelected={handleAddressSelection}
            currency={currencyOverride}>
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
  );
}
