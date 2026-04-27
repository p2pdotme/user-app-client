import type React from "react";
import { Navigate } from "react-router";
import { useSettings } from "@/contexts";
import { INTERNAL_HREFS } from "@/lib/constants";

interface DevRouteGuardProps {
  children: React.ReactNode;
}

export function DevRouteGuard({ children }: DevRouteGuardProps) {
  const { settings } = useSettings();

  if (!settings.devMode) {
    console.error("Dev routes are only available in development environment");
    return <Navigate to={INTERNAL_HREFS.NOT_FOUND} replace />;
  }

  return <>{children}</>;
}
