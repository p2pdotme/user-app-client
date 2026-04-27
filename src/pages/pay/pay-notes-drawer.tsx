import { CheckCircle, ChevronRight, ScanQrCode } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function PayNotesDrawer() {
  const { t } = useTranslation();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="mx-auto flex w-[85%] items-center justify-between gap-4 rounded-lg bg-primary/10 p-4 outline-none transition-colors hover:bg-primary/15 focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 active:bg-primary/20">
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <span className="size-2.5 animate-scale rounded-full bg-primary" />
          </span>
          <span className="text-left text-muted-foreground text-sm">
            {t("PAY_NOTE")}
          </span>
          <ChevronRight className="size-5" />
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("PAY_NOTES")}</DrawerTitle>
          <DrawerDescription>{t("PAY_NOTES_DESCRIPTION")}</DrawerDescription>
        </DrawerHeader>
        <section className="flex flex-col gap-3 p-4">
          <ul className="flex list-none flex-col gap-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-muted-foreground text-sm">
                {t("PAY_NOTES_1")}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <ScanQrCode className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-muted-foreground text-sm">
                {t("PAY_NOTES_2")}
              </p>
            </li>
          </ul>
        </section>
        <DrawerFooter>
          <DrawerClose className="w-full rounded-lg bg-primary p-4 text-primary-foreground">
            {t("CLOSE")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
