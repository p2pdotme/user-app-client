import {
  ArrowUpRight,
  Award,
  Headphones,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts";
import { CURRENCY } from "@/lib/constants";

export function FundProtectionGuidelines() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const isINR = currency.currency === CURRENCY.INR;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-6 text-primary" />
          <span>
            {t("STAY_SECURE")} : {t("FUND_PROTECTION_GUIDELINES")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alternative Bank Account Section */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 text-primary">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm">
              {t("BURNER_ACCOUNT_EXTRA_SECURITY")}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("BURNER_ACCOUNT_DESCRIPTION")}
            </p>
          </div>
        </div>

        {/* Smart Limits Section */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 text-primary">
            <Award className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm">
              {t("SMART_LIMITS_NO_FREEZES")}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("SMART_LIMITS_DESCRIPTION")}
            </p>
          </div>
        </div>

        {/* Stuck Funds Section */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 text-primary">
            <Headphones className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm">
              {t("STUCK_FUNDS_QUICK_SUPPORT")}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("STUCK_FUNDS_DESCRIPTION")}
            </p>
            {isINR && (
              <a
                href="https://unfreeze.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline">
                {t("UNFREEZE_PRO_CTA")}
                <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
