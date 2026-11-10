import { ArrowRight, Info, Scale, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { INTERNAL_HREFS } from "@/lib/constants";
import { useTaxSettings } from "@/tax/contexts";
import type { ManualData } from "@/tax/core/types";
import { DISCLAIMER } from "@/tax/lib/constants";
import { costMethodOption } from "./cost-methods";

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/** The choices that shape the numbers, in a few words. */
function profileSummary(data: ManualData): string {
  const { costMethod, regime, headOfIncome } = data.settings;
  return [
    costMethodOption(costMethod).name,
    regime === "OLD" ? "Old regime" : "New regime",
    headOfIncome === "BUSINESS" ? "Business income" : "Capital gains",
    ...(data.lots.length > 0
      ? [plural(data.lots.length, "outside lot", "outside lots")]
      : []),
    ...(data.tds.length > 0
      ? [plural(data.tds.length, "TDS entry", "TDS entries")]
      : []),
  ].join(" · ");
}

interface FooterRowProps {
  to: string;
  /** Accessible name of the row */
  label: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

function FooterRow({ to, label, icon, title, children }: FooterRowProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="group flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-primary/10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          {children}
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * Foot of the report: the tax profile (/tax/config), the legal sources
 * (/tax/sources) and the "estimate, not tax advice" note, as one card.
 */
export function ReportFooter() {
  const { data } = useTaxSettings();
  return (
    <footer className="no-print flex flex-col divide-y divide-primary/10 overflow-hidden rounded-2xl bg-primary/5">
      <FooterRow
        to={INTERNAL_HREFS.TAX_CONFIG}
        label="Tax profile"
        icon={<SlidersHorizontal className="size-5" />}
        title="Tax profile">
        <p
          data-testid="tax-profile-summary"
          className="truncate text-muted-foreground text-xs">
          {profileSummary(data)}
        </p>
      </FooterRow>
      <FooterRow
        to={INTERNAL_HREFS.TAX_SOURCES}
        label="Legal sources"
        icon={<Scale className="size-5" />}
        title="Legal sources">
        <p className="truncate text-muted-foreground text-xs">
          The law behind every number in your report
        </p>
      </FooterRow>
      <div
        role="note"
        className="flex items-start gap-2 px-4 py-3 text-muted-foreground text-xs leading-relaxed">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>{DISCLAIMER}</p>
      </div>
    </footer>
  );
}
