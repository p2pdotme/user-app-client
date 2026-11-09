import { useTranslation } from "react-i18next";
import type { DisputeStatus } from "@/core/adapters/thirdweb/validation";
import { useSubgraphOrder } from "@/hooks/use-subgraph-order";

interface DisputeStatusValueProps {
  orderId: string;
  disputeStatus: DisputeStatus;
}

const DISPUTE_FAULT_LABEL_KEYS: Record<"USER" | "MERCHANT" | "BANK", string> = {
  USER: "DISPUTE_FAULT_USER",
  MERCHANT: "DISPUTE_FAULT_MERCHANT",
  BANK: "DISPUTE_FAULT_BANK",
};

/**
 * Value cell for the receipt's "Dispute Status" row. A settled dispute also
 * states the recorded fault. The fault type lives in the subgraph, since the
 * chain clears it on settle.
 */
export function DisputeStatusValue({
  orderId,
  disputeStatus,
}: DisputeStatusValueProps) {
  const { t } = useTranslation();
  const isSettled = disputeStatus === "SETTLED";
  const { data: subgraphOrder } = useSubgraphOrder(orderId, isSettled);

  if (!isSettled) {
    return (
      <span className="text-destructive text-sm">{t("DISPUTE_RAISED")}</span>
    );
  }

  const fault = subgraphOrder?.disputeFaultType;
  const faultKey =
    fault && fault !== "DEFAULT" ? DISPUTE_FAULT_LABEL_KEYS[fault] : null;

  return (
    <span className="text-right text-sm">
      <span className="text-success">{t("DISPUTE_SETTLED")}</span>
      {faultKey && (
        <span className="block text-muted-foreground text-xs">
          {t(faultKey)}
        </span>
      )}
    </span>
  );
}
