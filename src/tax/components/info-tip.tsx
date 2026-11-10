import { ExternalLink, Info } from "lucide-react";
import { Link } from "react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INTERNAL_HREFS } from "@/lib/constants";
import { RULES, type RuleId } from "@/tax/core/tax/rules";
import { getSource } from "@/tax/core/tax/sources";
import type { LawVersion } from "@/tax/core/types";

interface InfoTipProps {
  rule: RuleId;
  law: LawVersion;
  /** Extra line explaining this specific number */
  extra?: string;
}

/**
 * Tap/click popover: the rule in plain English, its legal citation, and links
 * to the exact source documents (plus the full Legal Sources page).
 */
export function InfoTip({ rule, law, extra }: InfoTipProps) {
  const r = RULES[rule];
  return (
    <Popover>
      <PopoverTrigger
        aria-label="How this is calculated"
        className="no-print inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        role="tooltip"
        className="w-80 max-w-[85vw] text-sm leading-relaxed">
        <p>{r.text}</p>
        {extra && <p className="mt-1 text-muted-foreground">{extra}</p>}
        <p className="mt-2 font-medium text-primary text-xs">
          Legal basis: {r.cite[law]}
        </p>
        <ul className="mt-2 flex flex-col gap-1 border-t pt-2">
          {r.sources.map((id) => {
            const s = getSource(id);
            return (
              <li key={id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 text-primary text-xs hover:underline">
                  <span>Source → {s.title}</span>
                  <ExternalLink className="mt-0.5 size-3 shrink-0" />
                </a>
              </li>
            );
          })}
          <li>
            <Link
              to={INTERNAL_HREFS.TAX_SOURCES}
              className="text-muted-foreground text-xs hover:text-primary hover:underline">
              All legal sources →
            </Link>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
