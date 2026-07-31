import {
  Check,
  ChevronRight,
  Fingerprint,
  Loader2,
  Mail,
  Phone,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { usePrices } from "@p2pdotme/sdk/react";
import type { BvnMethod, BvnOtpMethod } from "@p2pdotme/sdk/zkkyc";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts";
import { useBvnVerification } from "@/hooks/use-bvn";
import { useThirdweb } from "@/hooks/use-thirdweb";
import {
  useBvnRpReward,
  useBvnVerificationStatus,
} from "@/hooks/use-tx-limits";

/** Icon shown next to each OTP delivery channel. */
const OTP_METHOD_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  phone: Phone,
  phone_1: Phone,
  alternate_phone: Smartphone,
};

/** Card footer button reflecting the current on-chain verification state. */
function BvnCardAction({
  hasAccount,
  isStatusLoading,
  isVerified,
  onGetVerified,
}: {
  hasAccount: boolean;
  isStatusLoading: boolean;
  isVerified: boolean | undefined;
  onGetVerified: () => void;
}) {
  const { t } = useTranslation();

  if (!hasAccount) {
    return (
      <Button
        variant="outline"
        onClick={() => toast.error(t("PLEASE_LOGIN_TO_VERIFY"))}>
        {t("LOGIN_TO_GET_VERIFIED_BUTTON")}
      </Button>
    );
  }

  if (isStatusLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t("LOADING")}
      </Button>
    );
  }

  if (isVerified) {
    return (
      <Button
        className="bg-muted text-foreground hover:bg-muted"
        onClick={() => toast.success(t("ALREADY_VERIFIED"))}>
        <Check className="mr-2 size-4" />
        {t("VERIFIED")}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={onGetVerified}>
      {t("GET_VERIFIED")}
    </Button>
  );
}

/** The verification entry card shown in the Verifications list. */
function BvnCard({
  hasAccount,
  isStatusLoading,
  isVerified,
  limit,
  onGetVerified,
}: {
  hasAccount: boolean;
  isStatusLoading: boolean;
  isVerified: boolean | undefined;
  limit: number;
  onGetVerified: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="gap-4 bg-transparent py-4 transition-colors">
      <CardContent className="px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/30">
              <Fingerprint className="size-5 text-foreground" />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <p className="font-medium text-lg">{t("BVN_TITLE")}</p>
              <p className="text-muted-foreground text-xs">
                {t("BVN_DESCRIPTION")}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 whitespace-normal text-left">
                {t("BVN_TAG")}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-medium text-xs">
              <span className="font-semibold text-2xl">${limit}</span>{" "}
              {t("LIMIT")}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-4">
        <BvnCardAction
          hasAccount={hasAccount}
          isStatusLoading={isStatusLoading}
          isVerified={isVerified}
          onGetVerified={onGetVerified}
        />
      </CardFooter>
    </Card>
  );
}

/** Step 1: enter the 11-digit BVN. */
function BvnStepEnter({
  bvn,
  onBvnChange,
  onContinue,
  isStarting,
}: {
  bvn: string;
  onBvnChange: (value: string) => void;
  onContinue: () => void;
  isStarting: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Input
        inputMode="numeric"
        maxLength={11}
        placeholder={t("BVN_INPUT_PLACEHOLDER")}
        value={bvn}
        onChange={(e) => onBvnChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        className="h-14 rounded-xl bg-muted"
      />
      <Button
        className="h-14 w-full rounded-xl"
        disabled={bvn.length !== 11 || isStarting}
        onClick={onContinue}>
        {isStarting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("LOADING")}
          </>
        ) : (
          t("CONTINUE")
        )}
      </Button>
    </>
  );
}

/** A single selectable OTP delivery channel row. */
function OtpMethodButton({
  method,
  hint,
  disabled,
  onSelect,
}: {
  method: string;
  hint?: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  const Icon = OTP_METHOD_ICONS[method] ?? Smartphone;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-sm capitalize">
          {method.replace(/_/g, " ")}
        </span>
        {hint && (
          <span className="text-muted-foreground text-sm">{hint}</span>
        )}
      </div>
      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Sort so the "alternate phone" option always comes first. */
function sortMethods(methods: BvnMethod[]): BvnMethod[] {
  return [...methods].sort((a, b) =>
    a.method === "alternate_phone"
      ? -1
      : b.method === "alternate_phone"
        ? 1
        : 0,
  );
}

/** Step 2: choose how to receive the OTP. */
function BvnStepMethod({
  methods,
  phoneNumber,
  onPhoneNumberChange,
  onSelectMethod,
  isSendingOtp,
}: {
  methods: BvnMethod[];
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  onSelectMethod: (method: string) => void;
  isSendingOtp: boolean;
}) {
  const { t } = useTranslation();
  const hasAlternatePhone = methods.some(
    (m) => m.method === "alternate_phone",
  );

  return (
    <>
      <p className="font-medium text-sm">{t("BVN_CHOOSE_OTP_METHOD")}</p>
      {hasAlternatePhone && (
        <Input
          inputMode="tel"
          placeholder={t("BVN_ALTERNATE_PHONE_PLACEHOLDER")}
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          className="h-14 rounded-xl bg-muted"
        />
      )}
      <div className="flex flex-col gap-2">
        {sortMethods(methods).map((m) => (
          <OtpMethodButton
            key={m.method}
            method={m.method}
            hint={m.hint}
            disabled={isSendingOtp}
            onSelect={() => onSelectMethod(m.method)}
          />
        ))}
      </div>
    </>
  );
}

/** Step 3: enter the received OTP. */
function BvnStepOtp({
  otp,
  onOtpChange,
  onConfirm,
  isConfirming,
}: {
  otp: string;
  onOtpChange: (value: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Input
        inputMode="numeric"
        maxLength={6}
        placeholder={t("BVN_OTP_PLACEHOLDER")}
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="h-14 rounded-xl bg-muted"
      />
      <Button
        className="h-14 w-full rounded-xl"
        disabled={otp.length < 4 || isConfirming}
        onClick={onConfirm}>
        {isConfirming ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("VERIFYING")}
          </>
        ) : (
          t("CONFIRM")
        )}
      </Button>
    </>
  );
}

/** Final step: verification succeeded. */
function BvnStepDone() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-14 animate-in items-center justify-center rounded-full bg-primary/20 zoom-in-50 duration-500">
        <Check className="size-7 animate-in text-primary zoom-in-0 spin-in-45 duration-700" />
      </div>
      <p className="font-medium text-lg">{t("BVN_VERIFIED")}</p>
    </div>
  );
}

/**
 * Nigerian BVN (Bank Verification Number) verification. Renders the entry card
 * plus a drawer that drives the whole backend session — submit BVN, receive +
 * confirm an OTP — then submits the returned EIP-712 attestation on-chain. Only
 * offered when the selected market is Nigeria (NGN).
 */
export function BvnVerificationCard() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { settings } = useSettings();
  const prices = usePrices();
  const [open, setOpen] = useState(false);
  const { isBvnVerified, isBvnStatusLoading, refetchBvnStatus } =
    useBvnVerificationStatus();
  const { bvnRp, isBvnRpLoading, isBvnRpError } = useBvnRpReward();

  const { data: rpPerUsdtLimit } = useQuery({
    queryKey: ["rp-per-usdt-limit", settings.currency.currency],
    queryFn: async () => {
      return prices
        .getReputationPerUsdcLimit({ currency: settings.currency.currency })
        .match(
          (data) => data.multiplier,
          (error: unknown) => {
            console.error(
              "[BvnVerificationCard] Error fetching RP/USDT limit",
              error,
            );
            return 1;
          },
        );
    },
  });

  const limit =
    (isBvnRpLoading || isBvnRpError ? 0 : (bvnRp ?? 0)) * (rpPerUsdtLimit ?? 1);
  const {
    step,
    methods,
    start,
    isStarting,
    sendOtp,
    isSendingOtp,
    confirm,
    isConfirming,
    reset,
  } = useBvnVerification();

  const [bvn, setBvn] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const closeDrawer = () => {
    setOpen(false);
    setBvn("");
    setOtp("");
    setPhoneNumber("");
    reset();
  };

  const handleStart = async () => {
    try {
      await start(bvn);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("BVN_VERIFICATION_FAILED"),
      );
    }
  };

  const handleSendOtp = async (method: string) => {
    if (method === "alternate_phone" && !phoneNumber.trim()) {
      toast.error(t("BVN_ENTER_PHONE_NUMBER"));
      return;
    }
    try {
      await sendOtp({
        method: method as BvnOtpMethod,
        phoneNumber: phoneNumber.trim() || undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("BVN_VERIFICATION_FAILED"),
      );
    }
  };

  const handleConfirm = async () => {
    try {
      await confirm(otp);
      toast.success(t("BVN_VERIFIED"));
      await refetchBvnStatus();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("BVN_VERIFICATION_FAILED");
      // The backend rejects a re-used BVN with reason "bvn_reused".
      toast.error(
        message === "bvn_reused" ? t("BVN_ALREADY_VERIFIED") : message,
      );
    }
  };

  return (
    <>
      <BvnCard
        hasAccount={!!account?.address}
        isStatusLoading={isBvnStatusLoading}
        isVerified={isBvnVerified}
        limit={limit}
        onGetVerified={() => setOpen(true)}
      />

      <Drawer
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : closeDrawer())}>
        <DrawerContent
          className="mx-auto max-w-md bg-background"
          autoFocus={true}
          onInteractOutside={(e) => e.preventDefault()}>
          <div className="w-full">
            <DrawerHeader>
              <DrawerTitle>{t("BVN_TITLE")}</DrawerTitle>
              <DrawerDescription>
                {t("BVN_DRAWER_DESCRIPTION")}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 px-4 pb-2">
              {step === "bvn" && (
                <BvnStepEnter
                  bvn={bvn}
                  onBvnChange={setBvn}
                  onContinue={handleStart}
                  isStarting={isStarting}
                />
              )}

              {step === "method" && (
                <BvnStepMethod
                  methods={methods}
                  phoneNumber={phoneNumber}
                  onPhoneNumberChange={setPhoneNumber}
                  onSelectMethod={handleSendOtp}
                  isSendingOtp={isSendingOtp}
                />
              )}

              {step === "otp" && (
                <BvnStepOtp
                  otp={otp}
                  onOtpChange={setOtp}
                  onConfirm={handleConfirm}
                  isConfirming={isConfirming}
                />
              )}

              {step === "done" && <BvnStepDone />}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button
                  className="h-14 w-full rounded-xl"
                  variant={step === "done" ? "default" : "outline"}>
                  {step === "done" ? t("DONE") : t("CANCEL")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
