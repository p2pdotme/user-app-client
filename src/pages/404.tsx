import { ArrowLeft, Home } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { INTERNAL_HREFS } from "@/lib/constants";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <motion.main
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container-narrow mx-auto space-y-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mx-auto my-6 max-w-xs">
        <img
          src={ASSETS.IMAGES.MASCOT_404}
          alt={t("ALT_404_IMAGE")}
          className="h-auto w-full"
        />
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}>
        <h1 className="font-bold text-2xl">{t("PAGE_NOT_FOUND_TITLE")}</h1>
        <p className="text-muted-foreground">
          {t("PAGE_NOT_FOUND_DESCRIPTION")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col justify-center gap-4 sm:flex-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}>
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("GO_BACK")}
        </Button>
        <Link
          to={INTERNAL_HREFS.HOME}
          className="inline-flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Home className="mr-2 h-4 w-4" />
          {t("GO_HOME")}
        </Link>
      </motion.div>
    </motion.main>
  );
}
