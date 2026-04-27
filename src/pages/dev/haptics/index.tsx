import {
  AlertTriangle,
  CheckCircle,
  Info,
  Play,
  Smartphone,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts";
import {
  getAllHapticPatternNames,
  getHapticPatternInfo,
  type HapticPatternName,
  useHaptics,
} from "@/hooks/use-haptics";

export function HapticsDemo() {
  const haptics = useHaptics();
  const { supportInfo } = useHaptics();
  const { settings } = useSettings();
  const [customPatternInput, setCustomPatternInput] = useState("");
  const [customPatternError, setCustomPatternError] = useState("");

  const availablePatterns = getAllHapticPatternNames();
  const isEnabled = settings.haptics !== "none";

  const testPattern = (patternName: HapticPatternName) => {
    const hapticMap: { [key: string]: () => void } = {
      tap: haptics.triggerTapHaptic,
      selectionChange: haptics.triggerSelectionChangeHaptic,
      toggleState: haptics.triggerToggleStateHaptic,
      success: haptics.triggerSuccessHaptic,
      warning: haptics.triggerWarningHaptic,
      error: haptics.triggerErrorHaptic,
      peek: haptics.triggerPeekHaptic,
    };

    const hapticFunction = hapticMap[patternName];
    if (typeof hapticFunction === "function") {
      hapticFunction();
    }
  };

  const testCustomPattern = (pattern: number[]) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.error("Custom pattern test failed:", error);
      }
    }
  };

  const parseCustomPattern = (input: string): number[] | null => {
    if (!input.trim()) return null;

    try {
      const values = input
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => {
          const num = parseInt(v, 10);
          if (Number.isNaN(num) || num < 0) {
            throw new Error(`Invalid value: ${v}`);
          }
          return num;
        });

      if (values.length === 0) {
        throw new Error("No valid values provided");
      }

      return values;
    } catch (error) {
      setCustomPatternError(
        error instanceof Error ? error.message : "Invalid input",
      );
      return null;
    }
  };

  const testUserCustomPattern = () => {
    setCustomPatternError("");
    const pattern = parseCustomPattern(customPatternInput);
    if (pattern) {
      testCustomPattern(pattern);
    }
  };

  return (
    <>
      <NonHomeHeader title="Haptic Feedback System" showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col overflow-y-auto py-8">
        {/* System Status */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4" />
                    <span className="font-medium text-sm">Device Support</span>
                  </div>
                  <Badge
                    variant={
                      supportInfo.isAPIAvailable ? "default" : "destructive"
                    }>
                    {supportInfo.isAPIAvailable ? "Available" : "Not Available"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4" />
                    <span className="font-medium text-sm">User Setting</span>
                  </div>
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {settings.haptics}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {supportInfo.willTrigger ? (
                      <CheckCircle className="size-4 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning" />
                    )}
                    <span className="font-medium text-sm">Active Status</span>
                  </div>
                  <Badge
                    variant={supportInfo.willTrigger ? "default" : "secondary"}>
                    {supportInfo.willTrigger ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {supportInfo.reasons.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Status Details:</span>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    {supportInfo.reasons.map((reason, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="size-1 rounded-full bg-current" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {availablePatterns.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">
                    Available Patterns ({availablePatterns.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {availablePatterns.map((pattern) => (
                      <Badge
                        key={pattern}
                        variant="outline"
                        className="text-xs">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Pattern Tests */}
        <section className="mb-6 space-y-4">
          <h3 className="font-semibold text-lg">Test Haptic Patterns</h3>
          <div className="space-y-3">
            {availablePatterns.map((patternName) => {
              const patternInfo = getHapticPatternInfo(patternName);
              return (
                <div
                  key={patternName}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{patternName}</span>
                      <Badge
                        variant={
                          patternInfo.category === "essential"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs">
                        {patternInfo.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {patternInfo.description}
                    </p>
                  </div>
                  <Button
                    hapticFeedback={false}
                    size="sm"
                    onClick={() => testPattern(patternName)}
                    className="w-full sm:ml-4 sm:w-auto">
                    Test
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Custom Pattern Tests */}
        <section className="mb-6 space-y-4">
          <h3 className="font-semibold text-lg">Custom Patterns</h3>

          {/* Predefined Patterns */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              hapticFeedback={false}
              onClick={() => testCustomPattern([200])}
              className="w-full sm:w-auto">
              Long (200ms)
            </Button>
            <Button
              variant="outline"
              hapticFeedback={false}
              onClick={() => testCustomPattern([50, 50, 50])}
              className="w-full sm:w-auto">
              Triple (50-50-50ms)
            </Button>
            <Button
              variant="outline"
              hapticFeedback={false}
              onClick={() => testCustomPattern([100, 30, 100, 30, 100])}
              className="w-full sm:w-auto">
              SOS (100-30-100-30-100ms)
            </Button>
          </div>

          {/* Custom Input Pattern */}
          <div className="space-y-3 rounded-lg border p-4">
            <Label
              htmlFor="custom-pattern-input"
              className="font-medium text-sm">
              Test Your Own Pattern
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <Input
                  id="custom-pattern-input"
                  type="text"
                  placeholder="Enter comma-separated values (e.g., 100,50,100,50,200)"
                  value={customPatternInput}
                  onChange={(e) => setCustomPatternInput(e.target.value)}
                  className={customPatternError ? "border-destructive" : ""}
                />
                {customPatternError && (
                  <p className="mt-1 text-destructive text-sm">
                    {customPatternError}
                  </p>
                )}
              </div>
              <Button
                variant="default"
                hapticFeedback={false}
                onClick={testUserCustomPattern}
                disabled={!customPatternInput.trim()}
                className="w-full sm:w-auto">
                <Play className="mr-2 size-4" />
                Test Pattern
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Enter vibration durations in milliseconds, separated by commas.
              Values represent vibration duration, with pauses between them.
            </p>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Custom patterns bypass user preferences and trigger directly via the
            Vibration API.
          </p>
        </section>

        {/* Usage Guidelines */}
        <section>
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold">Usage Guidelines:</h4>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>
                • Haptic feedback respects user preferences (all/essential/none)
              </li>
              <li>• Essential patterns: success, warning, error</li>
              <li>• All patterns: tap, selection, toggle + essential</li>
              <li>• Always trigger haptic AFTER the primary action</li>
              <li>• Test on actual mobile devices for accurate feedback</li>
              <li>• iOS Safari does not support the Vibration API</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
