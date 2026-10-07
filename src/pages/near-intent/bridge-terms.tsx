import { ExternalLinkIcon, LifeBuoyIcon, ShieldCheckIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const NEAR_INTENTS_SUPPORT_URL = "https://near.com/support";

/** Link to NEAR Intents support. */
function BridgeReportIssuePrompt() {
  return (
    <Trans i18nKey="BRIDGE_REPORT_ISSUE_PROMPT">
      <a
        href={NEAR_INTENTS_SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary underline">
        NEAR Intents support
        <ExternalLinkIcon className="size-3.5" />
      </a>
    </Trans>
  );
}

/** Collapsible terms explaining that bridging runs on NEAR Intents. */
interface BridgeTermsProps {
  isWithdraw: boolean;
}

export function BridgeTerms({ isWithdraw }: BridgeTermsProps) {
  const { t } = useTranslation();

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-2xl bg-primary/10 px-4">
      <AccordionItem value="terms" className="border-b-0">
        <AccordionTrigger className="items-center py-4 hover:no-underline">
          <span className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheckIcon className="size-4" />
            </span>
            <span className="font-medium text-sm">
              {t("BRIDGE_TERMS_TITLE")}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-3 text-muted-foreground text-sm leading-relaxed">
          <p>
            {t(
              isWithdraw
                ? "BRIDGE_TERMS_NEAR_INTENTS_WITHDRAW"
                : "BRIDGE_TERMS_NEAR_INTENTS",
            )}
          </p>
          <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
            <LifeBuoyIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <BridgeReportIssuePrompt />
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
