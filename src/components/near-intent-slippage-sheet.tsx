import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatPercent, percentToBps } from "@/lib/bps";

const PRESETS_BPS = [50, 100, 200]; // 0.5%, 1%, 2%

type NearIntentSlippageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valueBps: number;
  onConfirm: (bps: number) => void;
};

/** Zashi-style slippage setting sheet: presets, custom %, warning, confirm. */
export function NearIntentSlippageSheet({
  open,
  onOpenChange,
  valueBps,
  onConfirm,
}: NearIntentSlippageSheetProps) {
  const { t } = useTranslation();
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
          <DrawerTitle className="text-2xl">{t("SLIPPAGE")}</DrawerTitle>
          <DrawerDescription className="text-left text-sm leading-relaxed">
            {t("BRIDGE_SLIPPAGE_DESCRIPTION")}
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
                  aria-label={t("BRIDGE_CUSTOM_SLIPPAGE_LABEL")}
                />
                <span className="text-sm">%</span>
              </span>
            ) : (
              <button
                type="button"
                className="h-10 flex-1 rounded-lg text-muted-foreground text-sm"
                onClick={() => setCustomMode(true)}
              >
                {t("CUSTOM")}
              </button>
            )}
          </div>

          {/* Effect summary */}
          <div className="rounded-xl bg-muted p-3 text-center text-sm">
            <Trans
              i18nKey="BRIDGE_SLIPPAGE_EFFECT"
              values={{ percent: draftBps ? formatPercent(draftBps) : "0%" }}
            >
              <span className="font-semibold" />
            </Trans>
          </div>

          {invalidCustom && (
            <p className="text-destructive text-sm">
              {t("BRIDGE_SLIPPAGE_INVALID")}
            </p>
          )}

          {/* Low-slippage warning */}
          {draftBps !== null && draftBps < 200 && (
            <div className="flex items-start gap-2 rounded-xl bg-yellow-500/10 p-3">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                <Trans i18nKey="BRIDGE_SLIPPAGE_WARNING">
                  <span className="font-medium" />
                  <span className="font-medium" />
                </Trans>
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3">
            <Button
              className="w-full p-6"
              disabled={!draftBps}
              onClick={confirm}
            >
              {t("CONFIRM")}
            </Button>
            <Button
              variant="outline"
              className="w-full p-6"
              onClick={() => onOpenChange(false)}
            >
              {t("CANCEL")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
