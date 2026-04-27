import { Settings } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";

export function Maintenance() {
  const { t } = useTranslation();
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
          {t("UNDER_MAINTENANCE_DESCRIPTION")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-muted-foreground text-sm">
        <p>{t("UNDER_MAINTENANCE_EXPECTED_COMPLETION")}</p>
      </motion.div>
    </motion.main>
  );
}
