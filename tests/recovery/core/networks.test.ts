import { isAddress } from "viem";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_FACTORY_ADDRESS,
  DEFAULT_RECOVERY_NETWORK,
  ENTRY_POINT_ADDRESS,
  getExplorerTxUrl,
  isRecoveryNetworkKey,
  NATIVE_TOKEN_ADDRESS,
  RECOVERY_NETWORK_LIST,
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
} from "@/recovery/core/networks";

const KEYS = Object.keys(RECOVERY_NETWORKS) as RecoveryNetworkKey[];

// Pinned from the original standalone app (p2p-recovery src/lib/network.ts).
const EXPECTED: Record<
  RecoveryNetworkKey,
  { id: number; usdc: string; decimals: number; native: string }
> = {
  monad: {
    id: 143,
    usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    decimals: 6,
    native: "MON",
  },
  bnb: {
    id: 56,
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    native: "BNB",
  },
  avax: {
    id: 43114,
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    native: "AVAX",
  },
  polygon: {
    id: 137,
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    native: "MATIC",
  },
  optimism: {
    id: 10,
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    native: "ETH",
  },
  hyperliquid: {
    id: 999,
    usdc: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
    decimals: 6,
    native: "HYPE",
  },
  ethereum: {
    id: 1,
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    native: "ETH",
  },
  arbitrum: {
    id: 42161,
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    native: "ETH",
  },
  mantle: {
    id: 5000,
    usdc: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    decimals: 6,
    native: "MNT",
  },
  celo: {
    id: 42220,
    usdc: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
    native: "CELO",
  },
  zksync: {
    id: 324,
    usdc: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4",
    decimals: 6,
    native: "ETH",
  },
  robinhood: {
    id: 4663,
    usdc: "0x80e0e24718dbFcad49ECAA6F1e6C89A190586cA8",
    decimals: 6,
    native: "ETH",
  },
  xlayer: {
    id: 196,
    usdc: "0x74b7F16337b8972027F6196A17a631aC6dE26d22",
    decimals: 6,
    native: "OKB",
  },
};

describe("network table", () => {
  it("has the 13 expected networks", () => {
    expect(KEYS.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("uses unique chain ids and labels, and keys match their records", () => {
    const ids = KEYS.map((k) => RECOVERY_NETWORKS[k].chain.id);
    const labels = KEYS.map((k) => RECOVERY_NETWORKS[k].label);
    expect(new Set(ids).size).toBe(KEYS.length);
    expect(new Set(labels).size).toBe(KEYS.length);
    for (const key of KEYS) expect(RECOVERY_NETWORKS[key].key).toBe(key);
  });

  it.each(KEYS)(
    "%s matches the original app's chain, USDC and native coin",
    (key) => {
      const n = RECOVERY_NETWORKS[key];
      const want = EXPECTED[key];
      expect(n.chain.id).toBe(want.id);
      expect(n.thirdwebChain.id).toBe(want.id);
      expect(n.usdcAddress).toBe(want.usdc);
      expect(n.usdcDecimals).toBe(want.decimals);
      expect(n.chain.nativeCurrency.symbol).toBe(want.native);
      expect(n.chain.nativeCurrency.decimals).toBe(18);
    },
  );

  it("only has valid addresses (lowercase, or with a correct checksum)", () => {
    for (const key of KEYS) {
      const n = RECOVERY_NETWORKS[key];
      const addresses = [
        n.entryPoint,
        n.factoryAddress,
        n.usdcAddress,
        ...n.extraTokens.map((t) => t.address),
      ];
      for (const address of addresses) {
        expect(isAddress(address), `${key}: ${address}`).toBe(true);
      }
    }
  });

  it("uses the canonical v0.6 EntryPoint and one shared factory", () => {
    expect(ENTRY_POINT_ADDRESS).toBe(
      "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    );
    expect(ACCOUNT_FACTORY_ADDRESS).toBe(
      "0xdE320c2E2b4953883f61774c006f9057A55B97D1",
    );
    for (const key of KEYS) {
      expect(RECOVERY_NETWORKS[key].entryPoint).toBe(ENTRY_POINT_ADDRESS);
      expect(RECOVERY_NETWORKS[key].factoryAddress).toBe(
        ACCOUNT_FACTORY_ADDRESS,
      );
    }
  });

  it("gives every network an https RPC and an explorer", () => {
    for (const key of KEYS) {
      const { chain } = RECOVERY_NETWORKS[key];
      expect(chain.rpcUrls.default.http[0]).toMatch(/^https:\/\//);
      expect(chain.blockExplorers?.default.url).toMatch(/^https:\/\//);
    }
  });

  it("has no bundler for zkSync Era and X Layer only", () => {
    const withoutBundler = KEYS.filter(
      (k) => RECOVERY_NETWORKS[k].bundlerUrl === null,
    );
    expect(withoutBundler.sort()).toEqual(["xlayer", "zksync"]);
  });

  it("keeps the per-network token and scan overrides", () => {
    expect(RECOVERY_NETWORKS.xlayer.logScanBlocks).toBe(100);
    expect(RECOVERY_NETWORKS.monad.logScanBlocks).toBe(500);
    expect(RECOVERY_NETWORKS.celo.extraTokens.map((t) => t.symbol)).toEqual([
      "USDT",
    ]);
    expect(
      RECOVERY_NETWORKS.robinhood.extraTokens.map((t) => t.symbol),
    ).toEqual(["USDG"]);
    expect(RECOVERY_NETWORKS.xlayer.extraTokens.map((t) => t.symbol)).toEqual([
      "USDC.e",
    ]);
    expect(RECOVERY_NETWORKS.ethereum.extraTokens).toEqual([]);
  });

  it("represents the native coin as the zero address", () => {
    expect(NATIVE_TOKEN_ADDRESS).toBe(
      "0x0000000000000000000000000000000000000000",
    );
  });
});

describe("RECOVERY_NETWORK_LIST", () => {
  it("lists every network once, alphabetically by label", () => {
    expect(RECOVERY_NETWORK_LIST).toHaveLength(13);
    const labels = RECOVERY_NETWORK_LIST.map((n) => n.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });
});

describe("DEFAULT_RECOVERY_NETWORK", () => {
  it("is a real network", () => {
    expect(isRecoveryNetworkKey(DEFAULT_RECOVERY_NETWORK)).toBe(true);
  });
});

describe("isRecoveryNetworkKey", () => {
  it.each(KEYS)("accepts %s", (key) => {
    expect(isRecoveryNetworkKey(key)).toBe(true);
  });

  it.each([[""], ["Monad"], ["base"], [null], [undefined], [143], [{}]])(
    "rejects %j",
    (value) => {
      expect(isRecoveryNetworkKey(value)).toBe(false);
    },
  );

  // BUG (src/recovery/core/networks.ts, isRecoveryNetworkKey): `value in
  // NETWORK_SPECS` also matches inherited Object.prototype members, so a
  // stored "constructor" / "toString" passes the guard and
  // RECOVERY_NETWORKS[key] is then undefined.
  it.each([["constructor"], ["toString"], ["__proto__"], ["hasOwnProperty"]])(
    "rejects the inherited property name %s",
    (value) => {
      expect(isRecoveryNetworkKey(value)).toBe(false);
    },
  );
});

describe("getExplorerTxUrl", () => {
  it("joins the explorer base and /tx/<hash> for every network", () => {
    for (const key of KEYS) {
      const url = getExplorerTxUrl(key, "0xabc");
      expect(url).toBe(
        `${RECOVERY_NETWORKS[key].chain.blockExplorers?.default.url}/tx/0xabc`,
      );
    }
  });

  it("builds the known Etherscan link", () => {
    expect(getExplorerTxUrl("ethereum", "0xabc")).toBe(
      "https://etherscan.io/tx/0xabc",
    );
  });
});

describe("bundler URLs", () => {
  it("use Pimlico per chain, and none where Pimlico has no bundler", () => {
    expect(RECOVERY_NETWORKS.optimism.bundlerUrl).toMatch(
      /^https:\/\/api\.pimlico\.io\/v2\/10\/rpc\?apikey=pim_\w+$/,
    );
    expect(RECOVERY_NETWORKS.monad.bundlerUrl).toContain("/v2/143/rpc");
    expect(RECOVERY_NETWORKS.zksync.bundlerUrl).toBeNull();
    expect(RECOVERY_NETWORKS.xlayer.bundlerUrl).toBeNull();
  });
});
