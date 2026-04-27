import { useCallback } from "react";
import { useHaptics } from "./use-haptics";

export function useHapticInteractions() {
  const haptics = useHaptics();

  /**
   * Wraps a function with haptic feedback
   * Automatically triggers error haptic on thrown errors
   * @param callback - Function to wrap
   * @param hapticType - Type of haptic feedback to trigger on success
   * @returns Wrapped function with haptic feedback
   */
  const withHapticFeedback = useCallback(
    <T extends unknown[]>(
      callback: (...args: T) => void | Promise<void>,
      hapticType: "tap" | "success" | "error" | "warning" = "tap",
    ) => {
      return async (...args: T) => {
        try {
          await callback(...args);

          // Trigger appropriate haptic after successful action
          switch (hapticType) {
            case "tap":
              haptics.triggerTapHaptic();
              break;
            case "success":
              haptics.triggerSuccessHaptic();
              break;
            case "error":
              haptics.triggerErrorHaptic();
              break;
            case "warning":
              haptics.triggerWarningHaptic();
              break;
          }
        } catch (error) {
          // Error haptic for failed actions
          haptics.triggerErrorHaptic();
          throw error;
        }
      };
    },
    [haptics],
  );

  /**
   * Creates a click handler with haptic feedback
   * @param onClick - Original click handler
   * @param hapticType - Type of haptic feedback
   * @returns Enhanced click handler with haptic feedback
   */
  const withHapticClick = useCallback(
    (
      onClick?: (e: React.MouseEvent) => void | Promise<void>,
      hapticType: "tap" | "success" | "error" | "warning" = "tap",
    ) => {
      return withHapticFeedback((e: React.MouseEvent) => {
        onClick?.(e);
      }, hapticType);
    },
    [withHapticFeedback],
  );

  /**
   * Creates a form submission handler with haptic feedback
   * @param onSubmit - Original submit handler
   * @param successType - Haptic type for successful submission
   * @returns Enhanced submit handler with haptic feedback
   */
  const withHapticSubmit = useCallback(
    (
      onSubmit?: (e: React.FormEvent) => void | Promise<void>,
      successType: "success" | "tap" = "success",
    ) => {
      return withHapticFeedback((e: React.FormEvent) => {
        onSubmit?.(e);
      }, successType);
    },
    [withHapticFeedback],
  );

  /**
   * Creates a value change handler with haptic feedback
   * @param onChange - Original change handler
   * @param hapticType - Type of haptic feedback
   * @returns Enhanced change handler with haptic feedback
   */
  const withHapticChange = useCallback(
    <T>(
      onChange?: (value: T) => void | Promise<void>,
      hapticType: "tap" | "selectionChange" = "selectionChange",
    ) => {
      return async (value: T) => {
        try {
          await onChange?.(value);

          // Trigger appropriate haptic after successful change
          if (hapticType === "selectionChange") {
            haptics.triggerSelectionChangeHaptic();
          } else {
            haptics.triggerTapHaptic();
          }
        } catch (error) {
          // Error haptic for failed changes
          haptics.triggerErrorHaptic();
          throw error;
        }
      };
    },
    [haptics],
  );

  return {
    // Wrapper functions
    withHapticFeedback,
    withHapticClick,
    withHapticSubmit,
    withHapticChange,

    // Common interaction patterns
    onAmountEntry: haptics.triggerTapHaptic,
    onAmountClear: haptics.triggerTapHaptic,
    onCurrencyToggle: haptics.triggerSelectionChangeHaptic,
    onContinue: haptics.triggerTapHaptic,
    onValidationError: haptics.triggerErrorHaptic,

    // Order flow haptics
    onOrderPlaced: haptics.triggerSuccessHaptic,
    onOrderFailed: haptics.triggerErrorHaptic,
    onPaymentMarked: haptics.triggerSuccessHaptic,
    onPaymentFailed: haptics.triggerErrorHaptic,

    // Navigation haptics
    onNavigate: haptics.triggerTapHaptic,
    onBack: haptics.triggerTapHaptic,

    // Settings haptics
    onSettingChange: haptics.triggerSelectionChangeHaptic,
    onSettingSaved: haptics.triggerSuccessHaptic,
    onSettingError: haptics.triggerErrorHaptic,

    // QR haptics
    onQRScanned: haptics.triggerSuccessHaptic,
    onQRError: haptics.triggerErrorHaptic,

    // Direct access to all haptic functions
    ...haptics,
  };
}
