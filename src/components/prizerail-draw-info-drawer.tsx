import { Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { entriesForOrderUsdc } from "@/lib/prizerail";

interface PrizerailDrawInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Draw-entry rate for this market, in percent (e.g. 2). */
  percentage: number;
}

// Worked example in the explainer: a $100 order at this market's rate.
const EXAMPLE_ORDER_USD = 100;

/**
 * Plain-language explainer behind the (i) on the draw card. One idea per
 * section: how entries are earned, how a winner is picked, what the prizes
 * are, how a winner gets paid, the winner-publicity rule for large prizes,
 * and that entries roll per draw. Kept free of
 * protocol words — the proof and the randomness source live on the public
 * campaign page.
 */
export function PrizerailDrawInfoDrawer({
  open,
  onOpenChange,
  percentage,
}: PrizerailDrawInfoDrawerProps) {
  const { t } = useTranslation();
  const exampleEntries = entriesForOrderUsdc(EXAMPLE_ORDER_USD, percentage);

  const sections = [
    {
      key: "entries",
      title: t("PRIZERAIL_INFO_ENTRIES_TITLE"),
      body: t("PRIZERAIL_INFO_ENTRIES_BODY", {
        perHundred: entriesForOrderUsdc(100, percentage).toLocaleString(),
        exampleOrder: String(EXAMPLE_ORDER_USD),
        exampleEntries: exampleEntries.toLocaleString(),
      }),
    },
    {
      key: "draw",
      title: t("PRIZERAIL_INFO_DRAW_TITLE"),
      body: t("PRIZERAIL_INFO_DRAW_BODY"),
    },
    {
      key: "prizes",
      title: t("PRIZERAIL_INFO_PRIZES_TITLE"),
      body: t("PRIZERAIL_INFO_PRIZES_BODY"),
    },
    {
      key: "payout",
      title: t("PRIZERAIL_INFO_PAYOUT_TITLE"),
      body: t("PRIZERAIL_INFO_PAYOUT_BODY"),
    },
    {
      key: "publicity",
      title: t("PRIZERAIL_INFO_PUBLICITY_TITLE"),
      body: t("PRIZERAIL_INFO_PUBLICITY_BODY"),
    },
    {
      key: "reset",
      title: t("PRIZERAIL_INFO_RESET_TITLE"),
      body: t("PRIZERAIL_INFO_RESET_BODY"),
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col items-center px-6 pt-8 pb-2">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Ticket className="size-8 text-primary" />
          </div>
        </div>

        <DrawerHeader className="items-center gap-2 pb-2 text-center">
          <DrawerTitle className="text-2xl">
            {t("PRIZERAIL_INFO_TITLE")}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("PRIZERAIL_INFO_SUBTITLE")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto px-6 py-4">
          {sections.map((section) => (
            <div key={section.key} className="flex flex-col gap-1">
              <p className="font-semibold text-foreground text-sm">
                {section.title}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
