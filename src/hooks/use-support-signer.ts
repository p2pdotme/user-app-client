import type { SupportSigner } from "@p2pdotme/widgets/support";
import { fromThirdwebAccount } from "@p2pdotme/widgets/support";
import { useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { chain } from "@/core/adapters/thirdweb/chain";

// Wraps the active Thirdweb account into the duck-typed `SupportSigner` the
// @p2pdotme/widgets Support surfaces expect.
//
// The chain id is bound into the sign-in message the bridge verifies
// (`purpose:address:chainId:timestamp`), so it must be the chain this app is
// actually configured for — `chain` is derived from VITE_CHAIN, the same value
// every other on-chain call uses.
//
// Returns undefined when no wallet is connected so callers can gate the support
// chat and fall back to Telegram.
export function useSupportSigner(): SupportSigner | undefined {
  const account = useActiveAccount();

  return useMemo(() => {
    if (!account) return undefined;
    return fromThirdwebAccount({
      address: account.address,
      getChain: () => ({ id: chain.id }),
      signMessage: (args) => account.signMessage(args),
    });
  }, [account]);
}
