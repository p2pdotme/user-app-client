import { isAddress } from "viem";

/**
 * Best-effort, offline format check for a destination / refund address on a
 * 1Click blockchain slug. It only catches obviously wrong input (wrong chain
 * family, typos in length/charset, stray whitespace); 1Click still validates
 * the address server-side when quoting.
 */

const EVM_CHAINS = new Set([
  "abs",
  "arb",
  "avax",
  "base",
  "bera",
  "bsc",
  "eth",
  "gnosis",
  "hypercore",
  "monad",
  "op",
  "plasma",
  "pol",
  "scroll",
  "xlayer",
]);

const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
const SVM_RE = new RegExp(`^${BASE58}{32,44}$`);

const CHAIN_PATTERNS: Record<string, RegExp[]> = {
  sol: [SVM_RE],
  fogo: [SVM_RE],
  btc: [
    /^(bc1|tb1)[02-9ac-hj-np-z]{8,87}$/i,
    new RegExp(`^[13]${BASE58}{25,34}$`),
  ],
  ltc: [/^ltc1[02-9ac-hj-np-z]{8,87}$/i, new RegExp(`^[LM3]${BASE58}{26,33}$`)],
  doge: [new RegExp(`^[DA9]${BASE58}{25,34}$`)],
  bch: [
    /^(bitcoincash:)?[qp][02-9ac-hj-np-z]{41}$/i,
    new RegExp(`^[13]${BASE58}{25,34}$`),
  ],
  tron: [new RegExp(`^T${BASE58}{33}$`)],
  xrp: [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  near: [
    /^[0-9a-f]{64}$/,
    /^(?=.{2,64}$)([a-z\d]+[-_])*[a-z\d]+(\.([a-z\d]+[-_])*[a-z\d]+)*$/,
    /^0x[0-9a-fA-F]{40}$/,
  ],
  sui: [/^0x[0-9a-fA-F]{64}$/],
  aptos: [/^0x[0-9a-fA-F]{1,64}$/],
  movement: [/^0x[0-9a-fA-F]{1,64}$/],
  ton: [/^[EUk0][Qf][A-Za-z0-9_-]{46}$/, /^-?\d:[0-9a-fA-F]{64}$/],
  stellar: [/^G[A-Z2-7]{55}$/],
  cardano: [/^addr1[02-9ac-hj-np-z]{50,120}$/],
  zec: [new RegExp(`^t[13]${BASE58}{33}$`), /^u1[02-9ac-hj-np-z]{50,}$/],
  aleo: [/^aleo1[02-9ac-hj-np-z]{58}$/],
};

export function isValidChainAddress(chain: string, value: string): boolean {
  const address = value.trim();
  if (!address || /\s/.test(address)) return false;
  if (EVM_CHAINS.has(chain)) return isAddress(address, { strict: false });
  const patterns = CHAIN_PATTERNS[chain];
  if (patterns) return patterns.some((re) => re.test(address));
  // Unknown chain: only a basic sanity check.
  return address.length >= 10;
}
