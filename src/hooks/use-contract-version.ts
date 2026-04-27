import { useEffect, useState } from "react";
import { getContractVersion } from "@/core/adapters/thirdweb/actions/diamond-info";
import { isSyncedWithContract } from "@/lib/utils";

export const useContractVersion = () => {
  const [contractVersion, setContractVersion] = useState<string | null>(null);

  const getContractVer = async () => {
    return await getContractVersion()
      .map((v) => String(v))
      .match(
        (version) => {
          setContractVersion(version);
          return version;
        },
        () => {
          setContractVersion(null);
          return null;
        },
      );
  };

  const checkContractSync = async () => {
    try {
      const version = await getContractVer();
      return version ? isSyncedWithContract(version) : false;
    } catch {
      return false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally triggers re-check on route change
  useEffect(() => {
    getContractVer();
  }, []);

  return { contractVersion, checkContractSync };
};
