import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits, isAddress, parseUnits } from "viem";
import type { Address } from "thirdweb";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { transferP2PToken } from "@/core/adapters/thirdweb/actions/p2p-token";
import { useP2PBalance, useSounds, useThirdweb } from "@/hooks";
import { cn, truncateAmount } from "@/lib/utils";

const P2P_DECIMALS = 6;

export function SendP2PDrawer({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { account } = useThirdweb();
  const { p2pBalanceRaw } = useP2PBalance();
  const sounds = useSounds();

  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const balance =
    p2pBalanceRaw != null
      ? Number(formatUnits(BigInt(String(p2pBalanceRaw)), P2P_DECIMALS))
      : 0;

  const isValidAddress = useMemo(() => {
    if (!address.trim()) return null;
    return isAddress(address);
  }, [address]);

  const reset = () => {
    setAddress("");
    setAmount("");
  };

  const handleSend = async () => {
    if (!account) {
      toast.warning(t("WALLET_NOT_CONNECTED"));
      return;
    }
    if (!address || !amount) {
      toast.warning(t("PLEASE_FILL_IN_ALL_FIELDS"));
      return;
    }
    if (!isAddress(address)) {
      toast.warning(t("INVALID_ADDRESS"));
      return;
    }
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.warning(t("INVALID_AMOUNT"));
      return;
    }
    if (numAmount > balance) return;

    setIsLoading(true);
    try {
      const result = await transferP2PToken(
        { address: address as Address, amount: parseUnits(amount, P2P_DECIMALS) },
        account,
      );

      if (result.isErr()) {
        toast.error(t("TRANSFER_FAILED"));
        sounds.triggerFailureSound();
        return;
      }

      toast.success(t("P2P_SENT_SUCCESSFULLY", { amount: truncateAmount(numAmount) }));
      sounds.triggerSuccessSound();
      queryClient.invalidateQueries({ queryKey: ["p2p", "balance"] });
      setOpen(false);
    } catch {
      toast.error(t("TRANSFER_FAILED"));
      sounds.triggerFailureSound();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next && disabled) return;
        setOpen(next);
      }}
      onClose={reset}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("SEND_P2P")}</DrawerTitle>
        </DrawerHeader>

        <section className="flex flex-col gap-4 px-4">
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p className="text-xs">{t("SEND_P2P_BASE_ONLY_WARNING")}</p>
          </div>

          <Input
            type="text"
            placeholder="0x0000...0000"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="off"
            disabled={isLoading}
            className={cn(
              "h-12 text-base",
              isValidAddress === true && "border-success",
              isValidAddress === false && "border-destructive",
            )}
          />

          <div className="flex flex-col gap-1">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              className={cn(
                "h-12 text-base",
                parseFloat(amount) > balance && balance > 0 && "border-destructive",
              )}
            />
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <button
                type="button"
                disabled={isLoading || balance <= 0}
                onClick={() => setAmount(String(balance * 0.5))}
                className="cursor-pointer rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                50%
              </button>
              <button
                type="button"
                disabled={isLoading || balance <= 0}
                onClick={() => setAmount(String(balance))}
                className="cursor-pointer rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("MAX")}
              </button>
            </div>
            {parseFloat(amount) > balance && balance > 0 && (
              <p className="px-1 text-destructive text-xs">
                {t("INSUFFICIENT_P2P_BALANCE")}
              </p>
            )}
          </div>
        </section>

        <DrawerFooter>
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={handleSend}
            disabled={!address || !amount || isValidAddress !== true || isLoading || parseFloat(amount) > balance}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : t("SEND_P2P")}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full text-base"
              disabled={isLoading}
            >
              {t("CLOSE")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
