import {
  AlertTriangle,
  ArrowLeftCircle,
  Clipboard,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { isAddress } from "viem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecoverWallet } from "@/hooks";
import { cn, truncateAmount } from "@/lib/utils";

export function RecoverWallet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    step,
    address,
    balanceFormatted,
    isConnecting,
    isRecovering,
    connect,
    recover,
    reset,
  } = useRecoverWallet();

  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");

  const balance = Number(balanceFormatted);
  const isValidDestination = destination.trim()
    ? isAddress(destination.trim())
    : null;

  const handlePasteDestination = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!isAddress(text)) {
        toast.warning(t("INVALID_ADDRESS_FORMAT"));
        return;
      }
      setDestination(text);
      toast.success(t("ADDRESS_PASTED"));
    } catch {
      toast.error(t("FAILED_TO_READ_CLIPBOARD"));
    }
  };

  const handleBack = () => {
    if (step === "review") {
      reset();
      setPrivateKey("");
      setDestination("");
      setAmount("");
      return;
    }
    navigate(-1);
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeftCircle className="size-6" />
        </Button>
        <h1 className="font-bold text-lg">{t("RECOVER_WALLET")}</h1>
        <div className="w-6" />
      </div>

      <Alert variant="warning" className="w-full py-2">
        <AlertTriangle className="size-4" />
        <AlertDescription className="text-xs text-foreground">
          {t("RECOVER_PRIVATE_KEY_WARNING")}
        </AlertDescription>
      </Alert>

      {step === "input" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              {t("RECOVER_ENTER_PRIVATE_KEY")}
            </p>
            <div className="relative w-full">
              <Input
                type={showKey ? "text" : "password"}
                className="h-12 pr-20 font-mono text-sm"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={isConnecting}
              />
              <div className="-translate-y-1/2 absolute top-1/2 right-1 flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => setShowKey((v) => !v)}
                  disabled={isConnecting}>
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={async () => {
                    try {
                      const text = (
                        await navigator.clipboard.readText()
                      ).trim();
                      setPrivateKey(text);
                    } catch {
                      toast.error(t("FAILED_TO_READ_CLIPBOARD"));
                    }
                  }}
                  disabled={isConnecting}>
                  <Clipboard className="size-4 text-primary" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="h-12 w-full"
            onClick={() => connect(privateKey)}
            disabled={!privateKey || isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("CONNECTING_WALLET")}
              </>
            ) : (
              t("RECOVER_FIND_FUNDS")
            )}
          </Button>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg bg-primary/10 p-4">
            <p className="text-muted-foreground text-sm">
              {t("RECOVER_WALLET_ADDRESS")}
            </p>
            <p className="break-all font-mono text-sm">{address}</p>
            <p className="mt-2 text-muted-foreground text-sm">{t("BALANCE")}</p>
            <p className="font-bold text-2xl text-primary">
              {truncateAmount(balance)} USDC
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              {t("ENTER_RECIPIENT_ADDRESS")}
            </p>
            <div className="relative w-full">
              <Input
                type="text"
                className={cn(
                  "h-12 pr-12",
                  isValidDestination === true && "border-success",
                  isValidDestination === false && "border-destructive",
                )}
                placeholder="0x0000...0000"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                autoComplete="off"
                disabled={isRecovering}
              />
              <Button
                variant="ghost"
                size="icon"
                className="-translate-y-1/2 absolute top-1/2 right-1 size-9"
                onClick={handlePasteDestination}
                disabled={isRecovering}>
                <Clipboard className="size-4 text-primary" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {t("ENTER_AMOUNT")}
              </p>
              <Button
                variant="outline"
                className="h-7 border-none bg-muted text-xs shadow-none"
                onClick={() => setAmount(String(balance))}
                disabled={isRecovering}>
                {t("MAX")}
              </Button>
            </div>
            <Input
              type="number"
              className="h-12"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isRecovering}
            />
          </div>

          <Button
            className="h-12 w-full"
            onClick={() => recover(destination, amount)}
            disabled={
              !destination ||
              !amount ||
              !isValidDestination ||
              balance <= 0 ||
              isRecovering
            }>
            {isRecovering ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("SENDING")}...
              </>
            ) : (
              t("RECOVER_FUNDS")
            )}
          </Button>
        </section>
      )}
    </main>
  );
}
