import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PayErrorStateProps {
  onRetry: () => void;
}

export function PayErrorState({ onRetry }: PayErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("ERROR_LOADING_DATA")}</AlertTitle>
        <AlertDescription>
          {t("UNABLE_TO_LOAD_ESSENTIAL_DATA")}
        </AlertDescription>
      </Alert>
      <Button variant="outline" onClick={onRetry} className="w-full">
        {t("TRY_AGAIN")}
      </Button>
    </div>
  );
}
