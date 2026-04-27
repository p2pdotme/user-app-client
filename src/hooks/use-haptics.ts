import { useCallback, useMemo } from "react";
import { useSettings } from "@/contexts/settings";

/**
 * Haptic feedback categories that determine when patterns are played
 * based on user preferences
 */
type HapticCategory = "all" | "essential";

/**
 * Definition of a haptic pattern including its vibration array and category
 */
interface HapticPatternDefinition {
  /** Vibration pattern as accepted by the Web Vibration API */
  pattern: VibratePattern;
  /** Category determining when this haptic should be triggered */
  category: HapticCategory;
  /** Optional description for documentation/debugging */
  description?: string;
}

/**
 * Centralized haptic patterns configuration
 *
 * Each pattern is designed based on UX research for specific emotional responses:
 * - Light patterns (5-25ms) for subtle confirmations
 * - Medium patterns (30-70ms) for important feedback
 * - Complex patterns for critical alerts
 */
const HAPTIC_PATTERNS: Record<string, HapticPatternDefinition> = {
  /**
   * Light, subtle confirmation for common interactions
   * Feeling: Quick, responsive, unobtrusive
   */
  tap: {
    pattern: [3],
    category: "all",
    description: "Standard button clicks, icon taps, tab selection",
  },

  /**
   * Very light acknowledgement of selection changes
   * Feeling: Barely perceptible, gentle confirmation
   */
  selectionChange: {
    pattern: [5],
    category: "all",
    description: "Dropdown selections, radio buttons, checkbox changes",
  },

  /**
   * Distinct confirmation for state toggles
   * Feeling: Clear binary state change indication
   */
  toggleState: {
    pattern: [25],
    category: "all",
    description: "Switch components, toggle buttons",
  },

  /**
   * Positive, rewarding feedback for successful actions
   * Feeling: Satisfying, affirmative, completion
   */
  success: {
    pattern: [30, 50, 30],
    category: "essential",
    description: "Form submissions, saves, task completions",
  },

  /**
   * Cautionary feedback for potential issues
   * Feeling: Attention-grabbing but not alarming
   */
  warning: {
    pattern: [60, 70, 60],
    category: "essential",
    description: "Before destructive actions, validation warnings",
  },

  /**
   * Clear negative feedback for errors
   * Feeling: Distinct, noticeable, problem indication
   */
  error: {
    pattern: [70, 60, 70, 60, 70],
    category: "essential",
    description: "Failed submissions, critical errors, blocked actions",
  },

  /**
   * Subtle preview or peek feedback
   * Feeling: Gentle hint, preview indication
   */
  peek: {
    pattern: [3, 50, 3],
    category: "all",
    description: "Long-press previews, peek gestures",
  },
} as const;

/**
 * Type-safe haptic pattern names
 */
type HapticPatternName = keyof typeof HAPTIC_PATTERNS;

/**
 * Interface for the haptic functions returned by useHaptics
 */
interface HapticFunctions {
  /** Light confirmation for standard interactions */
  triggerTapHaptic: () => void;
  /** Subtle feedback for selection changes */
  triggerSelectionChangeHaptic: () => void;
  /** Clear feedback for state toggles */
  triggerToggleStateHaptic: () => void;
  /** Positive feedback for successful actions */
  triggerSuccessHaptic: () => void;
  /** Cautionary feedback for warnings */
  triggerWarningHaptic: () => void;
  /** Clear negative feedback for errors */
  triggerErrorHaptic: () => void;
  /** Subtle preview feedback */
  triggerPeekHaptic: () => void;
}

/**
 * Haptic support information for the settings UI
 */
interface HapticSupportInfo {
  /** Whether the Vibration API is available (NOT a guarantee of hardware capability) */
  isAPIAvailable: boolean;
  /** Detailed information about API availability and hardware likelihood */
  reasons: string[];
  /** Whether the user has haptics disabled in settings */
  isDisabledByUser: boolean;
  /** Whether haptics will actually be attempted based on API + user preference */
  willTrigger: boolean;
}

/**
 * Checks if the Web Vibration API is available (not if hardware can actually vibrate)
 *
 * IMPORTANT: This only checks if the API exists and is callable. Many non-vibrating
 * devices (laptops, desktops) will return true here, but calling navigator.vibrate()
 * will simply do nothing. There is no reliable way to detect actual vibration hardware.
 *
 * @returns true if the Vibration API is available, false otherwise
 */
function isVibrationAPIAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  );
}

/**
 * Attempts to provide hints about whether the device might support vibration
 * These are heuristics only and not reliable - many false positives/negatives possible
 *
 * @returns Object with heuristic-based guesses about vibration capability
 */
function getVibrationHeuristics(): {
  likelyHasVibration: boolean;
  confidence: "low" | "medium" | "high";
  reasons: string[];
} {
  const reasons: string[] = [];
  let likelyHasVibration = false;
  let confidence: "low" | "medium" | "high" = "low";

  // Check if we're in a browser environment
  if (typeof navigator === "undefined") {
    reasons.push("Not in browser environment");
    return { likelyHasVibration: false, confidence: "high", reasons };
  }

  // Check for touch capabilities as a hint
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ["mobile", "android", "iphone", "ipad", "tablet"];
  const isMobileUA = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword),
  );

  if (hasTouch) {
    reasons.push("Device supports touch input");
    likelyHasVibration = true;
  }

  if (isMobileUA) {
    reasons.push("User agent suggests mobile device");
    likelyHasVibration = true;
    confidence = "medium";
  }

  if (!hasTouch && !isMobileUA) {
    reasons.push("No touch support and desktop user agent");
    likelyHasVibration = false;
    confidence = "medium";
  }

  if (!likelyHasVibration) {
    reasons.push("Likely desktop/laptop without vibration hardware");
  }

  return { likelyHasVibration, confidence, reasons };
}

/**
 * Gets detailed information about vibration API availability and hardware likelihood
 * @returns Array of informational strings
 */
function getHapticUnsupportedReasons(): string[] {
  const reasons: string[] = [];

  // Check if we're in a browser environment
  if (typeof navigator === "undefined") {
    reasons.push("Not running in a browser environment");
    return reasons;
  }

  // Check if Vibration API exists
  if (!("vibrate" in navigator)) {
    reasons.push("Web Vibration API not available in this browser");
    reasons.push("This is common in Safari and some desktop browsers");
    return reasons;
  }

  // Check if vibrate function is callable
  if (typeof navigator.vibrate !== "function") {
    reasons.push("Vibration API exists but is not functional");
    return reasons;
  }

  // API is available, but we can't know about hardware
  const heuristics = getVibrationHeuristics();

  if (!heuristics.likelyHasVibration) {
    reasons.push("API available but device likely lacks vibration hardware");
    reasons.push(...heuristics.reasons);
  } else {
    reasons.push("API available and device might support vibration");
    reasons.push("Note: Vibration may still be disabled in system settings");
  }

  return reasons;
}

/**
 * Creates haptic support information with realistic expectations
 * @param userPreference - The user's haptic preference
 * @returns HapticSupportInfo object
 */
function createHapticSupportInfo(
  userPreference: "all" | "essential" | "none",
): HapticSupportInfo {
  const isAPIAvailable = isVibrationAPIAvailable();
  const heuristics = getVibrationHeuristics();
  const isDisabledByUser = userPreference === "none";

  // We consider it "supported" if API is available, but note the uncertainty
  const isSupported = isAPIAvailable;
  const willTrigger = isSupported && !isDisabledByUser;

  let reasons: string[] = [];

  if (!isAPIAvailable) {
    reasons = getHapticUnsupportedReasons();
  } else if (isDisabledByUser) {
    reasons = ["Haptic feedback is disabled in your settings"];
  } else {
    // API is available and user hasn't disabled it
    if (!heuristics.likelyHasVibration) {
      reasons.push("Vibration API available but hardware support uncertain");
      reasons.push("Device may not physically vibrate when triggered");
      reasons.push(...heuristics.reasons);
    } else {
      reasons.push("Vibration appears to be supported");
      reasons.push("Hardware vibration likely available");
      if (heuristics.confidence !== "high") {
        reasons.push(`(Detection confidence: ${heuristics.confidence})`);
      }
    }
  }

  return {
    isAPIAvailable,
    reasons,
    isDisabledByUser,
    willTrigger,
  };
}

/**
 * Determines if a haptic should be triggered based on user preferences
 * @param category - The haptic pattern category
 * @param userPreference - The user's haptic preference setting
 * @returns true if the haptic should be triggered
 */
function shouldTriggerHaptic(
  category: HapticCategory,
  userPreference: "all" | "essential" | "none",
): boolean {
  switch (userPreference) {
    case "none":
      return false;
    case "essential":
      return category === "essential";
    case "all":
      return true;
    default:
      return false;
  }
}

/**
 * Custom React hook providing semantic haptic feedback functions
 *
 * This hook integrates with the global settings context to respect user
 * preferences for haptic feedback. It provides type-safe, semantically
 * named functions for different types of user interactions.
 *
 * IMPORTANT LIMITATION: There is no reliable way to detect if a device
 * actually has vibration hardware. This hook can only detect if the Web
 * Vibration API is available. On devices without vibration (like most
 * laptops/desktops), the API may exist but do nothing when called.
 *
 * @returns Object containing haptic trigger functions and support information
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const { triggerTapHaptic, triggerSuccessHaptic, supportInfo } = useHaptics();
 *
 *   const handleClick = () => {
 *     // Trigger haptic feedback after the action
 *     performAction();
 *     triggerTapHaptic(); // May or may not actually vibrate
 *   };
 *
 *   return <Button onClick={handleClick}>Click me</Button>;
 * }
 * ```
 */
export function useHaptics(): HapticFunctions & {
  supportInfo: HapticSupportInfo;
} {
  const { settings } = useSettings();
  const hapticsPreference = settings.haptics;

  /**
   * Core haptic trigger function
   * Checks API availability, user preferences, and attempts vibration if appropriate
   * Note: May silently fail on devices without vibration hardware
   */
  const triggerHaptic = useCallback(
    (patternName: HapticPatternName) => {
      // Early return if Vibration API is not available
      if (!isVibrationAPIAvailable()) {
        return;
      }

      const patternDef = HAPTIC_PATTERNS[patternName];

      // Early return if haptic shouldn't be triggered based on user preference
      if (!shouldTriggerHaptic(patternDef.category, hapticsPreference)) {
        return;
      }

      try {
        // Note: This may do nothing on devices without vibration hardware
        navigator.vibrate(patternDef.pattern);
      } catch (error) {
        // Silently fail if vibration fails
        // This can happen on some browsers or in certain contexts
        console.debug(
          `Haptic feedback failed for pattern "${patternName}":`,
          error,
        );
      }
    },
    [hapticsPreference],
  );

  // Create support information
  const supportInfo = useMemo(
    () => createHapticSupportInfo(hapticsPreference),
    [hapticsPreference],
  );

  // Return memoized haptic functions to prevent unnecessary re-renders
  return {
    triggerTapHaptic: useCallback(() => triggerHaptic("tap"), [triggerHaptic]),
    triggerSelectionChangeHaptic: useCallback(
      () => triggerHaptic("selectionChange"),
      [triggerHaptic],
    ),
    triggerToggleStateHaptic: useCallback(
      () => triggerHaptic("toggleState"),
      [triggerHaptic],
    ),
    triggerSuccessHaptic: useCallback(
      () => triggerHaptic("success"),
      [triggerHaptic],
    ),
    triggerWarningHaptic: useCallback(
      () => triggerHaptic("warning"),
      [triggerHaptic],
    ),
    triggerErrorHaptic: useCallback(
      () => triggerHaptic("error"),
      [triggerHaptic],
    ),
    triggerPeekHaptic: useCallback(
      () => triggerHaptic("peek"),
      [triggerHaptic],
    ),
    supportInfo,
  };
}

/**
 * Utility function to get information about available haptic patterns
 * Useful for debugging or displaying pattern information
 */
export function getHapticPatternInfo(patternName: HapticPatternName) {
  return HAPTIC_PATTERNS[patternName];
}

/**
 * Utility function to get all available haptic pattern names
 * Useful for testing or configuration UIs
 */
export function getAllHapticPatternNames(): HapticPatternName[] {
  return Object.keys(HAPTIC_PATTERNS) as HapticPatternName[];
}

/**
 * Type export for external use
 */
export type {
  HapticFunctions,
  HapticPatternName,
  HapticCategory,
  HapticSupportInfo,
};
