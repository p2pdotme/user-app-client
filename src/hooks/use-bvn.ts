import { useZkkyc } from "@p2pdotme/sdk/react";
import {
  type BvnMethod,
  type BvnOtpMethod,
  type BvnSession,
  createBvnFlow,
} from "@p2pdotme/sdk/zkkyc";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Address } from "thirdweb";
import { sendPreparedTx } from "@/core/adapters/thirdweb/actions/reputation-manager";
import { BVN_API_BASE_URL, BVN_TENANT } from "@/lib/constants";
import { captureError } from "@/lib/sentry";
import { useThirdweb } from "./use-thirdweb";

/** UI step of the BVN wizard. */
export type BvnStep = "bvn" | "method" | "otp" | "done";

export type { BvnMethod, BvnOtpMethod };

/**
 * Drives the 5-step BVN on-chain attestation flow via the SDK's `createBvnFlow`
 * orchestrator, then submits the resulting EIP-712 attestation on-chain from the
 * connected smart account using `zkkyc.prepareSubmitBvnAttestation` (mirrors the
 * simple-kyc integration).
 *
 * onboard + submit BVN (one call) -> pick OTP method -> confirm OTP ->
 * mint attestation -> submitBvnAttestation on-chain.
 */
export function useBvnVerification() {
  const { account } = useThirdweb();
  const zkkyc = useZkkyc();
  // Guarded by `IS_BVN_ENABLED`: the card (and thus this hook) only renders when
  // both the backend URL and tenant are configured, so they are non-null here.
  const bvnFlow = useMemo(
    () =>
      createBvnFlow({
        baseUrl: BVN_API_BASE_URL as string,
        tenant: BVN_TENANT as string,
      }),
    [],
  );

  const [step, setStep] = useState<BvnStep>("bvn");
  const [session, setSession] = useState<BvnSession | null>(null);
  const [methods, setMethods] = useState<BvnMethod[]>([]);

  // Step 1+2: onboard the wallet, then submit the BVN to get OTP methods.
  const startMutation = useMutation({
    mutationFn: async (bvn: string) => {
      if (!account?.address) throw new Error("No account connected");
      const onboarded = await bvnFlow
        .onboard({ walletAddress: account.address as Address })
        .match(
          (result) => result,
          (error) => {
            throw error;
          },
        );
      const submitted = await bvnFlow.submitBvn(onboarded, bvn).match(
        (result) => result,
        (error) => {
          throw error;
        },
      );
      return { session: onboarded, methods: submitted };
    },
    onSuccess: ({ session: s, methods: m }) => {
      setSession(s);
      setMethods(m);
      setStep("method");
    },
    onError: (error) => console.error("[BVN] start failed", error),
  });

  // Step 3: send the OTP over the chosen channel.
  const sendOtpMutation = useMutation({
    mutationFn: async (params: {
      method: BvnOtpMethod;
      phoneNumber?: string;
    }) => {
      if (!session) throw new Error("No active BVN session");
      return bvnFlow.sendOtp(session, params).match(
        (result) => result,
        (error) => {
          throw error;
        },
      );
    },
    onSuccess: () => setStep("otp"),
    onError: (error) => console.error("[BVN] sendOtp failed", error),
  });

  // Step 4+5+6: confirm OTP, mint attestation, submit on-chain.
  const confirmMutation = useMutation({
    mutationFn: async (otp: string) => {
      if (!session) throw new Error("No active BVN session");
      if (!account) throw new Error("No account connected");

      const decision = await bvnFlow.confirmOtp(session, otp).match(
        (result) => result,
        (error) => {
          throw error;
        },
      );
      if (decision.decision === "reject") {
        throw new Error(decision.reason ?? "Verification was rejected");
      }

      const attestation = await bvnFlow.getAttestation(session).match(
        (result) => result,
        (error) => {
          throw error;
        },
      );

      return sendPreparedTx(
        zkkyc.prepareSubmitBvnAttestation({
          nullifier: attestation.nullifier,
          limit: attestation.limit,
          expiry: attestation.expiry,
          signature: attestation.signature,
        }),
        account,
        "submitBvnAttestation",
      ).match(
        (receipt) => receipt,
        (error) => {
          throw error;
        },
      );
    },
    onSuccess: () => setStep("done"),
    onError: (error) => {
      console.error("[BVN] confirm/submit failed", error);
      captureError(error, {
        operation: "bvn_confirm_and_submit",
        component: "useBvnVerification",
        userId: account?.address,
      });
    },
  });

  const reset = useCallback(() => {
    setStep("bvn");
    setSession(null);
    setMethods([]);
    startMutation.reset();
    sendOtpMutation.reset();
    confirmMutation.reset();
  }, [startMutation, sendOtpMutation, confirmMutation]);

  return {
    step,
    methods,
    start: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    sendOtp: sendOtpMutation.mutateAsync,
    isSendingOtp: sendOtpMutation.isPending,
    sendOtpError: sendOtpMutation.error,
    confirm: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
    reset,
  };
}
