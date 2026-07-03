import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const PRESETS_BPS = [50, 100, 200]; // 0.5%, 1%, 2%
const MAX_BPS = 5000; // 50%

function formatPercent(bps: number): string {
  return `${(bps / 100).toString()}%`;
}

// Parse a human-entered percent (e.g. "1.5") to bps, null if invalid.
function percentToBps(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const bps = Math.round(parsed * 100);
  return bps > MAX_BPS ? null : bps;
}

type SlippageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valueBps: number;
  onConfirm: (bps: number) => void;
};

/** Zashi-style slippage setting sheet: presets, custom %, warning, confirm. */
export function SlippageSheet({
  open,
  onOpenChange,
  valueBps,
  onConfirm,
}: SlippageSheetProps) {
  const [customMode, setCustomMode] = useState(
    !PRESETS_BPS.includes(valueBps),
  );
  const [customText, setCustomText] = useState(
    PRESETS_BPS.includes(valueBps) ? "" : (valueBps / 100).toString(),
  );
  const [selectedBps, setSelectedBps] = useState(valueBps);

  const customBps = percentToBps(customText);
  const draftBps = customMode ? customBps : selectedBps;
  const invalidCustom = customMode && customText !== "" && customBps === null;

  const confirm = () => {
    if (!draftBps) return;
    onConfirm(draftBps);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="container-narrow gap-2 pt-6 pb-4 text-left">
          <DrawerTitle className="text-2xl">Slippage</DrawerTitle>
          <DrawerDescription className="text-left text-sm leading-relaxed">
            This setting determines the maximum allowable difference between
            the expected price of a swap and the actual price you pay, which
            is outside of our control.
          </DrawerDescription>
        </DrawerHeader>

        <div className="container-narrow flex flex-col gap-4 pb-8">
          {/* Presets + custom segmented control */}
          <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
            {PRESETS_BPS.map((bps) => (
              <button
                key={bps}
                type="button"
                className={`h-10 flex-1 rounded-lg text-sm transition-colors ${
                  !customMode && selectedBps === bps
                    ? "bg-background font-semibold shadow-sm"
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  setCustomMode(false);
                  setSelectedBps(bps);
                }}
              >
                {formatPercent(bps)}
              </button>
            ))}
            {customMode ? (
              <span className="flex h-10 flex-1 items-center justify-center gap-0.5 rounded-lg bg-background font-semibold shadow-sm">
                <input
                  // biome-ignore lint/a11y/noAutofocus: focus follows the user's tap on Custom
                  autoFocus
                  inputMode="decimal"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-10 bg-transparent text-right text-sm outline-none"
                  aria-label="Custom slippage percent"
                />
                <span className="text-sm">%</span>
              </span>
            ) : (
              <button
                type="button"
                className="h-10 flex-1 rounded-lg text-muted-foreground text-sm"
                onClick={() => setCustomMode(true)}
              >
                Custom
              </button>
            )}
          </div>

          {/* Effect summary */}
          <div className="rounded-xl bg-muted p-3 text-center text-sm">
            You may receive up to{" "}
            <span className="font-semibold">
              {draftBps ? formatPercent(draftBps) : "0%"}
            </span>{" "}
            less than quoted.
          </div>

          {invalidCustom && (
            <p className="text-destructive text-sm">
              Enter a value between 0.01% and 50%.
            </p>
          )}

          {/* Low-slippage warning */}
          {draftBps !== null && draftBps < 200 && (
            <div className="flex items-start gap-2 rounded-xl bg-yellow-500/10 p-3">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Slippage <span className="font-medium">under 2%</span>{" "}
                increases the chance your swap will be unsuccessful and
                refunded. Consider using{" "}
                <span className="font-medium">2% or higher</span>, especially
                for larger amounts.
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3">
            <Button
              className="w-full p-6"
              disabled={!draftBps}
              onClick={confirm}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              className="w-full p-6"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
