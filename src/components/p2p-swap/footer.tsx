import { isSolanaWallet } from "@dynamic-labs/solana";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { useSafeDynamicContext } from "@/contexts";
import { useThirdweb } from "@/hooks/use-thirdweb";

export function P2PSwapFooter() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();

  const solanaAddress =
    primaryWallet && isSolanaWallet(primaryWallet)
      ? primaryWallet.address
      : null;
  const evmAddress = account?.address ?? null;

  if (!solanaAddress && !evmAddress) return null;

  return (
    <footer className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4">
      <p className="text-muted-foreground text-xs">Track your transactions</p>
      <div className="flex items-center gap-4">
        {solanaAddress && (
          <Link
            to={`https://wormholescan.io/#/txs?address=${solanaAddress}&network=Mainnet`}
            target="_blank"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            Wormhole
            <ExternalLink className="size-3 shrink-0" />
          </Link>
        )}
        {solanaAddress && evmAddress && (
          <span className="text-border text-xs">·</span>
        )}
        {evmAddress && (
          <Link
            to={`https://explorer.rango.exchange/search?query=${evmAddress}`}
            target="_blank"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            Rango
            <ExternalLink className="size-3 shrink-0" />
          </Link>
        )}
      </div>
    </footer>
  );
}
