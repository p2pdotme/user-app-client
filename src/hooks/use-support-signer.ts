import type { SupportSigner } from "@p2pdotme/widgets/support";
import { fromThirdwebAccount } from "@p2pdotme/widgets/support";
import { useMemo } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { chain } from "@/core/adapters/thirdweb/chain";

// Wraps the active Thirdweb account into the duck-typed `SupportSigner` the
// @p2pdotme/widgets Support surfaces expect.
//
// The chain id is bound into the sign-in message the bridge verifies
// (`purpose:address:chainId:timestamp`) and is the chain it runs ERC-1271 /
// ERC-6492 verification on. That matters here: this app uses account
// abstraction (`sponsorGas`), so user wallets are smart contract wallets and
// their signatures are verified on-chain rather than recovered like an EOA's.
// Claim the wrong chain and verification looks at the wrong contract.
//
// So read the LIVE connected chain rather than a cached value, per the adapter
// contract. `chain` (from VITE_CHAIN) is only the fallback for the window
// before the wallet reports its chain — today the app is effectively
// single-chain (nothing calls switchChain), so the two agree, but this stays
// correct if that ever changes.
//
// Returns undefined when no wallet is connected so callers can gate the support
// chat and fall back to Telegram.
export function useSupportSigner(): SupportSigner | undefined {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();

  return useMemo(() => {
    if (!account) return undefined;
    return fromThirdwebAccount({
      address: account.address,
      getChain: () => ({ id: activeChain?.id ?? chain.id }),
      signMessage: (args) => account.signMessage(args),
    });
  }, [account, activeChain]);
}
