# Plan: Thirdweb Engine — Solana Wallet Sign Transaction

## Overview

Integrate the Thirdweb Engine **Solana backend wallet sign transaction** API
(`POST /v1/solana/{walletAddress}/sign-transaction`) so the app can sign Solana transactions
server-side using a Thirdweb-managed backend wallet. This removes the hard dependency on the
user having a Phantom wallet for the redeem step of the sol-sepolia bridge.

Reference: `https://api.thirdweb.com/reference#tag/solana`

---

## API Contract

### Endpoint

```
POST https://api.thirdweb.com/v1/solana/{walletAddress}/sign-transaction
```

### Required Headers


| Header          | Value                          |
| --------------- | ------------------------------ |
| `Authorization` | `Bearer <THIRDWEB_SECRET_KEY>` |
| `Content-Type`  | `application/json`             |


> `THIRDWEB_SECRET_KEY` is a server-side secret. It **must never** be embedded in the browser
> bundle (`VITE_`* prefix would expose it). A server-side proxy is required.

### Request Body

```json
{
  "transaction": "<base64-encoded serialized Solana Transaction>"
}
```

The `transaction` field is a `@solana/web3.js` `Transaction` serialized with
`tx.serialize({ requireAllSignatures: false })` then base64-encoded.

### Response (200 OK)

```json
{
  "result": {
    "signedTransaction": "<base64-encoded signed transaction>"
  }
}
```

The returned `signedTransaction` can be sent directly to the Solana RPC:

```ts
const raw = Buffer.from(result.signedTransaction, "base64");
const sig = await connection.sendRawTransaction(raw);
```

---

## Architecture

```
Browser (React/Vite)
  └── builds unsigned Solana tx (existing @solana/web3.js code)
  └── serializes + POSTs to Supabase Edge Function
        └── POST https://api.thirdweb.com/v1/solana/{wallet}/sign-transaction
              (Authorization: Bearer THIRDWEB_SECRET_KEY — server-side only)
              └── returns { result: { signedTransaction } }
  └── sends signed tx bytes to Solana RPC via connection.sendRawTransaction()
```

The Supabase Edge Function is the secret proxy. The client never sees the secret key.
This follows the existing pattern — the app already uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
for the Dynamic Labs proxy (`/functions/v1/dynamic-api`).

---

## Pre-conditions / Setup

1. **Create a Thirdweb Engine Solana backend wallet** in the Thirdweb dashboard and note its
  public address (e.g. `7xKpABCdef...`). Fund it with a small amount of devnet SOL for fees.
2. **Thirdweb secret key** from `https://thirdweb.com/dashboard/settings/api-keys`.
3. **Supabase secrets** (set via `supabase secrets set`):
  ```
   THIRDWEB_SECRET_KEY=<secret>
   THIRDWEB_ENGINE_URL=https://api.thirdweb.com
   THIRDWEB_SOLANA_WALLET_ADDRESS=<backend-wallet-address>
  ```
4. **New client env vars** (add to `.env.example` and `.env`):
  ```
   # Thirdweb Engine — Solana backend wallet public address (not a secret)
   VITE_THIRDWEB_ENGINE_SOLANA_WALLET=<backend-wallet-address>
  ```

---

## Implementation Steps

### Step 1 — Supabase Edge Function

**File:** `supabase/functions/solana-sign-tx/index.ts`

Thin proxy that:

1. Validates the incoming Supabase JWT (blocks unauthenticated callers)
2. Reads `{ transaction, walletAddress? }` from the request body
3. Forwards to Thirdweb Engine with the secret key
4. Returns the signed transaction

```ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ENGINE_URL = Deno.env.get("THIRDWEB_ENGINE_URL") ?? "https://api.thirdweb.com";
const SECRET_KEY = Deno.env.get("THIRDWEB_SECRET_KEY") ?? "";
const DEFAULT_WALLET = Deno.env.get("THIRDWEB_SOLANA_WALLET_ADDRESS") ?? "";

serve(async (req: Request) => {
  // Validate Supabase JWT
  const jwt = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: jwt } } },
  );
  const { error } = await supabase.auth.getUser();
  if (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { transaction, walletAddress } = await req.json();
  const wallet = walletAddress ?? DEFAULT_WALLET;

  const engineRes = await fetch(
    `${ENGINE_URL}/v1/solana/${wallet}/sign-transaction`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction }),
    },
  );

  const data = await engineRes.json();
  return new Response(JSON.stringify(data), {
    status: engineRes.status,
    headers: { "Content-Type": "application/json" },
  });
});
```

### Step 2 — Client Helper

**File:** `src/core/adapters/thirdweb/solana-sign-tx.ts`

Typed wrapper that serializes a `Transaction`, calls the proxy, and returns a `ResultAsync`
with the signed bytes. Follows the existing `neverthrow` + `createAppError` pattern.

```ts
import { ResultAsync } from "neverthrow";
import type { Transaction } from "@solana/web3.js";
import { createAppError, type AppError } from "@/lib/errors";

export type SolanaSignError = AppError<"SolanaSign">;

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solana-sign-tx`;

export function signSolanaTransactionViaEngine(
  tx: Transaction,
): ResultAsync<Buffer, SolanaSignError> {
  const serialized = tx
    .serialize({ requireAllSignatures: false })
    .toString("base64");

  return ResultAsync.fromPromise(
    fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ transaction: serialized }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Engine proxy returned ${r.status}`);
        return r.json();
      })
      .then((data: { result: { signedTransaction: string } }) =>
        Buffer.from(data.result.signedTransaction, "base64"),
      ),
    (cause) =>
      createAppError("Failed to sign Solana transaction via Engine", {
        domain: "SolanaSign",
        code: "EngineSignError",
        cause,
      }),
  );
}
```

### Step 3 — Export from Thirdweb Adapter

**File:** `src/core/adapters/thirdweb/index.ts`

Add:

```ts
export { signSolanaTransactionViaEngine } from "./solana-sign-tx";
```

### Step 4 — Wire into the Bridge Redeem Flow

**File:** `src/components/sol-sepolia-bridge/use-outbound-bridge.ts`

Currently `redeemOnSolana` always asks the user's Phantom wallet to sign. Add a flag-gated
path that uses the Engine signer instead:

```ts
// Top of file — feature flag
const USE_ENGINE_SIGNER =
  !!import.meta.env.VITE_THIRDWEB_ENGINE_SOLANA_WALLET;
```

Inside `redeemOnSolana`, replace the final redeem tx signing block:

```ts
// Before (Phantom)
const signedRedeem = await signTx(redeemTx);
const redeemSig = await solanaConnection.sendRawTransaction(signedRedeem.serialize());

// After — Engine path
if (USE_ENGINE_SIGNER) {
  const result = await signSolanaTransactionViaEngine(redeemTx);
  if (result.isErr()) {
    setError(result.error.message);
    setStep("failed");
    return;
  }
  const redeemSig = await solanaConnection.sendRawTransaction(result.value);
  await confirmSolanaTx(solanaConnection, redeemSig);
  // ... rest of success handling
} else {
  // existing Phantom path
  const signedRedeem = await signTx(redeemTx);
  const redeemSig = await solanaConnection.sendRawTransaction(signedRedeem.serialize());
  await confirmSolanaTx(solanaConnection, redeemSig);
}
```

The `postVaa` step can remain on the user's Phantom wallet for now (the guardian
verification txs require many signatures and a local keypair — moving those to Engine is a
separate task listed in Out of Scope).

### Step 5 — Update `.env.example`

```bash
# =============================================================================
# THIRDWEB ENGINE — Solana backend wallet (optional)
# Public address of the Thirdweb Engine Solana wallet used to co-sign
# bridge redeem transactions. When not set, the user's Phantom wallet is used.
# =============================================================================
VITE_THIRDWEB_ENGINE_SOLANA_WALLET=
```

---

## File Checklist


| File                                                       | Action                                          |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `supabase/functions/solana-sign-tx/index.ts`               | Create — Edge Function proxy                    |
| `src/core/adapters/thirdweb/solana-sign-tx.ts`             | Create — typed client helper                    |
| `src/core/adapters/thirdweb/index.ts`                      | Edit — export new helper                        |
| `src/components/sol-sepolia-bridge/use-outbound-bridge.ts` | Edit — Engine signer path                       |
| `.env.example`                                             | Edit — add `VITE_THIRDWEB_ENGINE_SOLANA_WALLET` |


---

## Out of Scope (this task)

- Engine-signing the `postVaa` guardian verification transactions (requires co-signing with
a generated `signatureSetKp` keypair — complex, defer to a follow-up)
- Thirdweb Engine **send-transaction** endpoint (submit directly from Engine without client
relay — removes need for user's RPC call entirely)
- Token swap via Engine (`/v1/solana/{walletAddress}/swap`)
- Creating/listing Engine backend Solana wallets via API
- Mainnet Solana integration (current bridge is devnet only)

---

## Open Questions

1. **Co-sign vs sole-sign** — Should the Engine wallet be the fee payer (sole signer), or
  should the user's wallet remain the fee payer and Engine only co-signs? Sole-sign means
   the Engine wallet needs SOL; co-sign means the user still needs a small SOL balance.
2. **Auth for the Edge Function** — The current proxy pattern uses Supabase auth JWT. If the
  bridge is used by unauthenticated users, a different rate-limiting strategy is needed.
3. `**postVaa` step** — Can we defer Phantom requirement until after VAA is posted, or does
  Engine need to sign all steps?

