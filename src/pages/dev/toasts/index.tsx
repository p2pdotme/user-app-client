import {
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts";

export function ToastsDemo() {
  const loadingIdRef = useRef<string | number | undefined>(undefined);
  const { settings } = useSettings();
  const { t } = useTranslation();

  const triggerLoadingThenSuccess = () => {
    loadingIdRef.current = toast.loading(t("LOADING"), { duration: 2000 });
    setTimeout(() => {
      toast.success(t("DEV_TOASTS_LOADED_SUCCESSFULLY"), {
        id: loadingIdRef.current,
      });
    }, 2000);
  };

  const triggerLoadingThenError = () => {
    loadingIdRef.current = toast.loading(t("PROCESSING"), { duration: 2000 });
    setTimeout(() => {
      toast.error(t("UNKNOWN_ERROR"), { id: loadingIdRef.current });
    }, 2000);
  };

  const triggerPromise = (shouldResolve: boolean) => {
    const demo = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (shouldResolve) {
          resolve("Complete");
        } else {
          reject(new Error("Failed"));
        }
      }, 1500);
    });
    toast.promise(demo, {
      loading: t("DEV_TOASTS_WORKING"),
      success: t("DONE"),
      error: t("DEV_TOASTS_FAILED"),
    });
  };

  return (
    <>
      <NonHomeHeader title={t("DEV_TOASTS_TITLE")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5" />
              {t("DEV_TOASTS_SYSTEM")}
              <Badge variant="secondary" className="ml-2 text-xs">
                {settings.theme}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t("DEV_TOASTS_INTRO")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("DEV_TOASTS_BASIC")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Button
              className="w-full"
              onClick={() => toast.success(t("DEV_TOASTS_BTN_SUCCESS"))}>
              {t("DEV_TOASTS_BTN_SUCCESS")}
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => toast.error(t("DEV_TOASTS_BTN_ERROR"))}>
              {t("DEV_TOASTS_BTN_ERROR")}
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => toast.warning(t("DEV_TOASTS_BTN_WARNING"))}>
              {t("DEV_TOASTS_BTN_WARNING")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => toast.info(t("DEV_TOASTS_BTN_INFO"))}>
              {t("DEV_TOASTS_BTN_INFO")}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => toast(t("DEFAULT"))}>
              {t("DEFAULT")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => toast.loading(t("LOADING"))}>
              {t("LOADING")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("DEV_TOASTS_WITH_DESCRIPTIONS")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Button
              className="w-full"
              onClick={() =>
                toast.success(t("DEV_TOASTS_PAYMENT_SENT"), {
                  description: t("DEV_TOASTS_TAKES_A_FEW_MINUTES"),
                })
              }>
              {t("DEV_TOASTS_SUCCESS_WITH_DESC")}
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() =>
                toast.error(t("DEV_TOASTS_PAYMENT_FAILED"), {
                  description: t("DEV_TOASTS_INSUFFICIENT_FUNDS"),
                })
              }>
              {t("DEV_TOASTS_ERROR_WITH_DESC")}
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() =>
                toast.warning(t("DEV_TOASTS_CHECK_DETAILS"), {
                  description: t("DEV_TOASTS_SOME_FIELDS_LOOK_OFF"),
                })
              }>
              {t("DEV_TOASTS_WARNING_WITH_DESC")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() =>
                toast.info(t("DEV_TOASTS_HEADS_UP"), {
                  description: t("DEV_TOASTS_NEW_UPDATE_AVAILABLE"),
                })
              }>
              {t("DEV_TOASTS_INFO_WITH_DESC")}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() =>
                toast(t("DEV_TOASTS_NEUTRAL"), {
                  description: t("DEV_TOASTS_FYI_OPTIONAL_SUBTITLE"),
                })
              }>
              {t("DEV_TOASTS_DEFAULT_WITH_DESC")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("DEV_TOASTS_ACTIONS")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Button
              className="w-full"
              onClick={() =>
                toast(t("DEV_TOASTS_COPIED_TO_CLIPBOARD"), {
                  action: {
                    label: t("DEV_TOASTS_UNDO"),
                    onClick: () =>
                      toast.info(t("DEV_TOASTS_UNDO_ACTION_EXECUTED")),
                  },
                })
              }>
              {t("DEV_TOASTS_ACTION_BUTTON")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const id = toast.loading(t("DEV_TOASTS_UPLOADING"));
                setTimeout(
                  () => toast.success(t("DEV_TOASTS_UPLOADED"), { id }),
                  1200,
                );
              }}>
              {t("DEV_TOASTS_LABEL_LOADING_SUCCESS")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const id = toast.loading(t("DEV_TOASTS_SYNCING"));
                setTimeout(
                  () => toast.error(t("DEV_TOASTS_SYNC_FAILED"), { id }),
                  1200,
                );
              }}>
              {t("DEV_TOASTS_LABEL_LOADING_ERROR")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("DEV_TOASTS_PROMISE")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              className="w-full sm:w-auto"
              onClick={() => triggerPromise(true)}>
              <CheckCircle2 className="mr-2 size-4" /> {t("DEV_TOASTS_RESOLVE")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="destructive"
              onClick={() => triggerPromise(false)}>
              <XCircle className="mr-2 size-4" /> {t("DEV_TOASTS_REJECT")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={triggerLoadingThenSuccess}>
              <Loader2 className="mr-2 size-4 animate-spin" />{" "}
              {t("DEV_TOASTS_LABEL_LOADING_SUCCESS")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={triggerLoadingThenError}>
              <TriangleAlert className="mr-2 size-4" />{" "}
              {t("DEV_TOASTS_LABEL_LOADING_ERROR")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default ToastsDemo;
