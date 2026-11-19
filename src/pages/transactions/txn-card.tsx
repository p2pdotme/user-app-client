import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { AlertTriangle, Check, Clock4, Shield, X } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderProofStatus } from "@/core/encrypted-payment-proof/use-order-proof-status";
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

  // Payment proofs only apply to completed SELL/PAY orders (BUY settles on-chain).
  const proofEligible = isCompleted && (type === "SELL" || type === "PAY");
  const proofStatus = useOrderProofStatus(id, proofEligible);

  const handleClick = () => {
    navigate(`${INTERNAL_HREFS.ORDER}/${id}`);
  };

  // Short, plain-language status so the state isn't conveyed by icon alone.
  const statusPill: { label: string; className: string } = isDisputeRaised
    ? {
        label: t("PAYF_TXN_STATUS_IN_DISPUTE"),
        className: "bg-warning/15 text-warning",
      }
    : isDisputeSettled
      ? {
          label: t("PAYF_TXN_STATUS_DISPUTE_SETTLED"),
          className: "bg-blue-500/15 text-blue-500",
        }
      : isCompleted
        ? { label: t("COMPLETED"), className: "bg-success/15 text-success" }
        : isCancelled
          ? {
              // SELL / PAY lock the user's USDC in escrow, which is returned on
              // cancel; BUY never debited USDC.
              label:
                type === "BUY"
                  ? t("CANCELLED")
                  : t("PAYF_TXN_STATUS_CANCELLED_REFUNDED"),
              className: "bg-muted text-muted-foreground",
            }
          : status === "PLACED"
            ? {
                label: t("PAYF_TXN_STATUS_FINDING_MERCHANT"),
                className: "bg-warning/15 text-warning",
              }
            : status === "ACCEPTED"
              ? {
                  label: t("PAYF_TXN_STATUS_MERCHANT_ASSIGNED"),
                  className: "bg-warning/15 text-warning",
                }
              : {
                  label: t("PAYMENT_IN_PROGRESS"),
                  className: "bg-warning/15 text-warning",
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{t(type)} USDC</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium text-xs",
                  statusPill.className,
                )}>
                {statusPill.label}
              </span>
            </div>
            <div className="flex gap-2 text-muted-foreground text-sm">
              <span>{moment.unix(createdAt).format("DD MMM YYYY")}</span>
              <span className="border-border border-l px-2">ID: {id}</span>
            </div>
            {proofStatus && (
              <Badge
                variant="outline"
                className={cn(
                  "mt-1.5 gap-1 border-warning/40 text-warning",
                  proofStatus !== "PENDING" && "border-success/40 text-success",
                )}>
                {proofStatus === "PENDING" ? (
                  <Clock4 className="size-3" />
                ) : (
                  <Shield className="size-3" />
                )}
                {proofStatus === "PENDING"
                  ? t("PROOF_BADGE_REQUESTED", "Proof requested")
                  : t("PROOF_BADGE_UPLOADED", "Proof ready")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          {isCancelled ? (
            <>
              {/* Nothing moved: no +/- sign, struck through and muted. */}
              <p className="font-medium text-muted-foreground line-through">
                {truncateAmount(cryptoAmount)} USDC
              </p>
              <div className="flex gap-2 text-muted-foreground text-sm line-through">
                <span>{formatFiatAmount(fiatAmount, currency)}</span>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium">
                {type === "BUY" ? "+" : "-"} {truncateAmount(cryptoAmount)} USDC
              </p>
              <div className="flex gap-2 text-muted-foreground text-sm">
                {type === "BUY" ? "-" : "+"}
                <span>{formatFiatAmount(fiatAmount, currency)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
