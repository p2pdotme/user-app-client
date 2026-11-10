import { BadgeCheck, ExternalLink, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { NonHomeHeader } from "@/components/non-home-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/tax/components";
import {
  SOURCE_CATEGORIES,
  SOURCES,
  type Source,
} from "@/tax/core/tax/sources";
import { SOURCES_LAST_REVIEWED } from "@/tax/lib/constants";
import { formatIsoDate } from "@/tax/lib/format";

function SourceRow({ source }: { source: Source }) {
  const host = new URL(source.url).hostname.replace(/^www\./, "");
  return (
    <li
      id={source.id}
      className="flex items-start gap-3 border-t py-4 first:border-t-0">
      <div
        className={cn(
          "mt-0.5 rounded-md p-2",
          source.isOfficial ? "bg-success/15" : "bg-muted",
        )}>
        {source.isOfficial ? (
          <BadgeCheck className="size-4 text-success" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {source.title}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
          {source.isOfficial ? (
            <Badge className="border-transparent bg-success text-primary-foreground">
              Official
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-transparent bg-muted text-muted-foreground">
              Third-party copy
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{source.description}</p>
        <p className="truncate text-muted-foreground text-xs">{host}</p>
      </div>
    </li>
  );
}

export function Sources() {
  usePageMeta({ title: "Legal sources" });
  const navigate = useNavigate();
  return (
    <>
      <NonHomeHeader
        title="Legal sources"
        subtitle="The law behind every number in your report"
        showHelp={false}
        onBack={() => navigate(INTERNAL_HREFS.TAX)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-8 overflow-y-auto py-6">
        {SOURCE_CATEGORIES.map((cat) => {
          const items = SOURCES.filter((s) => s.category === cat.id);
          return (
            <section
              key={cat.id}
              id={cat.id}
              aria-labelledby={`${cat.id}-title`}
              className="flex flex-col gap-3">
              <div id={`${cat.id}-title`}>
                <SectionHeader title={cat.title} />
              </div>
              <Card className="w-full gap-0 py-0">
                <CardContent className="px-4">
                  <ul>
                    {items.map((s) => (
                      <SourceRow key={s.id} source={s} />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          );
        })}
        <p className="border-t pt-4 text-center text-muted-foreground text-xs">
          For information only, not tax advice. Please consult a Chartered
          Accountant. Last reviewed: {formatIsoDate(SOURCES_LAST_REVIEWED)}.
        </p>
      </main>
    </>
  );
}
