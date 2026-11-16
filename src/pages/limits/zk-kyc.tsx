import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { NonHomeHeader } from "@/components";
import { ResumeOrderCard } from "@/components/resume-order-card";
import { usePageMeta } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { Verifications } from "./verifications";

/** zk KYC by Reclaim (socials + BVN): `/limits/zk-kyc`. */
export function LimitsZkKyc() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("LIM_METHOD_ZK_TITLE") });

  return (
    <>
      <NonHomeHeader
        title={t("LIM_METHOD_ZK_TITLE")}
        subtitle={t("LIM_ZK_KYC_SUBTITLE")}
        onBack={() => navigate(INTERNAL_HREFS.LIMITS)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto pt-6 pb-4">
        <ResumeOrderCard />
        <Verifications />
      </main>
    </>
  );
}
