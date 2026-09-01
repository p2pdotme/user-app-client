import { Copy, RotateCw, TriangleAlert } from "lucide-react";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/sentry";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Builds a human-readable, copyable error report from the caught error and
 * React component stack.
 */
function formatErrorReport(
  error: Error,
  componentStack: string | null,
): string {
  const parts = [
    `Message: ${error.message}`,
    error.stack ? `\nStack:\n${error.stack}` : "",
    componentStack ? `\nComponent stack:${componentStack}` : "",
    `\nURL: ${window.location.href}`,
    `\nTime: ${new Date().toISOString()}`,
  ];
  return parts.filter(Boolean).join("\n");
}

/**
 * Full-screen fallback shown when a render error is caught. Lets the user copy
 * the error details and reload the app.
 */
function ErrorFallback({
  error,
  componentStack,
}: {
  error: Error;
  componentStack: string | null;
}) {
  const { t } = useTranslation();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        formatErrorReport(error, componentStack),
      );
      toast.success(t("ERROR_BOUNDARY_COPIED"));
    } catch {
      toast.error(t("FAILED_TO_COPY"));
    }
  }, [error, componentStack, t]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-7 text-destructive" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-semibold text-lg">{t("ERROR_BOUNDARY_TITLE")}</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          {t("ERROR_BOUNDARY_DESCRIPTION")}
        </p>
      </div>

      <pre className="max-h-40 w-full max-w-md overflow-auto rounded-xl border border-destructive/30 bg-muted p-3 text-left text-muted-foreground text-xs">
        {error.message}
      </pre>

      <div className="flex w-full max-w-md flex-col gap-2">
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl"
          onClick={handleCopy}>
          <Copy className="size-4" />
          {t("ERROR_BOUNDARY_COPY")}
        </Button>
        <Button
          className="h-12 w-full rounded-xl"
          onClick={handleReload}
          hapticType="warning">
          <RotateCw className="size-4" />
          {t("ERROR_BOUNDARY_RELOAD")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Catches render-time errors anywhere in the child tree, reports them to
 * Sentry, and shows a recoverable fallback (copy details + reload).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack ?? null });
    captureError(error, {
      operation: "react_render",
      component: "ErrorBoundary",
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    const { error, componentStack } = this.state;
    if (error) {
      return <ErrorFallback error={error} componentStack={componentStack} />;
    }
    return this.props.children;
  }
}
