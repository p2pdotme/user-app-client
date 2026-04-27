/**
 * Haptic Test Panel - Development Utility
 *
 * This component provides a testing interface for haptic patterns during development.
 * It should only be used in development mode and can be removed from production builds.
 *
 * Usage: Add this component to a dev page or behind a feature flag
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings";
import {
  getAllHapticPatternNames,
  getHapticPatternInfo,
  type HapticPatternName,
  useHaptics,
} from "@/hooks/use-haptics";

interface PatternTestButtonProps {
  patternName: HapticPatternName;
  onTest: (pattern: HapticPatternName) => void;
}

function PatternTestButton({ patternName, onTest }: PatternTestButtonProps) {
  const patternInfo = getHapticPatternInfo(patternName);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{patternName}</span>
          <Badge
            variant={
              patternInfo.category === "essential" ? "destructive" : "secondary"
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
        size="sm"
        onClick={() => onTest(patternName)}
        className="w-full sm:ml-4 sm:w-auto">
        Test
      </Button>
    </div>
  );
}

export function HapticTestPanel() {
  const haptics = useHaptics();
  const { settings } = useSettings();
  const patternNames = getAllHapticPatternNames();

  const testPattern = (patternName: HapticPatternName) => {
    // Map pattern names to haptic functions
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

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="space-y-6">
        {/* Current Settings Summary */}
        <div className="rounded-lg bg-muted p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">Current Haptic Setting:</span>
            <Badge variant="outline" className="w-fit">
              {settings.haptics}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            {settings.haptics === "none" &&
              "No haptic feedback will be triggered"}
            {settings.haptics === "essential" &&
              "Only essential patterns (success, warning, error) will trigger"}
            {settings.haptics === "all" && "All haptic patterns will trigger"}
          </p>
        </div>

        {/* Pattern Tests */}
        <div>
          <h4 className="mb-3 font-semibold">Test Haptic Patterns</h4>
          <div className="space-y-3">
            {patternNames.map((patternName) => (
              <PatternTestButton
                key={patternName}
                patternName={patternName}
                onTest={testPattern}
              />
            ))}
          </div>
        </div>

        {/* Custom Pattern Test */}
        <div>
          <h4 className="mb-3 font-semibold">Test Custom Patterns</h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              onClick={() => testCustomPattern([200])}
              className="w-full sm:w-auto">
              Long (200ms)
            </Button>
            <Button
              variant="outline"
              onClick={() => testCustomPattern([50, 50, 50])}
              className="w-full sm:w-auto">
              Triple (50-50-50ms)
            </Button>
            <Button
              variant="outline"
              onClick={() => testCustomPattern([100, 30, 100, 30, 100])}
              className="w-full sm:w-auto">
              SOS (100-30-100-30-100ms)
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
            Custom patterns bypass user preferences and trigger directly via the
            Vibration API.
          </p>
        </div>

        {/* Testing Notes */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <h5 className="mb-2 font-medium text-sm">Testing Notes:</h5>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• Test on actual mobile devices for accurate feedback</li>
            <li>• iOS Safari does not support the Vibration API</li>
            <li>
              • Some browsers require user interaction before vibration works
            </li>
            <li>• Battery-saving modes may disable vibration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified haptic tester for quick integration
 */
export function QuickHapticTest() {
  const { triggerTapHaptic, triggerSuccessHaptic, triggerErrorHaptic } =
    useHaptics();

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row">
      <Button size="sm" onClick={triggerTapHaptic} className="w-full sm:w-auto">
        Tap
      </Button>
      <Button
        size="sm"
        onClick={triggerSuccessHaptic}
        className="w-full sm:w-auto">
        Success
      </Button>
      <Button
        size="sm"
        onClick={triggerErrorHaptic}
        className="w-full sm:w-auto">
        Error
      </Button>
    </div>
  );
}
