import { ArrowLeftCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface DeleteConfirmationViewProps {
  addressLabel: string;
  onBack: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationView({
  addressLabel,
  onBack,
  onConfirm,
}: DeleteConfirmationViewProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="delete-confirmation"
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <DrawerTitle>{t("DELETE_ADDRESS")}</DrawerTitle>
          <div className="w-6" />
        </div>
      </DrawerHeader>

      <div className="space-y-6 px-4">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 p-4">
            <Trash2 className="size-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{t("ARE_YOU_SURE")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("DELETE_ADDRESS_CONFIRMATION")}
            </p>
            <p className="font-medium text-sm">"{addressLabel}"</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="destructive"
            className="w-full p-6"
            onClick={onConfirm}>
            <Trash2 className="mr-2 size-4" />
            {t("DELETE")}
          </Button>

          <Button variant="outline" className="w-full p-6" onClick={onBack}>
            {t("CANCEL")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
