import { TokenIcon } from "@/components/token-icon";
import { getChainIconUrl } from "@/hooks/use-oneclick";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "@/recovery/core";

/**
 * Recovery networks that the app's chain-icon registry knows under another
 * slug. Networks without an entry fall back to coloured initials.
 */
const CHAIN_ICON_SLUGS: Partial<Record<RecoveryNetworkKey, string>> = {
  arbitrum: "arb",
  avax: "avax",
  bnb: "bsc",
  ethereum: "eth",
  hyperliquid: "hypercore",
  monad: "monad",
  optimism: "op",
  polygon: "pol",
  xlayer: "xlayer",
};

interface NetworkIconProps {
  network: RecoveryNetworkKey;
  className?: string;
}

export function NetworkIcon({
  network,
  className = "size-8",
}: NetworkIconProps) {
  const slug = CHAIN_ICON_SLUGS[network];
  return (
    <TokenIcon
      symbol={RECOVERY_NETWORKS[network].label}
      iconUrl={slug ? getChainIconUrl(slug) : undefined}
      className={className}
    />
  );
}
