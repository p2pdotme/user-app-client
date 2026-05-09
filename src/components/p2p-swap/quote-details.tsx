import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { useP2PToUsdcSwapQuote, useUsdcToP2PSwapQuote } from "@/hooks";
import { cn } from "@/lib/utils";

interface QuoteDetailsProps {
  quote: ReturnType<typeof useUsdcToP2PSwapQuote> | ReturnType<typeof useP2PToUsdcSwapQuote>;
  outputSymbol: string;
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

function StepSection({
  stepNumber,
  label,
  from,
  to,
  outputAmount,
  outputSymbol,
  feeUsd,
  estimatedTimeInSeconds,
  priceImpact,
  route,
}: {
  stepNumber: number;
  label: string;
  from: string;
  to: string;
  outputAmount: string | null;
  outputSymbol: string;
  feeUsd: string | number | null | undefined;
  estimatedTimeInSeconds: number | null | undefined;
  priceImpact: string | null | undefined;
  route: string | null | undefined;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        Step {stepNumber} · {label}
      </p>
      <Row
        label={`${from} → ${to}`}
        value={outputAmount ? `${outputAmount} ${outputSymbol}` : "—"}
      />
      {feeUsd && (
        <Row label={t("ESTIMATED_FEE")} value={`$${Number(feeUsd).toFixed(2)}`} />
      )}
      {estimatedTimeInSeconds && (
        <Row
          label={t("ESTIMATED_TIME")}
          value={`~${Math.ceil(estimatedTimeInSeconds / 60)}m`}
        />
      )}
      {priceImpact && (
        <Row
          label={t("PRICE_IMPACT")}
          value={`${Number(priceImpact).toFixed(4)}%`}
          valueClassName={Number(priceImpact) > 1 ? "text-warning" : "text-success"}
        />
      )}
      {route && <Row label={t("ROUTE")} value={route} />}
    </div>
  );
}

export function QuoteDetails({ quote, outputSymbol }: QuoteDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="px-4 py-3">
        {/* Summary row */}
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between"
          onClick={() => setExpanded((prev) => !prev)}>
          <span className="text-muted-foreground text-sm">
            You get{" "}
            <span className="font-semibold text-foreground">
              {quote.totalOutputAmount ? `${quote.totalOutputAmount} ${outputSymbol}` : "—"}
            </span>
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}>
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden">
              <div className="mt-3 flex flex-col gap-3">
                <StepSection
                  stepNumber={1}
                  label={quote.step1.label}
                  from={quote.step1.from}
                  to={quote.step1.to}
                  outputAmount={quote.step1.outputAmount}
                  outputSymbol={quote.step1.to.split(" ")[0]}
                  feeUsd={quote.step1.feeUsd}
                  estimatedTimeInSeconds={quote.step1.estimatedTimeInSeconds}
                  priceImpact={quote.step1.priceImpact}
                  route={quote.step1.route}
                />
                <Separator />
                <StepSection
                  stepNumber={2}
                  label={quote.step2.label}
                  from={quote.step2.from}
                  to={quote.step2.to}
                  outputAmount={quote.step2.outputAmount}
                  outputSymbol={outputSymbol}
                  feeUsd={quote.step2.feeUsd}
                  estimatedTimeInSeconds={quote.step2.estimatedTimeInSeconds}
                  priceImpact={quote.step2.priceImpact}
                  route={quote.step2.route}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
