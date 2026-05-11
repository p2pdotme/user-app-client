/**
 * DEV ONLY — Wormhole bridge test components.
 * Skips Rango and Jupiter. Directly calls the bridge hooks with a manual amount.
 */
import { useState } from "react";
import { Check, CheckCircle, Copy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWormholeBridge, useBaseToSolanaBridge } from "@/hooks/use-wormhole-bridge";
import { useThirdweb } from "@/hooks/use-thirdweb";
import { useSafeDynamicContext } from "@/contexts";
import { cn } from "@/lib/utils";
import { WormholeSteps } from "./swap-progress";
import type { WormholeBridgeState } from "@/hooks/use-wormhole-bridge";

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
    </button>
  );
}

// ── Tx hash row ───────────────────────────────────────────────────────────────

function TxRow({ label, href, hash }: { label: string; href: string; hash: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
        >
          {hash.slice(0, 20)}…
        </a>
        <CopyButton text={hash} />
      </div>
    </div>
  );
}

// ── Shared progress UI ────────────────────────────────────────────────────────

function BridgeProgress({
  state,
  direction,
}: {
  state: WormholeBridgeState;
  direction: "solana-to-base" | "base-to-solana";
}) {
  const isDone = state.step === "completed" || state.step === "failed";

  return (
    <>
      {state.step !== "idle" && (
        <div className="flex flex-col gap-2">
          <WormholeSteps state={state} indexOffset={0} direction={direction} />
        </div>
      )}

      {/* Tx hashes with copy buttons */}
      {(state.solanaTxIds.length > 0 || state.evmTxHash) && (
        <div className="flex flex-col gap-1.5">
          {state.solanaTxIds.map((sig) => (
            <TxRow
              key={sig}
              label="Solana"
              href={`https://solscan.io/tx/${sig}`}
              hash={sig}
            />
          ))}
          {state.evmTxHash && (
            <TxRow
              label="Base"
              href={`https://basescan.org/tx/${state.evmTxHash}`}
              hash={state.evmTxHash}
            />
          )}
        </div>
      )}

      {isDone && (
        <div className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
          state.step === "completed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
        )}>
          {state.step === "completed"
            ? <><CheckCircle className="size-3 shrink-0" /> Bridge complete</>
            : <><XCircle className="size-3 shrink-0" /> {state.error ?? "Bridge failed"}</>
          }
        </div>
      )}
    </>
  );
}

// ── Solana → Base ─────────────────────────────────────────────────────────────

export function DevSolanaToBaseTest() {
  const [amount, setAmount] = useState("");
  const [resumeInput, setResumeInput] = useState("");
  const { account } = useThirdweb();
  const { primaryWallet } = useSafeDynamicContext();
  const { state, bridge, resume, reset } = useWormholeBridge();

  const isPending = !["idle", "completed", "failed"].includes(state.step);
  const isDone = state.step === "completed" || state.step === "failed";

  return (
    <Card className="border-dashed border-warning/50 bg-warning/5">
      <CardContent className="flex flex-col gap-3 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
          Dev — Solana → Base
        </p>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Solana (sender)</span>
            <span className={cn("font-mono text-xs", primaryWallet?.address ? "text-foreground" : "text-destructive")}>
              {primaryWallet?.address ? `${primaryWallet.address.slice(0, 6)}…${primaryWallet.address.slice(-4)}` : "not connected"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Base (recipient)</span>
            <span className={cn("font-mono text-xs", account?.address ? "text-foreground" : "text-destructive")}>
              {account?.address ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}` : "not connected"}
            </span>
          </div>
        </div>

        {/* New bridge */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="P2P amount (e.g. 1.5)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
            className="h-9 text-sm"
          />
          <Button
            size="sm"
            onClick={() => { if (amount && account?.address) bridge({ amount, recipientEvmAddress: account.address }); }}
            disabled={isPending || !amount || !account?.address || !primaryWallet?.address}
            className="shrink-0"
          >
            Bridge
          </Button>
        </div>

        {/* Resume from existing Solana tx */}
        <div className="flex gap-2">
          <Input
            placeholder="Paste Solana tx signature or Solscan URL to resume"
            value={resumeInput}
            onChange={(e) => setResumeInput(e.target.value)}
            disabled={isPending}
            className="h-9 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => { if (resumeInput.trim()) resume(resumeInput.trim()); }}
            disabled={isPending || !resumeInput.trim() || !account?.address}
            className="shrink-0"
          >
            Resume
          </Button>
        </div>

        <BridgeProgress state={state} direction="solana-to-base" />

        {isDone && (
          <Button variant="ghost" size="sm" onClick={reset} className="self-start text-xs">
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Base → Solana ─────────────────────────────────────────────────────────────

export function DevBaseToSolanaTest() {
  const [amount, setAmount] = useState("");
  const [resumeInput, setResumeInput] = useState("");
  const { account } = useThirdweb();
  const { primaryWallet } = useSafeDynamicContext();
  const { state, bridge, resume, reset } = useBaseToSolanaBridge();

  const isPending = !["idle", "completed", "failed"].includes(state.step);
  const isDone = state.step === "completed" || state.step === "failed";

  return (
    <Card className="border-dashed border-warning/50 bg-warning/5">
      <CardContent className="flex flex-col gap-3 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
          Dev — Base → Solana
        </p>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Base (sender)</span>
            <span className={cn("font-mono text-xs", account?.address ? "text-foreground" : "text-destructive")}>
              {account?.address ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}` : "not connected"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Solana (recipient)</span>
            <span className={cn("font-mono text-xs", primaryWallet?.address ? "text-foreground" : "text-destructive")}>
              {primaryWallet?.address ? `${primaryWallet.address.slice(0, 6)}…${primaryWallet.address.slice(-4)}` : "not connected"}
            </span>
          </div>
        </div>

        {/* New bridge */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="P2P amount (e.g. 1.5)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
            className="h-9 text-sm"
          />
          <Button
            size="sm"
            onClick={() => { if (amount && primaryWallet?.address) bridge({ amount, recipientSolanaAddress: primaryWallet.address }); }}
            disabled={isPending || !amount || !account?.address || !primaryWallet?.address}
            className="shrink-0"
          >
            Bridge
          </Button>
        </div>

        {/* Resume from existing Base tx */}
        <div className="flex gap-2">
          <Input
            placeholder="Paste Base tx hash or Wormholescan URL to resume"
            value={resumeInput}
            onChange={(e) => setResumeInput(e.target.value)}
            disabled={isPending}
            className="h-9 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => { if (resumeInput.trim()) resume(resumeInput.trim()); }}
            disabled={isPending || !resumeInput.trim() || !primaryWallet?.address}
            className="shrink-0"
          >
            Resume
          </Button>
        </div>

        <BridgeProgress state={state} direction="base-to-solana" />

        {isDone && (
          <Button variant="ghost" size="sm" onClick={reset} className="self-start text-xs">
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
