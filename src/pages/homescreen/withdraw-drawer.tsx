import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeftCircle,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ExternalLink,
  Loader2,
  ScanLine,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { isAddress, parseUnits } from "viem";
import ASSETS from "@/assets";
import { QrScanner } from "@/components/qr-scanner";
import { SupportedNetworksMarquee } from "@/components/supported-networks-marquee";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { transferUSDC } from "@/core/adapters/thirdweb/actions/usdc";
import { viemChain } from "@/core/adapters/thirdweb/chain";
import { useSounds, useThirdweb, useUSDCBalance } from "@/hooks";
import { analytics, EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { extractEvmAddressFromQr } from "@/lib/evm-address-qr";
import {
  getUserFacingErrorMessage,
  isNetworkOrTimeoutError,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { cn, truncateAmount } from "@/lib/utils";

const BLOCK_EXPLORER_URL =
  viemChain.blockExplorers?.default.url ?? "https://basescan.org";

function DirectOrCross({ onSendUSDC }: { onSendUSDC: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout>
      <DrawerHeader>
        <DrawerTitle>{t("WITHDRAW")}</DrawerTitle>
        <DrawerDescription>
          {t("SEND_USDC_FROM_YOUR_P2P_ME_WALLET")}
        </DrawerDescription>
      </DrawerHeader>
      <section className="flex flex-col gap-4 px-4">
        <Card className="cursor-pointer shadow-none" onClick={onSendUSDC}>
          <CardContent className="flex items-center justify-between">
            <div className="flex w-[90%] items-start gap-4">
              <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                <ASSETS.ICONS.WithdrawDirect className="size-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="font-medium">{t("WITHDRAW_BASE_USDC")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("WITHDRAW_USDC_ON_BASE_NETWORK")}
                </p>
              </div>
            </div>
            <ChevronRight className="size-6" />
          </CardContent>
        </Card>
        <Link
          to={`${INTERNAL_HREFS.BRIDGE}?mode=withdraw`}
          className="cursor-pointer">
          <Card className="shadow-none">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                  <ASSETS.ICONS.WithdrawCross className="size-6 text-primary" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-medium">
                    {t("WITHDRAW_USDC_CROSS_CHAIN")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("WITHDRAW_USDC_TO_SUPPORTED_CHAINS")}
                  </p>
                  <div className="mt-2 flex min-w-0 flex-col items-start gap-1">
                    <p className="text-muted-foreground text-sm">
                      {t("SUPPORTED_NETWORKS")}
                    </p>
                    <SupportedNetworksMarquee />
                  </div>
                </div>
              </div>
              <ChevronRight className="size-6" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </motion.div>
  );
}

interface DirectWithdrawProps {
  onBack: () => void;
  isScanning: boolean;
  onScanningChange: (isScanning: boolean) => void;
}

function DirectWithdraw({
  onBack,
  isScanning,
  onScanningChange,
}: DirectWithdrawProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { account } = useThirdweb();
  const { usdcBalance } = useUSDCBalance();
  const sounds = useSounds();

  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  // form → confirm (review amount/address/network) → sent (tx hash)
  const [step, setStep] = useState<"form" | "confirm" | "sent">("form");
  const [sentTx, setSentTx] = useState<{
    hash: string;
    amount: string;
    address: string;
  } | null>(null);

  const balance = usdcBalance || 0;

  // Simple address validation
  const isValidAddress = useMemo(() => {
    if (!recipientAddress.trim()) return null;
    return isAddress(recipientAddress);
  }, [recipientAddress]);

  const handleMax = () => setAmount(String(balance));
  const handle50Percent = () => setAmount(String(balance * 0.5));

  const handlePaste = async () => {
    setIsPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();

      if (!isAddress(trimmedText)) {
        toast.warning(t("INVALID_ADDRESS_FORMAT"));
        return;
      }

      setRecipientAddress(trimmedText);
      toast.success(t("ADDRESS_PASTED"));
    } catch {
      toast.error(t("FAILED_TO_READ_CLIPBOARD"));
    } finally {
      setIsPasting(false);
    }
  };

  const handleOpenScanner = () => {
    setRecipientAddress("");
    onScanningChange(true);
  };

  const handleScan = (data: string) => {
    const address = extractEvmAddressFromQr(data);
    if (!address) {
      toast.warning(t("INVALID_ADDRESS_FORMAT"));
      return;
    }

    setRecipientAddress(address);
    onScanningChange(false);
    toast.success(t("ADDRESS_SCANNED"));
  };

  const handleReview = () => {
    if (!account) {
      toast.warning(t("WALLET_NOT_CONNECTED"));
      return;
    }

    if (!amount || !recipientAddress) {
      toast.warning(t("PLEASE_FILL_IN_ALL_FIELDS"));
      return;
    }

    if (!isAddress(recipientAddress)) {
      toast.warning(t("INVALID_ADDRESS"));
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > balance) {
      toast.warning(t("INVALID_AMOUNT"));
      return;
    }

    analytics.track(EVENTS.TRANSACTION, {
      transaction_type: "withdraw_base",
      status: "confirm_shown",
      amount: numAmount,
    });
    setStep("confirm");
  };

  const handleSend = async () => {
    if (!account || !isAddress(recipientAddress)) return;
    const numAmount = parseFloat(amount);

    setIsLoading(true);

    try {
      const amountInWei = parseUnits(amount, 6);
      const result = await transferUSDC(
        {
          address: recipientAddress as `0x${string}`,
          amount: amountInWei,
        },
        account,
      );

      if (result.isErr()) {
        handleSendError(result.error, numAmount);
        return;
      }

      analytics.track(EVENTS.TRANSACTION, {
        transaction_type: "withdraw_base",
        status: "sent",
        amount: numAmount,
      });
      toast.success(t("USDC_SENT_SUCCESSFULLY", { amount }));
      sounds.triggerSuccessSound(); // Sound feedback for successful USDC transfer
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
      setSentTx({
        hash: result.value.transactionHash,
        amount,
        address: recipientAddress,
      });
      setStep("sent");
      setAmount("");
      setRecipientAddress("");
    } catch (error) {
      handleSendError(error, numAmount);
    } finally {
      setIsLoading(false);
    }
  };

  function handleSendError(error: unknown, numAmount: number) {
    console.error("USDC withdraw failed", error);
    const cancelled = isUserCancellation(error);
    analytics.track(EVENTS.TRANSACTION, {
      transaction_type: "withdraw_base",
      status: "failed",
      amount: numAmount,
      cancelled,
    });
    sounds.triggerFailureSound(); // Sound feedback for failed USDC transfer
    toast.error(t("TRANSFER_FAILED"), {
      description: cancelled
        ? t("ERROR_USER_CANCELLED_DESCRIPTION")
        : getUserFacingErrorMessage(t, error, {
            fallbackKey: "PAYF_WITHDRAW_FAILED_DESCRIPTION",
            context: "send",
          }),
    });
    if (!cancelled && isNetworkOrTimeoutError(error)) {
      // The transfer may have gone through even though we never saw the
      // receipt. Refresh the balance and leave the Confirm step so the user
      // isn't one tap away from sending the same amount again.
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
      setStep("form");
    }
  }

  if (step === "sent" && sentTx) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full">
        <DrawerHeader className="w-full text-center">
          <DrawerTitle>{t("PAYF_WITHDRAW_SENT_TITLE")}</DrawerTitle>
          <DrawerDescription className="hidden">
            {t("PAYF_WITHDRAW_SENT_TITLE")}
          </DrawerDescription>
        </DrawerHeader>
        <section className="flex flex-col items-center gap-4 px-4 pb-4">
          <CheckCircle2 className="size-14 text-success" />
          <p className="text-center font-semibold text-xl">
            {sentTx.amount} USDC
          </p>
          <div className="w-full space-y-1 rounded-lg bg-primary/10 p-3 text-sm">
            <p className="text-muted-foreground">{t("RECIPIENT")}</p>
            <p className="break-all font-mono">{sentTx.address}</p>
          </div>
          <div className="w-full space-y-1 rounded-lg bg-primary/10 p-3 text-sm">
            <p className="text-muted-foreground">{t("TRANSACTION_HASH")}</p>
            <p className="break-all font-mono">{sentTx.hash}</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <a
              href={`${BLOCK_EXPLORER_URL}/tx/${sentTx.hash}`}
              target="_blank"
              rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              {t("PAYF_VIEW_ON_BASESCAN")}
            </a>
          </Button>
          <Button
            className="w-full"
            onClick={() => {
              setSentTx(null);
              setStep("form");
              onBack();
            }}>
            {t("DONE")}
          </Button>
        </section>
      </motion.div>
    );
  }

  if (step === "confirm") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full">
        <DrawerHeader className="w-full text-center">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("GO_BACK")}
              onClick={() => setStep("form")}
              disabled={isLoading}>
              <ArrowLeftCircle className="size-6" />
            </Button>
            <DrawerTitle>{t("PAYF_WITHDRAW_CONFIRM_TITLE")}</DrawerTitle>
            <div className="w-6" />
          </div>
          <DrawerDescription className="hidden">
            {t("PAYF_WITHDRAW_CONFIRM_TITLE")}
          </DrawerDescription>
        </DrawerHeader>
        <section className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-3 rounded-lg bg-primary/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("PAYF_WITHDRAW_AMOUNT")}
              </span>
              <span className="font-semibold text-base">{amount} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("NETWORK")}</span>
              <span className="flex items-center gap-1 font-semibold">
                <ASSETS.ICONS.NetworkBase className="size-4" />
                Base
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">{t("RECIPIENT")}</span>
              <p className="break-all font-mono">{recipientAddress}</p>
            </div>
          </div>
          <Alert variant="warning" className="w-full border-2">
            <AlertTriangle className="size-5" />
            <AlertDescription className="text-foreground text-sm">
              {t("PAYF_WITHDRAW_BASE_SUPPORT_WARNING")}
            </AlertDescription>
          </Alert>
          <Button
            className="h-12 w-full p-4"
            onClick={handleSend}
            disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("SENDING")}...
              </>
            ) : (
              t("PAYF_WITHDRAW_CONFIRM_SEND", { amount })
            )}
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => setStep("form")}
            disabled={isLoading}>
            {t("GO_BACK")}
          </Button>
        </section>
      </motion.div>
    );
  }

  if (isScanning) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full pb-6">
        <DrawerHeader className="w-full text-center">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScanningChange(false)}>
              <ArrowLeftCircle className="size-6" />
            </Button>
            <DrawerTitle>{t("SCAN_UPLOAD_QR")}</DrawerTitle>
            <div className="w-6" />
          </div>
          <DrawerDescription className="hidden">
            {t("ENTER_RECIPIENT_ADDRESS")}
          </DrawerDescription>
        </DrawerHeader>
        <section className="flex justify-center px-4">
          <QrScanner
            analyticsLocation="withdraw_base"
            onScan={handleScan}
            className="w-full max-w-sm"
          />
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isLoading}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <DrawerTitle>{t("WITHDRAW_USDC")}</DrawerTitle>
          <div className="w-6" />
        </div>
        <DrawerDescription className="hidden">
          {t("SEND_USDC_FROM_YOUR_P2P_ME_WALLET")}
        </DrawerDescription>
      </DrawerHeader>

      <section className="flex max-h-[55vh] flex-col items-center gap-6 overflow-y-auto overscroll-contain px-4 pb-[60vh]">
        <div className="relative flex items-center justify-center gap-2">
          <ASSETS.ICONS.Usdc className="size-20 text-primary" />
          <ASSETS.ICONS.NetworkBase className="-right-1 absolute bottom-0 size-8 rounded-full border-4 border-background bg-background" />
        </div>

        <Alert variant="warning" className="w-full py-2">
          <AlertTriangle className="size-4" />
          <AlertDescription className="flex w-full items-center justify-between text-xs">
            <p className="text-foreground">
              {t("WITHDRAW_USDC_ONLY_TO_BASE_ADDRESSES")}
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex w-full items-center justify-between rounded-lg bg-primary/10 p-4">
          <div className="flex flex-1 flex-col items-start">
            <p className="px-2 font-medium">{t("ENTER_AMOUNT")}</p>
            <Input
              type="number"
              className="h-10 border-none bg-transparent font-bold text-2xl text-primary shadow-none placeholder:text-primary/50"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => {
                const el = e.currentTarget;
                // Wait for the soft keyboard to open, then bring the field
                // into view within the scrollable drawer body.
                setTimeout(
                  () =>
                    el.scrollIntoView({ block: "start", behavior: "smooth" }),
                  300,
                );
              }}
              disabled={isLoading}
            />
            <p className="px-2 text-muted-foreground text-sm">
              {t("BALANCE")}:{" "}
              <span className="font-medium">
                {usdcBalance ? truncateAmount(usdcBalance) : "0"}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-none bg-background text-xs shadow-none"
                onClick={handle50Percent}
                disabled={isLoading}>
                50%
              </Button>
              <Button
                variant="outline"
                className="border-none bg-background text-xs shadow-none"
                onClick={handleMax}
                disabled={isLoading}>
                {t("MAX")}
              </Button>
            </div>
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 p-2">
              <div className="relative flex items-center justify-center gap-2">
                <ASSETS.ICONS.Usdc className="size-6 text-primary" />
                <ASSETS.ICONS.NetworkBase className="-right-1 absolute bottom-0 size-3 rounded-full border border-background bg-background" />
              </div>
              <p className="font-medium text-muted-foreground">USDC</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <p className="text-muted-foreground text-sm">
            {t("ENTER_RECIPIENT_ADDRESS")}
          </p>
          <div className="relative w-full">
            <Input
              type="text"
              className={cn(
                "h-10 p-4 pr-20 text-primary placeholder:text-primary/50",
                isValidAddress === true && "border-success",
                isValidAddress === false && "border-destructive",
              )}
              placeholder={"0x0000...0000"}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              onFocus={(e) => {
                const el = e.currentTarget;
                setTimeout(
                  () =>
                    el.scrollIntoView({ block: "start", behavior: "smooth" }),
                  300,
                );
              }}
              autoComplete="off"
              disabled={isLoading}
            />

            <div className="-translate-y-1/2 absolute top-1/2 right-1 flex items-center">
              {/* Scan Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={t("SCAN_UPLOAD_QR")}
                onClick={handleOpenScanner}
                disabled={isLoading}>
                <ScanLine className="size-4 text-primary" />
              </Button>

              {/* Paste Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePaste}
                disabled={isLoading || isPasting}>
                {isPasting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clipboard className="size-4 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <Button
          className="h-12 w-full p-4"
          onClick={handleReview}
          disabled={
            !amount || !recipientAddress || !isValidAddress || isLoading
          }>
          {t("PAYF_WITHDRAW_REVIEW")}
        </Button>
      </section>
    </motion.div>
  );
}

export function WithdrawDrawer({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [page, setPage] = useState<"directOrCross" | "directWithdraw">(
    "directOrCross",
  );

  const [isScanning, setIsScanning] = useState(false);

  const handleSendUSDC = () => setPage("directWithdraw");
  const handleBack = () => {
    setIsScanning(false);
    setPage("directOrCross");
  };

  return (
    <Drawer
      autoFocus={true}
      // Reset only after the close animation finishes — resetting on close
      // triggers the inner page's sideways exit while the drawer slides down.
      onAnimationEnd={(open) => {
        if (!open) handleBack();
      }}>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
        {/* Steps scroll inside the 80dvh drawer so tall ones (e.g. "USDC
            sent" with recipient + hash) never push the footer off-screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {page === "directOrCross" && (
              <DirectOrCross
                key="direct-or-cross"
                onSendUSDC={handleSendUSDC}
              />
            )}
            {page === "directWithdraw" && (
              <DirectWithdraw
                key="direct-withdraw"
                onBack={handleBack}
                isScanning={isScanning}
                onScanningChange={setIsScanning}
              />
            )}
          </AnimatePresence>
        </div>
        {!isScanning && (
          <DrawerFooter className="shrink-0">
            <DrawerClose className="w-full cursor-pointer rounded-md bg-primary p-4 text-primary-foreground">
              {t("CLOSE")}
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
