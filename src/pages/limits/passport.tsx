import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { NonHomeHeader } from "@/components";
import { useSettings } from "@/contexts";
import { usePageMeta } from "@/hooks";
import { INTERNAL_HREFS, KYC_COUNTRY_BY_CURRENCY } from "@/lib/constants";
import { PrivacyBanner } from "./privacy-banner";
import { KycVerificationCard } from "./verifications";

/** Passport KYC tier: `/limits/passport`. */
export function LimitsPassport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("METHOD_PASSPORT_TITLE") });
  const { settings } = useSettings();
  // Same gate as KycVerificationCard (which renders nothing when unmapped).
  const isKycAvailable = !!KYC_COUNTRY_BY_CURRENCY[settings.currency.currency];

  return (
    <>
      <NonHomeHeader
        title={t("METHOD_PASSPORT_TITLE")}
        subtitle={t("LIMITS_PASSPORT_SUBTITLE")}
        onBack={() => navigate(INTERNAL_HREFS.LIMITS)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto pt-6 pb-4">
        <PrivacyBanner
          title={t("LIMITS_PRIVATE_TITLE")}
          description={t("LIMITS_PRIVATE_DESCRIPTION")}
        />
        {isKycAvailable ? (
          <KycVerificationCard />
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
            <p className="font-bold text-foreground text-sm">
              {t("LIMITS_UNAVAILABLE_IN_REGION_TITLE")}
            </p>
            <p className="font-medium text-muted-foreground text-sm">
              {t("KYC_NOT_AVAILABLE_FOR_REGION")}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
