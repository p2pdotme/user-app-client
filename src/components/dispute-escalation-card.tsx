import { Check, Circle, Dot } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DisputeStatus } from "@/core/adapters/thirdweb/validation";
import {
  useChallengeDispute,
  useDisputeEscalation,
  useHapticInteractions,
} from "@/hooks";
import {
  useDisputeHistory,
  useSubgraphOrder,
} from "@/hooks/use-subgraph-order";
import {
  DISPUTE_TIER_LABEL_KEYS,
  type DisputeEscalationView,
  type DisputeTier,
  deriveDisputeEscalationView,
} from "@/lib/dispute-escalation";
import { buildDisputeStages, type DisputeStage } from "@/lib/dispute-stages";
import { cn } from "@/lib/utils";
import {
  type DisputeChallengeAction,
  DisputeChallengeDrawer,
} from "./dispute-challenge-drawer";

interface DisputeEscalationCardProps {
  orderId: string;
  disputeStatus: DisputeStatus;
}

type Translate = (key: string, opts?: Record<string, unknown>) => string;

const fmt = (sec?: number) =>
  sec ? moment.unix(sec).format("DD MMM, hh:mm A") : "";
const tierLabel = (t: Translate, tier: number) =>
  t(DISPUTE_TIER_LABEL_KEYS[Math.min(3, Math.max(1, tier)) as DisputeTier]);

const STAGE_LABEL_KEYS = {
  raised: "DISPUTE_STAGE_RAISED",
  tier1: "DISPUTE_TIER_1",
  tier2: "DISPUTE_TIER_2",
  tier3: "DISPUTE_TIER_3",
  settled: "DISPUTE_STAGE_SETTLED",
} as const;

const ACTION_LABEL_KEYS: Record<DisputeChallengeAction, string> = {
  challenge: "DISPUTE_CHALLENGE_DECISION",
  escalate: "DISPUTE_ESCALATE",
  finalize: "DISPUTE_FINALIZE",
};
const ACTION_HINT_KEYS: Record<DisputeChallengeAction, string> = {
  challenge: "DISPUTE_HINT_CHALLENGE",
  escalate: "DISPUTE_HINT_ESCALATE",
  finalize: "DISPUTE_HINT_FINALIZE",
};

/**
 * Order-page dispute card: a one-paragraph summary of where the dispute is
 * and what happens next, the five-stage ladder with what happened at each
 * stage, and the single action the contract allows right now.
 *
 * Shown only when the user can act, or to report a dispute they already
 * challenged (including its settlement). A dispute waiting at tier 1 with
 * nothing to do, or settled without ever being challenged, renders nothing.
 */
export function DisputeEscalationCard({
  orderId,
  disputeStatus,
}: DisputeEscalationCardProps) {
  const { t } = useTranslation();
  const { triggerWarningHaptic, triggerSuccessHaptic, triggerErrorHaptic } =
    useHapticInteractions();
  const isRaised = disputeStatus === "RAISED";
  const isSettled = disputeStatus === "SETTLED";
  const { data: escalation } = useDisputeEscalation(orderId, isRaised);
  const { data: subgraphOrder } = useSubgraphOrder(orderId, isSettled);
  const { data: steps = [] } = useDisputeHistory(
    orderId,
    isRaised || isSettled,
  );
  const { appealDisputeMutation, finalizeDisputeMutation } =
    useChallengeDispute();
  const [pendingAction, setPendingAction] =
    useState<DisputeChallengeAction | null>(null);

  if (!isRaised && !isSettled) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const view =
    isRaised && escalation
      ? deriveDisputeEscalationView(escalation, nowSec)
      : null;

  if (isRaised) {
    if (!escalation || !view) return null;
    const wasChallenged = escalation.tier > 1;
    if (!view.canAppeal && !view.canFinalize && !wasChallenged) return null;
  } else {
    // disputeTier is the tier the dispute ended on; anything above 1 means
    // the user challenged at least once.
    const wasChallenged = (subgraphOrder?.disputeTier ?? 0) > 1;
    if (!wasChallenged) return null;
  }

  const stages = buildDisputeStages({
    disputeStatus: isRaised ? "RAISED" : "SETTLED",
    escalation,
    steps,
    settledAt: Number(subgraphOrder?.disputeSettledAt ?? 0) || undefined,
  });
  const settledFault =
    stages[stages.length - 1].fault ?? subgraphOrder?.disputeFaultType;
  const action = view ? actionForView(view) : null;
  const nextTierLabel = view?.nextTier ? tierLabel(t, view.nextTier) : "";
  const isSubmitting =
    appealDisputeMutation.isPending || finalizeDisputeMutation.isPending;

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const isFinalize = pendingAction === "finalize";
    const mutation = isFinalize
      ? finalizeDisputeMutation
      : appealDisputeMutation;
    try {
      await mutation.mutateAsync({ orderId: parseInt(orderId, 10) });
    } catch (error) {
      triggerErrorHaptic();
      toast.error(
        t(isFinalize ? "DISPUTE_FINALIZE_FAILED" : "DISPUTE_CHALLENGE_FAILED"),
        {
          description: error instanceof Error ? error.message : undefined,
        },
      );
      return;
    }
    triggerSuccessHaptic();
    toast.success(
      isFinalize
        ? t("DISPUTE_FINALIZE_SUCCESS")
        : t("DISPUTE_CHALLENGE_SUCCESS", { tier: nextTierLabel }),
    );
    setPendingAction(null);
  };

  return (
    <Card className="w-full gap-3 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {t("DISPUTE_CARD_TITLE")}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium text-xs",
              isSettled
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning",
            )}>
            {t(isSettled ? "DISPUTE_SETTLED" : "DISPUTE_OPEN")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">
          {summary({
            t,
            view,
            escalation,
            settledAt: stages[stages.length - 1].at,
            settledFault,
          })}
        </p>

        <ol className="space-y-0">
          {stages.map((stage, i) => (
            <StageRow
              key={stage.key}
              stage={stage}
              isLast={i === stages.length - 1}
              t={t}
            />
          ))}
        </ol>

        {action && (
          <div className="space-y-1.5 pt-1">
            <Button
              variant={action === "challenge" ? "destructive" : "default"}
              className="h-11 w-full rounded-lg"
              disabled={isSubmitting}
              onClick={() => {
                triggerWarningHaptic();
                setPendingAction(action);
              }}>
              {t(ACTION_LABEL_KEYS[action])}
            </Button>
            <p className="text-center text-muted-foreground text-xs">
              {t(ACTION_HINT_KEYS[action], { tier: nextTierLabel })}
            </p>
          </div>
        )}

        {pendingAction && (
          <DisputeChallengeDrawer
            open
            onOpenChange={(open) => !open && setPendingAction(null)}
            action={pendingAction}
            nextTierLabel={nextTierLabel}
            orderId={orderId}
            isSubmitting={isSubmitting}
            onConfirm={handleConfirm}
          />
        )}
      </CardContent>
    </Card>
  );
}

function actionForView(
  view: DisputeEscalationView,
): DisputeChallengeAction | null {
  if (view.canFinalize) return "finalize";
  if (view.canAppeal)
    return view.phase === "decision-pending" ? "challenge" : "escalate";
  return null;
}

function summary({
  t,
  view,
  escalation,
  settledAt,
  settledFault,
}: {
  t: Translate;
  view: DisputeEscalationView | null;
  escalation?: {
    tier: number;
    decision: {
      faultType: string;
      decisionTier: number;
      appealableUntil: number;
    } | null;
  };
  settledAt?: number;
  settledFault?: string;
}): string {
  if (!view || !escalation) {
    return t("DISPUTE_SUMMARY_SETTLED", {
      date: fmt(settledAt),
      fault: t(settledFault ?? "DEFAULT"),
    });
  }
  const tier = tierLabel(
    t,
    escalation.decision?.decisionTier ?? escalation.tier,
  );
  const next = view.nextTier ? tierLabel(t, view.nextTier) : "";
  const date = fmt(view.deadline ?? escalation.decision?.appealableUntil);
  const fault = t(escalation.decision?.faultType ?? "DEFAULT");
  switch (view.phase) {
    case "decision-pending":
      return t(
        view.decisionFavoursUser
          ? "DISPUTE_SUMMARY_FOR"
          : "DISPUTE_SUMMARY_AGAINST",
        { tier, fault, date },
      );
    case "finalizable":
      return t("DISPUTE_SUMMARY_FINALIZABLE", { tier, fault, date });
    case "escalatable":
      return t("DISPUTE_SUMMARY_SLA_MISSED", { tier, next });
    case "final-review":
      return t("DISPUTE_SUMMARY_FINAL_REVIEW");
    case "awaiting-decision":
      return t("DISPUTE_SUMMARY_AWAITING", { tier, date });
  }
}

function StageRow({
  stage,
  isLast,
  t,
}: {
  stage: DisputeStage;
  isLast: boolean;
  t: Translate;
}) {
  const isDone = stage.state === "done";
  const isCurrent = stage.state === "current";
  const details: string[] = [];
  if (stage.fault && stage.fault !== "DEFAULT")
    details.push(t("DISPUTE_STAGE_DECIDED", { fault: t(stage.fault) }));
  if (stage.exit === "challenged") details.push(t("DISPUTE_STAGE_CHALLENGED"));
  if (stage.exit === "sla-missed") details.push(t("DISPUTE_STAGE_SLA_MISSED"));
  if (isCurrent && stage.windowUntil)
    details.push(
      t("DISPUTE_STAGE_CHALLENGE_WINDOW", { date: fmt(stage.windowUntil) }),
    );
  if (isCurrent && details.length === 0)
    details.push(t("DISPUTE_STAGE_IN_PROGRESS"));

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            isDone && "border-success bg-success text-success-foreground",
            isCurrent && "border-primary text-primary",
            !isDone && !isCurrent && "border-border text-muted-foreground/50",
          )}>
          {isDone ? (
            <Check className="size-3" />
          ) : isCurrent ? (
            <Dot className="size-5" />
          ) : (
            <Circle className="size-2" />
          )}
        </span>
        {!isLast && (
          <span
            className={cn(
              "my-0.5 w-px flex-1",
              isDone ? "bg-success/50" : "bg-border",
            )}
          />
        )}
      </div>
      <div
        className={cn(
          "flex-1 pb-4",
          !isDone && !isCurrent && "text-muted-foreground/60",
        )}>
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("text-sm", (isDone || isCurrent) && "font-medium")}>
            {t(STAGE_LABEL_KEYS[stage.key])}
          </p>
          {stage.at && (
            <p className="shrink-0 text-muted-foreground text-xs">
              {fmt(stage.at)}
            </p>
          )}
        </div>
        {details.map((d) => (
          <p key={d} className="text-muted-foreground text-xs">
            {d}
          </p>
        ))}
      </div>
    </li>
  );
}
