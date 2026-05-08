import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import type { useP2PSwapQuote } from "@/hooks";
import { cn } from "@/lib/utils";

interface QuoteDetailsProps {
  quote: ReturnType<typeof useP2PSwapQuote>;
}

function Row({ label, value, valueClassName }: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn("text-sm font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

export function QuoteDetails({ quote }: QuoteDetailsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="px-4">
        {/* Summary row — always visible */}
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between"
          onClick={() => setExpanded((prev) => !prev)}>
          <span className="text-muted-foreground text-sm">
            You get{" "}
            <span className="font-semibold text-foreground">
              {quote.totalOutputAmount ? `${quote.totalOutputAmount} P2P` : "—"}
            </span>
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}>
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Expandable breakdown */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden">
              <div className="mt-3 flex flex-col gap-3">
                {/* Step 1: Rango bridge */}
                <div className="flex flex-col gap-1.5">
                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Step 1 · Bridge
                  </p>
                  <Row
                    label="USDC (Base) → USDC (Solana)"
                    value={quote.rango.outputAmount ? `${quote.rango.outputAmount} USDC` : "—"}
                  />
                  {quote.rango.feeUsd && (
                    <Row
                      label={t("ESTIMATED_FEE")}
                      value={`$${Number(quote.rango.feeUsd).toFixed(2)}`}
                    />
                  )}
                  {quote.rango.estimatedTimeInSeconds && (
                    <Row
                      label={t("ESTIMATED_TIME")}
                      value={`~${Math.ceil(quote.rango.estimatedTimeInSeconds / 60)}m`}
                    />
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Step 2: Jupiter swap */}
                <div className="flex flex-col gap-1.5">
                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Step 2 · Swap
                  </p>
                  <Row
                    label="USDC (Solana) → P2P"
                    value={quote.jupiter.outputAmount ? `${quote.jupiter.outputAmount} P2P` : "—"}
                  />
                  {quote.jupiter.priceImpact && (
                    <Row
                      label={t("PRICE_IMPACT")}
                      value={`${Number(quote.jupiter.priceImpact).toFixed(4)}%`}
                      valueClassName={
                        Number(quote.jupiter.priceImpact) > 1 ? "text-warning" : "text-success"
                      }
                    />
                  )}
                  {quote.jupiter.route && (
                    <Row label={t("ROUTE")} value={quote.jupiter.route} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
