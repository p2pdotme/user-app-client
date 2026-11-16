import { RefreshCw, Send, Settings, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings";
import { analytics, EVENTS } from "@/lib/analytics";

export function Maintenance() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const supportUrl = currency.telegramSupportChannel;

  useEffect(() => {
    analytics.track(EVENTS.APP, { status: "maintenance_viewed" });
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container-narrow mx-auto space-y-8 text-center">
      <div className="relative">
        <motion.div
          className="flex justify-center font-bold text-primary opacity-10"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "linear",
          }}>
          <Settings className="h-72 w-72 scale-150" />
        </motion.div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>
          <img
            src={ASSETS.IMAGES.MASCOT_MAINTENANCE}
            alt={t("ALT_MAINTENANCE_MASCOT")}
            className="h-auto w-full"
          />
        </motion.div>
      </div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}>
        <h1 className="font-bold text-2xl">{t("UNDER_MAINTENANCE_TITLE")}</h1>
        <p className="text-muted-foreground">
          {t("PAYF_MAINTENANCE_DESCRIPTION")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex items-start gap-3 rounded-xl bg-primary/10 p-4 text-left">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{t("PAYF_MAINTENANCE_FUNDS_SAFE")}</p>
          <p className="text-muted-foreground">
            {t("PAYF_MAINTENANCE_ORDERS_RESUME")}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col gap-3 pb-8">
        <Button
          className="w-full p-6"
          onClick={() => {
            analytics.track(EVENTS.APP, { status: "maintenance_retry" });
            window.location.reload();
          }}>
          <RefreshCw className="size-4" />
          {t("PAYF_MAINTENANCE_RETRY")}
        </Button>
        {supportUrl ? (
          <Button asChild variant="outline" className="w-full p-6">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                analytics.track(EVENTS.APP, {
                  status: "maintenance_support_clicked",
                })
              }>
              <Send className="size-4" />
              {t("CONTACT_SUPPORT")}
            </a>
          </Button>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {t("PAYF_MAINTENANCE_FOLLOW_UPDATES")}
        </p>
      </motion.div>
    </motion.main>
  );
}
