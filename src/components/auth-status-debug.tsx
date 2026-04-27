import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThirdweb } from "@/hooks";

/**
 * AuthStatusDebug component for development mode
 * Shows current authentication state and provides debug controls
 */
export function AuthStatusDebug() {
  const { t } = useTranslation();
  const {
    account,
    wallet,
    connectionStatus,
    isAutoConnectLoading,
    connect,
    disconnect,
  } = useThirdweb();
  const location = useLocation();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/20 text-green-700 border-green-300";
      case "connecting":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "disconnected":
        return "bg-red-500/20 text-red-700 border-red-300";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-300";
    }
  };

  return (
    <Card className="fixed right-4 bottom-4 z-50 w-80 border-2 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-sm">
          🔐 {t("AUTH_DEBUG")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>{t("STATUS")}:</span>
          <Badge className={getStatusColor(connectionStatus)}>
            {connectionStatus}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>{t("AUTO_CONNECT")}:</span>
          <Badge variant={isAutoConnectLoading ? "secondary" : "outline"}>
            {isAutoConnectLoading ? t("LOADING") : t("IDLE")}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>{t("ACCOUNT")}:</span>
          <span className="font-mono text-xs">
            {account?.address
              ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
              : t("NONE")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t("WALLET")}:</span>
          <span className="text-xs">{wallet?.id ? wallet.id : t("NONE")}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t("PATH")}:</span>
          <span className="font-mono text-xs">{location.pathname}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={connect}
            disabled={
              connectionStatus === "connected" ||
              connectionStatus === "connecting"
            }
            className="h-7 flex-1 text-xs">
            {t("CONNECT")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={disconnect}
            disabled={connectionStatus === "disconnected"}
            className="h-7 flex-1 text-xs">
            {t("DISCONNECT")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
