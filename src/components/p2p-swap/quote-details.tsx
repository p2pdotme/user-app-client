import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import type { useP2PToUsdcSwapQuote, useUsdcToP2PSwapQuote } from "@/hooks";
import { cn } from "@/lib/utils";
import type { SwapDirection } from "./shared";

interface QuoteDetailsProps {
  quote:
    | ReturnType<typeof useUsdcToP2PSwapQuote>
    | ReturnType<typeof useP2PToUsdcSwapQuote>;
  outputSymbol: string;
  direction: SwapDirection;
}

function Row({
  label,
  value,
  valueClassName,
}: {
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
        <Row
          label={t("ESTIMATED_FEE")}
          value={`$${Number(feeUsd).toFixed(2)}`}
        />
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
          valueClassName={
            Number(priceImpact) > 1 ? "text-warning" : "text-success"
          }
        />
      )}
      {route && <Row label={t("ROUTE")} value={route} />}
    </div>
  );
}

// Static Wormhole NTT step — 1:1 bridge, no quote needed
const WORMHOLE_STEP_USDC_TO_P2P = {
  label: "Bridge (Wormhole NTT)",
  from: "P2P (Solana)",
  to: "P2P (Base)",
  note: "~10-15 min · 1:1",
};

const WORMHOLE_STEP_P2P_TO_USDC = {
  label: "Bridge (Wormhole NTT)",
  from: "P2P (Base)",
  to: "P2P (Solana)",
  note: "~10-15 min · 1:1",
};

export function QuoteDetails({
  quote,
  outputSymbol,
  direction,
}: QuoteDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const isUsdcToP2P = direction === "USDC_TO_P2P";

  // For USDC→P2P: Rango, Jupiter, then Wormhole
  // For P2P→USDC: Wormhole, Jupiter, then Rango
  const wormholeStep = isUsdcToP2P
    ? WORMHOLE_STEP_USDC_TO_P2P
    : WORMHOLE_STEP_P2P_TO_USDC;

  const steps = isUsdcToP2P
    ? [quote.step1, quote.step2, null] // null = wormhole
    : [null, quote.step1, quote.step2];

  return (
    <div className="px-1">
      {/* Summary row */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="text-muted-foreground text-sm">
          You receive{" "}
          <span className="font-semibold text-foreground">
            ≈{" "}
            {quote.totalOutputAmount
              ? `${quote.totalOutputAmount} ${outputSymbol}`
              : "—"}
          </span>
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col gap-3">
                  {idx > 0 && <Separator />}
                  {step === null ? (
                    // Wormhole NTT step
                    <div className="flex flex-col gap-1.5">
                      <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                        Step {idx + 1} · {wormholeStep.label}
                      </p>
                      <Row
                        label={`${wormholeStep.from} → ${wormholeStep.to}`}
                        value={wormholeStep.note}
                        valueClassName="text-muted-foreground"
                      />
                    </div>
                  ) : (
                    <StepSection
                      stepNumber={idx + 1}
                      label={step.label}
                      from={step.from}
                      to={step.to}
                      outputAmount={step.outputAmount}
                      outputSymbol={
                        idx === steps.length - 1
                          ? outputSymbol
                          : step.to.split(" ")[0]
                      }
                      feeUsd={step.feeUsd}
                      estimatedTimeInSeconds={step.estimatedTimeInSeconds}
                      priceImpact={step.priceImpact}
                      route={step.route}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
