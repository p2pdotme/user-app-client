import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { NonHomeHeader } from "@/components";
import { useSettings } from "@/contexts";
import { usePageMeta } from "@/hooks";
import { INTERNAL_HREFS, LIVENESS_EXCLUDED_COUNTRIES } from "@/lib/constants";
import { PrivacyBanner } from "./privacy-banner";
import { LivenessVerificationCard } from "./verifications";

/** Liveness (face-only) tier: `/limits/liveness`. */
export function LimitsLiveness() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("METHOD_LIVENESS_TITLE") });
  const { settings } = useSettings();
  // Same gate as LivenessVerificationCard (which renders nothing when excluded).
  const isLivenessOffered = !LIVENESS_EXCLUDED_COUNTRIES.includes(
    settings.currency.country,
  );

  return (
    <>
      <NonHomeHeader
        title={t("METHOD_LIVENESS_TITLE")}
        subtitle={t("LIMITS_LIVENESS_SUBTITLE")}
        onBack={() => navigate(INTERNAL_HREFS.LIMITS)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto pt-6 pb-4">
        <PrivacyBanner
          title={t("LIMITS_PRIVATE_TITLE")}
          description={t("LIMITS_PRIVATE_DESCRIPTION")}
        />
        {isLivenessOffered ? (
          <LivenessVerificationCard />
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
            <p className="font-bold text-foreground text-sm">
              {t("LIMITS_UNAVAILABLE_IN_REGION_TITLE")}
            </p>
            <p className="font-medium text-muted-foreground text-sm">
              {t("LIMITS_UNAVAILABLE_IN_REGION_DESCRIPTION")}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
