import { useSettings } from "@/contexts";
import {
  useKycVerificationStatus,
  useSocialVerificationStatus,
} from "@/hooks/use-tx-limits";
import { LOW_TRUST_GATED_COUNTRIES } from "@/lib/constants";

/**
 * Whether the low-trust verification methods should be hidden for this user.
 *
 * The fraud engine tiers zk-proof providers: everything in its
 * `BLOCK_NEW_ACCOUNTS_LOW_TRUST_SOCIALS` list (instagram, facebook, aadhaar, x,
 * binance, bvn, liveness) is low-trust and never bypasses the new-accounts gate
 * on its own, while a single non-low-trust proof -- Identity/KYC passport,
 * LinkedIn, GitHub -- is enough on its own (Rule A).
 *
 * India is the only market where that ordering is enforced in the UI, because
 * it is where the low-trust proofs are farmed hardest: the cards stay hidden
 * until the user holds at least one high-trust proof. Everywhere else all
 * methods are offered up front, unchanged.
 */
export function useLowTrustGate() {
  const { settings } = useSettings();
  const { isLinkedInVerified, isGitHubVerified } =
    useSocialVerificationStatus();
  const { isKycVerified } = useKycVerificationStatus();

  const isGatedMarket = LOW_TRUST_GATED_COUNTRIES.includes(
    settings.currency.country,
  );

  // Any one high-trust proof opens the gate, matching the fraud engine's
  // Rule A. Liveness does not count -- it is low-trust there, and it is not
  // offered in India at all (LIVENESS_EXCLUDED_COUNTRIES).
  const hasHighTrustVerification =
    !!isKycVerified || !!isLinkedInVerified || !!isGitHubVerified;

  return {
    isGatedMarket,
    hasHighTrustVerification,
    // The status reads are undefined while in flight and false on error, so the
    // gate starts closed and opens once the on-chain reads resolve. That is the
    // safe direction: a card that appears a moment late beats one that shows to
    // a user who has not earned it yet.
    isLowTrustHidden: isGatedMarket && !hasHighTrustVerification,
  };
}
