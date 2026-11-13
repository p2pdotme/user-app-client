import { ShieldCheck } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Subtle anti-scam reminder ("support will never ask for your OTP / wallet
 * access"). Cosmetic only: if the copy is missing or anything throws, it
 * renders nothing rather than breaking the screen it sits on.
 *
 * Copy may wrap key terms in `<0>…</0>`; those render highlighted.
 */
const SAFETY_NOTICE_KEYS = {
  wallet: "SAFETY_NOTICE_WALLET",
} as const;

export type SafetyNoticeVariant = keyof typeof SAFETY_NOTICE_KEYS;

interface SafetyNoticeProps {
  variant: SafetyNoticeVariant;
  className?: string;
}

function useSafetyNoticeKey(variant: SafetyNoticeVariant): string | null {
  const { t } = useTranslation();
  try {
    const key = SAFETY_NOTICE_KEYS[variant];
    if (!key) return null;
    const text = t(key);
    if (typeof text !== "string" || text.trim() === "" || text === key) {
      return null;
    }
    return key;
  } catch (error) {
    console.warn("Failed to load safety notice text:", error);
    return null;
  }
}

export function SafetyNotice({ variant, className }: SafetyNoticeProps) {
  const i18nKey = useSafetyNoticeKey(variant);
  if (!i18nKey) return null;

  return (
    <div
      role="note"
      className={cn(
        "mx-auto flex w-fit max-w-full items-start gap-2.5 rounded-lg bg-warning/8 px-3 py-2.5 text-muted-foreground text-xs leading-relaxed",
        className,
      )}>
      <ShieldCheck
        className="mt-px size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <p className="text-pretty text-left">
        <Trans i18nKey={i18nKey} components={[<span key="em" />]} />
      </p>
    </div>
  );
}
