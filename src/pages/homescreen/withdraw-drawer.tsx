import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeftCircle,
  ChevronRight,
  Clipboard,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { isAddress, parseUnits } from "viem";
import ASSETS from "@/assets";
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
import { useSounds, useThirdweb, useUSDCBalance } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn, truncateAmount } from "@/lib/utils";

const SUPPORTED_NETWORKS = [
  {
    name: "Solana",
    icon: ASSETS.ICONS.NetworkSolana,
  },
  {
    name: "Polygon",
    icon: ASSETS.ICONS.NetworkPolygon,
  },
  {
    name: "Arbitrum",
    icon: ASSETS.ICONS.NetworkArbitrum,
  },
  {
    name: "Ethereum",
    icon: ASSETS.ICONS.NetworkEthereum,
  },
  {
    name: "BSC",
    icon: ASSETS.ICONS.NetworkBsc,
  },
  {
    name: "Optimism",
    icon: ASSETS.ICONS.NetworkOptimism,
  },
];

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
        <Link to={INTERNAL_HREFS.WITHDRAW} className="cursor-pointer">
          <Card className="shadow-none">
            <CardContent className="flex items-center justify-between">
              <div className="flex w-[90%] items-start gap-4">
                <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2">
                  <ASSETS.ICONS.WithdrawCross className="size-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="font-medium">
                    {t("WITHDRAW_USDC_CROSS_CHAIN")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("WITHDRAW_USDC_TO_SUPPORTED_CHAINS")}
                  </p>
                  <div className="mt-2 flex flex-col items-start gap-1">
                    <p className="text-muted-foreground text-sm">
                      {t("SUPPORTED_NETWORKS")}
                    </p>
                    <div className="flex items-center gap-1">
                      {SUPPORTED_NETWORKS.map((network) => (
                        <network.icon key={network.name} />
                      ))}
                    </div>
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

function DirectWithdraw({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { account } = useThirdweb();
  const { usdcBalance } = useUSDCBalance();
  const sounds = useSounds();

  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

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

  const handleSend = async () => {
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
        toast.error(t("TRANSFER_FAILED"));
        sounds.triggerFailureSound(); // Sound feedback for transfer error
        return;
      }

      toast.success(t("USDC_SENT_SUCCESSFULLY", { amount }));
      sounds.triggerSuccessSound(); // Sound feedback for successful USDC transfer
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
      setAmount("");
      setRecipientAddress("");
      onBack();
    } catch {
      toast.error(t("TRANSFER_FAILED"));
      sounds.triggerFailureSound(); // Sound feedback for failed USDC transfer
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
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

      <section className="flex flex-col items-center gap-6 px-4">
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
                "h-10 p-4 pr-12 text-primary placeholder:text-primary/50",
                isValidAddress === true && "border-success",
                isValidAddress === false && "border-destructive",
              )}
              placeholder={"0x0000...0000"}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              autoComplete="off"
              disabled={isLoading}
            />

            {/* Paste Button */}
            <Button
              variant="ghost"
              size="sm"
              className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
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

        <Button
          className="h-12 w-full p-4"
          onClick={handleSend}
          disabled={
            !amount || !recipientAddress || !isValidAddress || isLoading
          }>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("SENDING")}...
            </>
          ) : (
            t("WITHDRAW_USDC")
          )}
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

  const handleSendUSDC = () => setPage("directWithdraw");
  const handleBack = () => setPage("directOrCross");

  return (
    <Drawer autoFocus={true} onClose={() => setPage("directOrCross")}>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
        <AnimatePresence mode="wait" initial={false}>
          {page === "directOrCross" && (
            <DirectOrCross key="direct-or-cross" onSendUSDC={handleSendUSDC} />
          )}
          {page === "directWithdraw" && (
            <DirectWithdraw key="direct-withdraw" onBack={handleBack} />
          )}
        </AnimatePresence>
        <DrawerFooter>
          <DrawerClose className="w-full cursor-pointer rounded-md bg-primary p-4 text-primary-foreground">
            {t("CLOSE")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
