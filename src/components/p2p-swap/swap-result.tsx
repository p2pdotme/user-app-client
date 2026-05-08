import { CheckCircle, Copy, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { P2P_TOKEN_DECIMALS } from "@/core/jupiter";
import type { P2PSwapState } from "@/hooks";

interface SwapResultProps {
  state: P2PSwapState;
  onReset: () => void;
}

export function SwapResult({ state, onReset }: SwapResultProps) {
  const { t } = useTranslation();

  if (state.step === "completed") {
    return (
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-5 text-success" />
            <span className="font-semibold">{t("SWAP_SUCCESSFUL")}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("YOU_SENT")}</span>
              <span className="font-medium">{state.inputAmount} USDC</span>
            </div>
            {state.jupiterOutputAmount && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("YOU_RECEIVED")}</span>
                <span className="font-medium">
                  {formatUnits(BigInt(state.jupiterOutputAmount), P2P_TOKEN_DECIMALS)} P2P
                </span>
              </div>
            )}
          </div>

          {state.jupiterSignature && (
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  {t("TRANSACTION_SIGNATURE")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(state.jupiterSignature!);
                    toast.success(t("COPIED_TO_CLIPBOARD"));
                  }}>
                  <Copy className="size-3" />
                </Button>
              </div>
              <p className="mt-1 truncate text-muted-foreground text-xs">
                {state.jupiterSignature}
              </p>
            </div>
          )}

          <Button className="w-full" onClick={onReset}>
            {t("DONE")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="size-5 text-destructive" />
          <span className="font-semibold">{t("SWAP_FAILED")}</span>
        </div>
        {state.error && (
          <p className="text-muted-foreground text-sm">{state.error}</p>
        )}
        <Button className="w-full" variant="outline" onClick={onReset}>
          {t("DONE")}
        </Button>
      </CardContent>
    </Card>
  );
}
