/**
 * Solana Sign Transaction Demo
 *
 * Shows the full lifecycle of signing a Solana transaction step by step:
 *   1. Connect wallet via Dynamic Labs (Phantom)
 *   2. Fetch latest blockhash from devnet RPC
 *   3. Build a dummy SPL Memo transaction (no SOL transferred)
 *   4. Request signature from the connected wallet
 *   5. Display the raw Ed25519 signature
 *
 * This is intentionally verbose so you can see exactly what happens at each step.
 */

import { SolanaWalletConnector } from "@dynamic-labs/solana";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { NonHomeHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSafeDynamicContext } from "@/contexts";

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * SPL Memo program — lets you attach an arbitrary UTF-8 string to a Solana
 * transaction. Perfect for demos: no lamport transfer, no special setup.
 * https://spl.solana.com/memo
 */
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
const MEMO_TEXT = "Hello from P2P.me — Solana sign-tx demo!";

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "idle" | "blockhash" | "signing" | "done" | "error";

interface LogEntry {
  ts: number;
  msg: string;
  kind: "info" | "ok" | "err";
}

// ── Demo component ─────────────────────────────────────────────────────────────

export function SolanaSignTxDemo() {
  const { primaryWallet } = useSafeDynamicContext();

  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [unsignedB64, setUnsignedB64] = useState<string | null>(null);
  const [signatureHex, setSignatureHex] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Solana wallet detection ──────────────────────────────────────────────────
  // Dynamic Labs exposes primaryWallet for whichever wallet the user last connected.
  // Solana addresses are base58 (32–44 chars, no 0/O/I/l).
  // EVM addresses always start with "0x".
  const isSolanaWallet =
    !!primaryWallet?.address &&
    !primaryWallet.address.startsWith("0x") &&
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(primaryWallet.address);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const log = useCallback(
    (msg: string, kind: LogEntry["kind"] = "info") =>
      setLogs((prev) => [...prev, { ts: Date.now(), msg, kind }]),
    [],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setLogs([]);
    setUnsignedB64(null);
    setSignatureHex(null);
    setErrorMsg(null);
  }, []);

  // ── Main flow ─────────────────────────────────────────────────────────────────

  const signDummyTransaction = useCallback(async () => {
    if (!primaryWallet?.address) return;
    reset();

    try {
      // ── STEP 1: Get the Solana signer from Dynamic Labs ───────────────────
      //
      // Dynamic Labs wraps your Phantom wallet inside a `SolanaWalletConnector`.
      // Calling getSigner() returns an object with signTransaction() / signAllTransactions().
      //
      log(`Wallet address: ${primaryWallet.address}`);
      const connector =
        primaryWallet.connector as unknown as SolanaWalletConnector;
      const signer = await connector.getSigner();
      if (!signer) throw new Error("No signer — make sure Phantom is connected");
      log("Got signer from Dynamic Labs SolanaWalletConnector");

      // ── STEP 2: Fetch a recent blockhash ──────────────────────────────────
      //
      // Every Solana transaction must include a recent blockhash.
      // It acts as a nonce AND expiry — the transaction is only valid
      // for ~150 blocks (~90 seconds). After that it's rejected.
      //
      setPhase("blockhash");
      log("Connecting to Solana devnet RPC…");
      const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      log(
        `Blockhash: ${blockhash.slice(0, 16)}…  (expires at block ${lastValidBlockHeight})`,
      );

      // ── STEP 3: Build the transaction ─────────────────────────────────────
      //
      // We use the SPL Memo program — it simply stores a string on-chain.
      // No lamport transfer involved, so the wallet doesn't need a SOL balance
      // to sign (only to submit). Perfect for a sign-only demo.
      //
      // A Solana Transaction = [feePayer, recentBlockhash, ...instructions]
      //
      const feePayer = new PublicKey(primaryWallet.address);

      const memoInstruction = new TransactionInstruction({
        // The signer (fee payer) must appear in the instruction's keys
        keys: [{ pubkey: feePayer, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        // Instruction data = UTF-8 encoded memo text
        data: Buffer.from(MEMO_TEXT, "utf-8"),
      });

      const tx = new Transaction();
      tx.add(memoInstruction);
      tx.feePayer = feePayer;
      tx.recentBlockhash = blockhash;

      // Serialize the unsigned transaction so we can show what bytes get signed.
      // requireAllSignatures:false  → allows serializing before signing
      // verifySignatures:false      → skip signature validation check
      const rawUnsigned = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const b64 = rawUnsigned.toString("base64");
      setUnsignedB64(b64);
      log(`Transaction built — ${rawUnsigned.length} bytes raw, ${b64.length} chars base64`);
      log(`Instruction: SPL Memo · data: "${MEMO_TEXT}"`);

      // ── STEP 4: Request the wallet signature ──────────────────────────────
      //
      // signer.signTransaction(tx):
      //   - Serializes the transaction
      //   - Sends bytes to Phantom extension / mobile app
      //   - User sees a preview and approves (or rejects)
      //   - Phantom signs with the Ed25519 private key
      //   - Returns the transaction with signature attached
      //
      setPhase("signing");
      log("Requesting signature from Phantom (approval popup will appear)…");
      const signedTx = await signer.signTransaction(tx);

      // Extract the raw Ed25519 signature bytes (64 bytes)
      const sigBytes = signedTx.signatures[0]?.signature;
      if (!sigBytes) throw new Error("No signature in signed transaction");

      const hex = Buffer.from(sigBytes).toString("hex");
      setSignatureHex(hex);
      log(`Signed successfully!`, "ok");
      log(`Ed25519 signature (hex): ${hex.slice(0, 24)}…`);
      log(
        "To execute on-chain: connection.sendRawTransaction(signedTx.serialize())",
        "ok",
      );

      setPhase("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // User rejected the signature request — not an error, just cancelled
      if (
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("cancelled") ||
        msg.toLowerCase().includes("denied")
      ) {
        log("User rejected the signature request", "err");
      } else {
        log(`Error: ${msg}`, "err");
      }
      setErrorMsg(msg);
      setPhase("error");
    }
  }, [primaryWallet, log, reset]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const isRunning = phase === "blockhash" || phase === "signing";

  return (
    <>
      <NonHomeHeader title="Solana Sign Tx Demo" showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto py-6">

        {/* 1 · Wallet status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1 · Wallet</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-3">
            {isSolanaWallet ? (
              <>
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
                <div className="min-w-0">
                  <p className="break-all font-mono text-xs">
                    {primaryWallet?.address}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Solana wallet connected via Dynamic Labs
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-muted-foreground text-sm">
                  {primaryWallet
                    ? "Connected wallet is EVM (not Solana). Connect Phantom to continue."
                    : "No wallet connected. Use the wallet button to connect Phantom."}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2 · What will be signed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              2 · Transaction (what gets signed)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            <InfoRow label="Network" value="Solana devnet" />
            <InfoRow
              label="Program"
              value="SPL Memo (MemoSq4gqABAXKb96…)"
              mono
            />
            <InfoRow label="Memo data" value={`"${MEMO_TEXT}"`} />
            <InfoRow
              label="Fee payer"
              value={primaryWallet?.address ?? "—"}
              mono
            />
            <InfoRow label="Blockhash" value="fetched at runtime (~90s TTL)" />
            {unsignedB64 && (
              <InfoRow
                label="Unsigned tx (base64)"
                value={`${unsignedB64.slice(0, 44)}…`}
                mono
              />
            )}
          </CardContent>
        </Card>

        {/* Sign button */}
        <Button
          className="w-full"
          disabled={!isSolanaWallet || isRunning}
          onClick={signDummyTransaction}>
          {phase === "blockhash" && (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Fetching blockhash…
            </span>
          )}
          {phase === "signing" && (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Waiting for Phantom…
            </span>
          )}
          {!isRunning && "Sign dummy transaction"}
        </Button>

        {/* 3 · Signature result */}
        {phase === "done" && signatureHex && (
          <Card className="border-green-500/40 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="size-4" />3 · Signature (Ed25519, 64
                bytes)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="break-all font-mono text-xs">{signatureHex}</p>
              <p className="text-muted-foreground text-xs">
                This is your wallet's Ed25519 signature over the serialized
                transaction bytes. Broadcasting it to the Solana RPC would
                execute the memo instruction on-chain.
              </p>
            </CardContent>
          </Card>
        )}

        {phase === "error" && errorMsg && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="size-4" /> Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive text-xs">{errorMsg}</p>
            </CardContent>
          </Card>
        )}

        {/* Log timeline */}
        {logs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Log</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {logs.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {new Date(entry.ts).toISOString().slice(11, 23)}
                  </span>
                  {entry.kind === "ok" && (
                    <CheckCircle className="mt-0.5 size-3 shrink-0 text-green-500" />
                  )}
                  {entry.kind === "err" && (
                    <XCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
                  )}
                  {entry.kind === "info" && (
                    <Circle className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={
                      entry.kind === "ok"
                        ? "text-green-600"
                        : entry.kind === "err"
                          ? "text-destructive"
                          : "text-foreground"
                    }>
                    {entry.msg}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card className="border-none bg-muted/40 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">How it works</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p>
              <strong>Dynamic Labs</strong> wraps Phantom inside a{" "}
              <code>SolanaWalletConnector</code>. Calling{" "}
              <code>connector.getSigner()</code> gives you a signer object with{" "}
              <code>signTransaction()</code>.
            </p>
            <p>
              <strong>getLatestBlockhash()</strong> fetches a fresh blockhash
              from the devnet RPC. Solana uses it as a transaction nonce — the
              tx is invalid after ~90 seconds.
            </p>
            <p>
              <strong>SPL Memo instruction</strong> writes arbitrary text to the
              chain. No SOL balance needed to sign, only to submit — perfect for
              a signing demo.
            </p>
            <p>
              <strong>signTransaction(tx)</strong> sends the serialized bytes to
              Phantom. The wallet shows a preview, the user approves, and Phantom
              returns the transaction with an Ed25519 signature attached.
            </p>
            <p>
              To submit:{" "}
              <code>connection.sendRawTransaction(signedTx.serialize())</code>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`break-all text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
