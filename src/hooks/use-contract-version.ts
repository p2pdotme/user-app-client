import { useEffect, useState } from "react";
import { getContractVersion } from "@/core/adapters/thirdweb/actions/diamond-info";
import { isSyncedWithContract } from "@/lib/utils";

/**
 * A successfully read contract version is reused for this long. The check
 * runs on every route change, and the version only changes on a contract
 * upgrade, so there's no need for an RPC round-trip on every navigation.
 */
const VERSION_CACHE_MS = 5 * 60 * 1000;

let cachedVersion: { value: string; readAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

async function readContractVersion(): Promise<string | null> {
  if (cachedVersion && Date.now() - cachedVersion.readAt < VERSION_CACHE_MS) {
    return cachedVersion.value;
  }
  if (!inFlight) {
    inFlight = getContractVersion()
      .map((v) => String(v))
      .match(
        (version) => {
          cachedVersion = { value: version, readAt: Date.now() };
          return version as string | null;
        },
        // A failed read (flaky network, VPN, RPC rate limit) is "unknown",
        // not "out of date"; don't cache it so the next check retries.
        () => null,
      )
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export const useContractVersion = () => {
  const [contractVersion, setContractVersion] = useState<string | null>(
    cachedVersion?.value ?? null,
  );

  /**
   * Resolves `false` only when the contract version was read successfully and
   * differs from the one this build targets. If the version can't be read,
   * the app is NOT treated as outdated: showing the blocking "new update"
   * drawer to someone whose RPC call merely failed sends them into a reload
   * loop instead of letting them use the app.
   */
  const checkContractSync = async () => {
    try {
      const version = await readContractVersion();
      setContractVersion(version);
      return version === null ? true : isSyncedWithContract(version);
    } catch {
      return true;
    }
  };

  useEffect(() => {
    let active = true;
    void readContractVersion().then((version) => {
      if (active) setContractVersion(version);
    });
    return () => {
      active = false;
    };
  }, []);

  return { contractVersion, checkContractSync };
};
