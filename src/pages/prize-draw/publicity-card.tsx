import { ExternalLink, Loader2, PartyPopper } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { PublicityRequest } from "@/core/prizerail/user-api";
import { usePrizerailPublicityLinks } from "@/hooks/use-prizerail-user";
import { formatPrizeCents } from "@/lib/prizerail";

interface PublicityCardsProps {
  /** Wins the wallet still has to share, from the summary. */
  requests: readonly PublicityRequest[];
}

// What the card says for each stage; anything unknown reads as "awaiting".
const COPY_BY_STATUS: Readonly<Record<string, { body: string; cta: string }>> =
  {
    awaiting: {
      body: "PRIZERAIL_PUBLICITY_AWAITING_BODY",
      cta: "PRIZERAIL_PUBLICITY_AWAITING_CTA",
    },
    in_review: {
      body: "PRIZERAIL_PUBLICITY_IN_REVIEW_BODY",
      cta: "PRIZERAIL_PUBLICITY_IN_REVIEW_CTA",
    },
    rejected: {
      body: "PRIZERAIL_PUBLICITY_REJECTED_BODY",
      cta: "PRIZERAIL_PUBLICITY_REJECTED_CTA",
    },
  };

interface PublicityCardProps {
  request: PublicityRequest;
  /** The winner's own Prizerail form; undefined until it has been read. */
  url: string | undefined;
  isLoading: boolean;
  onRetry: () => void;
}

function PublicityCard({
  request,
  url,
  isLoading,
  onRetry,
}: PublicityCardProps) {
  const { t } = useTranslation();
  const copy = COPY_BY_STATUS[request.status] ?? COPY_BY_STATUS.awaiting;

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border border-success/30 bg-success/10 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/20">
          <PartyPopper className="size-5 text-success" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-semibold text-foreground text-lg leading-tight">
            {t("PRIZERAIL_PUBLICITY_TITLE", {
              amount: formatPrizeCents(request.amountCents),
            })}
          </h2>
          <p className="text-muted-foreground text-sm">{t(copy.body)}</p>
        </div>
      </div>

      {url ? (
        <Button asChild className="h-11 gap-2 rounded-xl font-semibold">
          {/* A real link, so it opens in the browser from the installed app. */}
          <a href={url} target="_blank" rel="noopener noreferrer">
            {t(copy.cta)}
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : isLoading ? (
        <Button disabled className="h-11 gap-2 rounded-xl font-semibold">
          <Loader2 className="size-4 animate-spin" />
          {t("PRIZERAIL_PUBLICITY_LINK_LOADING")}
        </Button>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted-foreground text-sm">
            {t("PRIZERAIL_PUBLICITY_LINK_ERROR")}
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t("TRY_AGAIN")}
          </Button>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        {t("PRIZERAIL_PUBLICITY_PRIVATE_NOTE")}
      </p>
    </section>
  );
}

/**
 * One card per win the wallet has to share before Prizerail releases the
 * prize ($1,000 or more in one draw). The link is the winner's own form: it
 * is read with a wallet signature, only when there is something to share.
 */
export function PublicityCards({ requests }: PublicityCardsProps) {
  const links = usePrizerailPublicityLinks(requests.length > 0);
  const { data, isFetching, refetch } = links;

  // A win that settled after the links were last read has no link yet:
  // read them again, once for each new set of draws.
  const missing = data
    ? requests
        .filter((r) => !data.some((l) => l.drawingId === r.drawingId))
        .map((r) => r.drawingId)
        .join(",")
    : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new set of missing draws should trigger a re-read, not each fetch settling.
  useEffect(() => {
    if (missing && !isFetching) refetch();
  }, [missing]);

  if (requests.length === 0) return null;

  return (
    <>
      {requests.map((request) => (
        <PublicityCard
          key={request.drawingId}
          request={request}
          url={links.data?.find((l) => l.drawingId === request.drawingId)?.url}
          isLoading={links.isLoading || links.isFetching}
          onRetry={() => links.refetch()}
        />
      ))}
    </>
  );
}
