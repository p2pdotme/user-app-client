import { ExternalLink, Send, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTip } from "@/tax/components";
import { useTaxSettings } from "@/tax/contexts";
import type { DeliveredElsewhere } from "@/tax/core/tax/compute";
import type { LawVersion } from "@/tax/core/types";
import { formatInr, formatUsdc } from "@/tax/lib/format";

const BASESCAN_ADDRESS = "https://basescan.org/address/";

export const shortAddress = (a: string): string =>
  `${a.slice(0, 6)}…${a.slice(-4)}`;

interface DeliveredElsewhereStepProps {
  items: DeliveredElsewhere[];
  law: LawVersion;
  /** Add the address as one of the user's wallets and recompute */
  onAddWallet: (address: string) => void;
}

/**
 * Required step: P2P.me purchases whose USDC went to an address that is not
 * one of the wallets in this report. Those lots cannot cost sales from these
 * wallets until we know whose wallet it is.
 */
export function DeliveredElsewhereStep({
  items,
  law,
  onAddWallet,
}: DeliveredElsewhereStepProps) {
  const { markNotMine } = useTaxSettings();
  const pending = items.filter((i) => i.status === "PENDING");

  return (
    <Card className="w-full gap-5 border-primary/30 bg-primary/5 shadow-none">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/15">
          <Send className="size-5 text-primary" />
        </div>
        <CardTitle className="flex items-center gap-1 text-lg">
          Some of your purchases went to another wallet
          <InfoTip rule="DELIVERED_ELSEWHERE" law={law} />
        </CardTitle>
        <CardDescription className="text-foreground text-sm leading-relaxed">
          You bought USDC on P2P.me but asked for it to be sent to a different
          address. That USDC never reached the wallet in this report, so it
          cannot be used as the cost of your sales from here. Tell us whose
          wallet it is.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pending.map((item) => (
          <div
            key={item.address}
            data-testid="delivered-elsewhere"
            className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <a
                href={`${BASESCAN_ADDRESS}${item.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium font-mono text-primary text-sm hover:underline">
                {shortAddress(item.address)}
                <ExternalLink className="size-3.5" />
              </a>
              <span className="text-muted-foreground text-sm">
                {item.orders.length} purchase(s), {formatUsdc(item.qty)} USDC,{" "}
                {formatInr(item.inr)}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => onAddWallet(item.address)}>
                <UserCheck />
                It's my wallet: add it
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => markNotMine(item.address)}>
                <UserX />
                It belongs to someone else
              </Button>
            </div>
          </div>
        ))}
        <p className="text-muted-foreground text-xs leading-relaxed">
          If it's yours, we add that wallet and work out your tax across all
          your wallets together. If it belongs to someone else, those purchases
          are not counted as your cost, and passing the USDC on to them may
          itself be taxable.
        </p>
      </CardContent>
    </Card>
  );
}
