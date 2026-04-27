import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { AlertTriangle, Check, Clock4, Shield, X } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Card, CardContent } from "@/components/ui/card";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn, formatFiatAmount, truncateAmount } from "@/lib/utils";

export interface TransactionCardProps {
  id: string;
  type: "BUY" | "SELL" | "PAY";
  cryptoAmount: number;
  fiatAmount: number;
  currency: CurrencyType;
  status: "PLACED" | "ACCEPTED" | "PAID" | "COMPLETED" | "CANCELLED";
  createdAt: number;
  disputeStatus: "RAISED" | "SETTLED" | "DEFAULT";
}

export function TransactionCard({
  id,
  type,
  cryptoAmount,
  fiatAmount,
  currency,
  status,
  createdAt,
  disputeStatus,
}: TransactionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const TypeIcon =
    type === "BUY"
      ? ASSETS.ICONS.Buy
      : type === "SELL"
        ? ASSETS.ICONS.Sell
        : ASSETS.ICONS.Pay;

  const isProcessing = ["PLACED", "ACCEPTED", "PAID"].includes(status);
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const isDisputeRaised = disputeStatus === "RAISED";
  const isDisputeSettled = disputeStatus === "SETTLED";

  const handleClick = () => {
    navigate(`${INTERNAL_HREFS.ORDER}/${id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="w-full cursor-pointer gap-0 py-4 transition-colors hover:bg-muted/20">
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "relative mt-1 rounded-md bg-primary/20 p-2",
              type === "BUY" && "bg-blue-500/20",
              type === "SELL" && "bg-red-500/20",
            )}>
            <TypeIcon
              className={cn(
                "size-4 text-primary",
                type === "BUY" && "text-blue-500",
                type === "SELL" && "text-red-500",
              )}
            />
            <div className="-right-2 -bottom-2 absolute flex items-center gap-1 rounded-sm bg-background p-1">
              {isDisputeRaised ? (
                <AlertTriangle className="size-3 text-warning" />
              ) : isDisputeSettled ? (
                <Shield className="size-3 text-blue-500" />
              ) : (
                <>
                  {isProcessing && <Clock4 className="size-3 text-warning" />}
                  {isCompleted && <Check className="size-3 text-success" />}
                  {isCancelled && <X className="size-3 text-destructive" />}
                </>
              )}
            </div>
          </div>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <p className="font-medium">{t(type)} USDC</p>
            </div>
            <div className="flex gap-2 text-muted-foreground text-sm">
              <span>{moment.unix(createdAt).format("DD MMM YYYY")}</span>
              <span className="border-border border-l px-2">ID: {id}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <p className="font-medium">
            {type === "BUY" ? "+" : "-"} {truncateAmount(cryptoAmount)} USDC
          </p>
          <div className="flex gap-2 text-muted-foreground text-sm">
            {type === "BUY" ? "-" : "+"}
            <span>{formatFiatAmount(fiatAmount, currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
