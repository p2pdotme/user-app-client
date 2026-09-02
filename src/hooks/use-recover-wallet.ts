import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Account } from "thirdweb/wallets";
import { formatUnits, isAddress, parseUnits } from "viem";
import { connectSmartWalletFromPrivateKey } from "@/core/adapters/thirdweb";
import {
  getUSDCBalance,
  transferUSDC,
} from "@/core/adapters/thirdweb/actions/usdc";

const USDC_DECIMALS = 6;

/** A raw private key: 0x followed by 64 hex chars. */
function isPrivateKey(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

type Step = "input" | "review";

/**
 * Recover funds from a smart wallet using its admin private key.
 *
 * Step 1 (`connect`): derive the smart account from the key and read its USDC
 * balance. Step 2 (`recover`): transfer USDC out to a destination address.
 * The key lives only in this hook's memory and is never persisted.
 */
export function useRecoverWallet() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("input");
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const balanceFormatted = formatUnits(balance, USDC_DECIMALS);

  const connect = useCallback(
    async (privateKey: string) => {
      const key = privateKey.trim();
      if (!isPrivateKey(key)) {
        toast.warning(t("RECOVER_INVALID_PRIVATE_KEY"));
        return;
      }

      setIsConnecting(true);
      const result = await connectSmartWalletFromPrivateKey(key).andThen(
        (connectedAccount) =>
          getUSDCBalance(connectedAccount.address as `0x${string}`).map(
            (raw) => ({
              connectedAccount,
              raw,
            }),
          ),
      );
      setIsConnecting(false);

      result.match(
        ({ connectedAccount, raw }) => {
          setAccount(connectedAccount);
          setBalance(raw);
          setStep("review");
        },
        () => toast.error(t("RECOVER_CONNECT_FAILED")),
      );
    },
    [t],
  );

  const recover = useCallback(
    async (destination: string, amount: string) => {
      if (!account) return;

      const to = destination.trim();
      if (!isAddress(to)) {
        toast.warning(t("INVALID_ADDRESS"));
        return;
      }

      const amountUnits = parseUnits(amount, USDC_DECIMALS);
      if (amountUnits <= 0n || amountUnits > balance) {
        toast.warning(t("INVALID_AMOUNT"));
        return;
      }

      setIsRecovering(true);
      const result = await transferUSDC(
        { address: to as `0x${string}`, amount: amountUnits },
        account,
      );
      setIsRecovering(false);

      result.match(
        () => {
          toast.success(t("USDC_SENT_SUCCESSFULLY", { amount }));
          setBalance((prev) => prev - amountUnits);
        },
        () => toast.error(t("TRANSFER_FAILED")),
      );
    },
    [account, balance, t],
  );

  const reset = useCallback(() => {
    setStep("input");
    setAccount(null);
    setBalance(0n);
  }, []);

  return {
    step,
    address: account?.address,
    balance,
    balanceFormatted,
    isConnecting,
    isRecovering,
    connect,
    recover,
    reset,
  };
}
