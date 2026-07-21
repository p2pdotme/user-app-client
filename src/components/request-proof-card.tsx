/**
 * Lets the order creator ask the merchant to attach a payment proof (receipt) to
 * a completed SELL/PAY order, then download it once the merchant (or a circle
 * admin) has uploaded it.
 *
 * Access is role-authorized (see proof-flow.ts): the server stores the raw file
 * and only serves it to wallets whose on-chain role permits viewing this order's
 * proof, gated behind a sign-in-once bearer session.
 *
 * Renders nothing unless the proof service is configured and a wallet is
 * connected, so it is a no-op in environments without the service.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
  Download,
  ExternalLink,
  Eye,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  downloadProofFile as fetchProof,
  type ProofFileDto,
} from "p2pme-encrypted-payment-proof";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { viemChain } from "@/core/adapters/thirdweb/chain";
import {
  createProofClientFor,
  fetchProofPublicConfig,
  isProofServiceConfigured,
} from "@/core/encrypted-payment-proof/client";
import { useThirdweb } from "@/hooks/use-thirdweb";

// How long after completion the buyer may still raise a request. Mirrors the
// server's REQUEST_WINDOW_HOURS so we don't offer a request the server would
// reject with WINDOW_EXPIRED. 0 disables the window (any completed order can
// request).
const REQUEST_WINDOW_HOURS = 48;

// Human-readable file type (the raw MIME reads badly in the UI).
function mimeLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime === "image/png") return "PNG";
  if (mime === "image/jpeg") return "JPEG";
  return mime;
}

// Who attached the proof, in the buyer's language.
function roleLabel(role: ProofFileDto["uploadedByRole"], t: TFunction): string {
  if (role === "MERCHANT") return t("MERCHANT", "Merchant");
  if (role === "CIRCLE_OPERATOR") return t("CIRCLE_OPERATOR", "Support");
  return t("CIRCLE_ADMIN", "Circle admin");
}

export function RequestProofCard({
  orderId,
  completedTimestamp,
  currency,
}: {
  orderId: string;
  // On-chain completion time (unix seconds) — used to hide the request once the
  // 48h window has passed. Optional so callers without it keep the old behavior.
  completedTimestamp?: string;
  // Order's on-chain currency — checked against the server's denylist so the
  // request control is hidden for a disabled currency. Optional so callers
  // without it keep the old behavior.
  currency?: string;
}) {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const [showHelp, setShowHelp] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["proofRequest", orderId];
  const enabled = isProofServiceConfigured() && !!account;

  // Public feature config (currency denylist). Unauthenticated, cached, and only
  // fetched when the service is configured — a UX hint; the server still enforces.
  const { data: publicConfig, isLoading: configLoading } = useQuery({
    queryKey: ["proofPublicConfig"],
    enabled: isProofServiceConfigured(),
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: fetchProofPublicConfig,
  });
  const currencyDisabled =
    !!currency &&
    !!publicConfig &&
    publicConfig.ignoredCurrencies.some(
      (c) => c.toUpperCase() === currency.toUpperCase(),
    );

  const { data: request, isLoading } = useQuery({
    queryKey,
    enabled,
    retry: false,
    staleTime: 30_000,
    // While a request is still PENDING, poll so the card flips to the download
    // state on its own the moment the merchant (or a circle admin) uploads —
    // without the user having to reload. Stop once fulfilled/approved.
    refetchInterval: (query) => {
      const r = query.state.data;
      if (!r) return false;
      return r.status === "PENDING" ? 15_000 : false;
    },
    queryFn: async () => {
      const client = createProofClientFor(account!);
      const { request } = await client.getOrderProofRequests(orderId);
      return request;
    },
  });

  const hasProof =
    request?.status === "FULFILLED" || request?.status === "APPROVED";

  // Toast the buyer the moment the poll observes the request flip from PENDING to
  // uploaded, so an open app surfaces the proof without them watching the card.
  // Guarded on the PENDING->uploaded edge (not first load) so an already-uploaded
  // request opened fresh stays quiet.
  const prevStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = request?.status;
    if (
      prevStatus.current === "PENDING" &&
      (status === "FULFILLED" || status === "APPROVED")
    ) {
      toast.success(t("PROOF_READY", "Your payment proof is ready to view"));
    }
    prevStatus.current = status;
  }, [request?.status, t]);

  const { data: files } = useQuery({
    queryKey: ["proofFiles", request?.id],
    enabled: enabled && hasProof && !!request,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const client = createProofClientFor(account!);
      const { files } = await client.listProofFiles(request!.id);
      return files;
    },
  });

  const requestProof = useMutation({
    mutationFn: async () => {
      const client = createProofClientFor(account!);
      return client.requestProof(orderId);
    },
    onSuccess: (created) => {
      queryClient.setQueryData(queryKey, created);
      toast.success(t("PROOF_REQUESTED"));
    },
    onError: () => toast.error(t("PROOF_REQUEST_FAILED")),
  });

  const download = useMutation({
    mutationFn: async (fileId: string) => {
      const file = files?.find((f) => f.id === fileId);
      if (!file) throw new Error("file not found");
      // Open the viewer tab synchronously, inside the click's user gesture, then
      // point it at the bytes once they arrive. A window.open() issued *after* the
      // await reads as an unsolicited popup and gets blocked on mobile / Safari;
      // if the tab is blocked anyway we fall back to an anchor download, which is
      // never popup-blocked.
      const viewer = window.open("about:blank", "_blank");
      const client = createProofClientFor(account!);
      const blob = await fetchProof(client, file);
      const url = URL.createObjectURL(blob);
      if (viewer) {
        viewer.opener = null;
        viewer.location.replace(url);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `proof-${file.id}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: () => toast.error(t("PROOF_DOWNLOAD_FAILED", "Download failed")),
  });

  if (!enabled) return null;

  // Past the request window with no request ever raised → nothing to show or do
  // (the server would reject a new request as WINDOW_EXPIRED). An existing
  // request/proof still renders so the buyer can track/download it.
  // Use the server's live window (0 disables it) so a single env var controls the
  // gate; fall back to the built-in default until the config loads.
  const windowHours = publicConfig?.requestWindowHours ?? REQUEST_WINDOW_HOURS;
  const windowExpired =
    windowHours > 0 &&
    !!completedTimestamp &&
    Date.now() / 1000 - Number(completedTimestamp) > windowHours * 3600;
  // Nothing to request for a denylisted currency (server returns COUNTRY_DISABLED),
  // so hide the whole card if no request was ever raised. An existing request still
  // renders so the buyer can track/download it.
  if (!request && (windowExpired || currencyDisabled)) return null;

  const statusLabel = request
    ? request.status === "APPROVED"
      ? t("PROOF_APPROVED")
      : request.status === "FULFILLED"
        ? t("PROOF_UPLOADED")
        : t("PROOF_PENDING")
    : null;

  return (
    <Card className="w-full gap-2 shadow-none sm:gap-4">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm">{t("PROOF_TITLE")}</p>
                <button
                  type="button"
                  aria-label={t("PROOF_HELP_TOGGLE", "What is this?")}
                  onClick={() => setShowHelp((v) => !v)}
                  className="shrink-0 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="size-3.5" />
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                {statusLabel ??
                  t("PROOF_SHORT", "Payment receipt — only you can open it")}
              </p>
            </div>
          </div>
          {!request ? (
            // While the currency config is still loading, hold the button back so
            // we never briefly offer a request for a currency that turns out to be
            // on the denylist.
            currency && configLoading ? null : (
              <Button
                size="sm"
                className="shrink-0"
                disabled={isLoading || requestProof.isPending}
                onClick={() => requestProof.mutate()}>
                {requestProof.isPending
                  ? t("PROOF_REQUESTING")
                  : t("PROOF_REQUEST")}
              </Button>
            )
          ) : hasProof && files?.length ? (
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setModalOpen(true)}>
              <Eye className="size-4" />
              {files.length === 1
                ? t("PROOF_VIEW", "View proof")
                : `${t("PROOF_VIEW", "View proof")} · ${files.length}`}
            </Button>
          ) : null}
        </div>
        {showHelp && (
          <p className="rounded-lg bg-muted/40 p-2 text-muted-foreground text-xs leading-relaxed">
            {t(
              "PROOF_HELP",
              "Ask the merchant (or a circle admin) to attach a screenshot or PDF of the payment. Only you and the people authorized on this order can open it — access is checked against your on-chain role every time.",
            )}
          </p>
        )}
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("PROOF_FILES_TITLE", "Payment proofs")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {files?.map((f) => {
              const active = download.isPending && download.variables === f.id;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2.5">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium text-sm">
                      {mimeLabel(f.mimeType)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {Math.max(1, Math.round(f.sizeBytes / 1024))} KB ·{" "}
                      {roleLabel(f.uploadedByRole, t)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5"
                    disabled={download.isPending}
                    onClick={() => download.mutate(f.id)}>
                    {active ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {t("PROOF_DOWNLOAD", "Download")}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * BUY orders settle on-chain — the merchant sends USDC straight to the buyer's
 * receiving address — so the "proof" is the transfer itself, publicly verifiable
 * on the block explorer. There is nothing for a merchant to upload, so instead of
 * the request/upload flow this variant just deep-links to the USDC transfer tx.
 */
export function OnchainProofCard({
  txHash,
  isLoading,
}: {
  txHash?: string;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);
  const explorer = viemChain.blockExplorers?.default;
  const href = explorer && txHash ? `${explorer.url}/tx/${txHash}` : undefined;
  const explorerName =
    explorer?.name ?? t("PROOF_ONCHAIN_EXPLORER", "explorer");

  // No settled transfer to point at → nothing to prove, render nothing.
  if (!isLoading && !href) return null;

  return (
    <Card className="w-full gap-2 shadow-none sm:gap-4">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm">{t("PROOF_TITLE")}</p>
                <button
                  type="button"
                  aria-label={t("PROOF_HELP_TOGGLE", "What is this?")}
                  onClick={() => setShowHelp((v) => !v)}
                  className="shrink-0 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="size-3.5" />
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                {t(
                  "PROOF_ONCHAIN_SHORT",
                  "Settled on-chain — verify the USDC transfer",
                )}
              </p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28 shrink-0" />
          ) : href ? (
            <Button asChild size="sm" className="shrink-0 gap-1.5">
              <a href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {t("PROOF_ONCHAIN_VIEW", "View on-chain")}
              </a>
            </Button>
          ) : null}
        </div>
        {showHelp && (
          <p className="rounded-lg bg-muted/40 p-2 text-muted-foreground text-xs leading-relaxed">
            {t("PROOF_ONCHAIN_HELP", {
              explorer: explorerName,
              defaultValue:
                "This order settled on-chain: the merchant sent USDC straight to your receiving address. Open the transaction on {{explorer}} to verify the transfer — no receipt needed.",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
