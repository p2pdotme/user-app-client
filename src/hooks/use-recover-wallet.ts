import { ResultAsync } from "neverthrow";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Account } from "thirdweb/wallets";
import { isAddress, parseUnits } from "viem";
import { connectSmartWalletFromPrivateKey } from "@/core/adapters/thirdweb";
import {
  getP2PTokenBalance,
  transferP2PToken,
} from "@/core/adapters/thirdweb/actions/p2p-token";
import {
  getUSDCBalance,
  transferUSDC,
} from "@/core/adapters/thirdweb/actions/usdc";

export type RecoverToken = "USDC" | "P2P";

/** Both USDC and the P2P token use 6 decimals on Base. */
export const RECOVER_TOKEN_DECIMALS: Record<RecoverToken, number> = {
  USDC: 6,
  P2P: 6,
};

const RECOVER_TOKEN_TRANSFER = {
  USDC: transferUSDC,
  P2P: transferP2PToken,
} as const;

const RECOVER_TOKEN_SUCCESS_KEY: Record<RecoverToken, string> = {
  USDC: "USDC_SENT_SUCCESSFULLY",
  P2P: "P2P_SENT_SUCCESSFULLY",
};

type Balances = Record<RecoverToken, bigint>;

const EMPTY_BALANCES: Balances = { USDC: 0n, P2P: 0n };

/** A raw private key: 0x followed by 64 hex chars. */
function isPrivateKey(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

type Step = "input" | "review";

/**
 * Recover funds from a smart wallet using its admin private key.
 *
 * Step 1 (`connect`): derive the smart account from the key and read its USDC
 * and P2P token balances. Step 2 (`recover`): transfer the chosen token out to
 * a destination address. The key lives only in this hook's memory and is never
 * persisted.
 */
export function useRecoverWallet() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("input");
  const [account, setAccount] = useState<Account | null>(null);
  const [balances, setBalances] = useState<Balances>(EMPTY_BALANCES);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const connect = useCallback(
    async (privateKey: string) => {
      const key = privateKey.trim();
      if (!isPrivateKey(key)) {
        toast.warning(t("RECOVER_INVALID_PRIVATE_KEY"));
        return;
      }

      setIsConnecting(true);
      const result = await connectSmartWalletFromPrivateKey(key).andThen(
        (connectedAccount) => {
          const owner = connectedAccount.address as `0x${string}`;
          return ResultAsync.combine([
            getUSDCBalance(owner),
            getP2PTokenBalance(owner),
          ] as const).map(([usdc, p2p]) => ({
            connectedAccount,
            fetched: { USDC: usdc, P2P: p2p },
          }));
        },
      );
      setIsConnecting(false);

      result.match(
        ({ connectedAccount, fetched }) => {
          setAccount(connectedAccount);
          setBalances(fetched);
          setStep("review");
        },
        () => toast.error(t("RECOVER_CONNECT_FAILED")),
      );
    },
    [t],
  );

  const recover = useCallback(
    async (token: RecoverToken, destination: string, amount: string) => {
      if (!account) return;

      const to = destination.trim();
      if (!isAddress(to)) {
        toast.warning(t("INVALID_ADDRESS"));
        return;
      }

      const amountUnits = parseUnits(amount, RECOVER_TOKEN_DECIMALS[token]);
      if (amountUnits <= 0n || amountUnits > balances[token]) {
        toast.warning(t("INVALID_AMOUNT"));
        return;
      }

      setIsRecovering(true);
      const result = await RECOVER_TOKEN_TRANSFER[token](
        { address: to as `0x${string}`, amount: amountUnits },
        account,
      );
      setIsRecovering(false);

      result.match(
        () => {
          toast.success(t(RECOVER_TOKEN_SUCCESS_KEY[token], { amount }));
          setBalances((prev) => ({
            ...prev,
            [token]: prev[token] - amountUnits,
          }));
        },
        () => toast.error(t("TRANSFER_FAILED")),
      );
    },
    [account, balances, t],
  );

  const reset = useCallback(() => {
    setStep("input");
    setAccount(null);
    setBalances(EMPTY_BALANCES);
  }, []);

  return {
    step,
    address: account?.address,
    balances,
    isConnecting,
    isRecovering,
    connect,
    recover,
    reset,
  };
}
