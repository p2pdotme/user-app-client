import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { SOLANA_DEVNET_RPC, WORMHOLE } from "./constants";

const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
const SPL_P2P_MINT = new PublicKey(WORMHOLE.SPL_P2P_MINT);

export function useSplP2pBalance(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["spl-p2p-balance", walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error("No wallet address");
      const userPubkey = new PublicKey(walletAddress);
      const ata = getAssociatedTokenAddressSync(SPL_P2P_MINT, userPubkey);
      try {
        const tokenAccount = await getAccount(connection, ata);
        const raw = tokenAccount.amount; // bigint
        const ui = (Number(raw) / 10 ** WORMHOLE.SPL_DECIMALS).toFixed(6);
        return { exists: true, raw, ui, ata: ata.toString() };
      } catch {
        // TokenAccountNotFoundError — user never held SPL P2P
        return { exists: false, raw: 0n, ui: "0.000000", ata: ata.toString() };
      }
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
