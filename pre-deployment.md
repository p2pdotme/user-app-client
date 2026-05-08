# Pre-Deployment Checklist

## Required Environment Variables for Production

### Jupiter Swap (P2P Token Swap on Solana)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VITE_JUPITER_API_KEY` | Jupiter v2 API key — required for all swap calls | https://developers.jup.ag/portal |
| `VITE_SOLANA_RPC_URL` | Solana mainnet RPC endpoint — falls back to public node if not set (not suitable for prod) | https://helius.dev (recommended) |

**Why these matter in prod:**
- Without `VITE_JUPITER_API_KEY` all swap requests will be rejected (401).
- Without `VITE_SOLANA_RPC_URL` the app falls back to `api.mainnet-beta.solana.com` which is rate-limited and unreliable under load. Use a dedicated RPC (Helius, QuickNode, or Alchemy).
