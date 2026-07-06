import { useState } from "react";
import {
  getChainIconUrl,
  getChainName,
  useOneClickTokens,
} from "@/hooks/use-oneclick";

/** One supported-chain badge sourced from the 1Click registry. */
function SupportedNetworkIcon({ chain }: { chain: string }) {
  const [failed, setFailed] = useState(false);
  const url = getChainIconUrl(chain);
  if (!url || failed) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-muted font-semibold text-[9px] uppercase">
        {chain.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={getChainName(chain)}
      title={getChainName(chain)}
      className="size-6 rounded-full bg-muted object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/** Infinite marquee of every chain supported by the 1Click registry. */
export function SupportedNetworksMarquee() {
  const { chains } = useOneClickTokens();
  return (
    <div className="relative w-full max-w-[400px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee items-center gap-1">
        {[...chains, ...chains].map((chain, index) => (
          <SupportedNetworkIcon key={`${chain}-${index}`} chain={chain} />
        ))}
      </div>
    </div>
  );
}
