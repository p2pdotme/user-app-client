/**
 * Token recovery: get back funds sent to the user's P2P.me smart account
 * address on a network other than Base.
 *
 * The smart account address is the same on every EVM network, so a deposit on
 * the wrong chain lands at an address the user controls but the app never
 * looks at. This module derives that account on the chosen network and moves
 * the tokens out through ERC-4337 UserOperations signed by the user's wallet.
 *
 * Self-contained module: the engine (core/), its hooks and screens (pages/,
 * components/) live under src/recovery. The rest of the app only mounts the
 * screen below and links to it.
 */
import { RecoveryPage } from "@/recovery/pages/recovery";

export function Recovery() {
  return <RecoveryPage />;
}
