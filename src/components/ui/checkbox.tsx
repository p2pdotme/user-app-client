import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";
import { useHaptics } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  /**
   * Whether to provide haptic feedback when the checkbox state changes
   * @default true
   */
  hapticFeedback?: boolean;
}

function Checkbox({
  className,
  hapticFeedback = true,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxProps) {
  const { triggerSelectionChangeHaptic } = useHaptics();

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      if (disabled) return;

      // Trigger haptic feedback for selection change
      if (hapticFeedback) {
        triggerSelectionChangeHaptic();
      }

      // Then call the original onCheckedChange handler
      onCheckedChange?.(checked);
    },
    [disabled, hapticFeedback, onCheckedChange, triggerSelectionChangeHaptic],
  );

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 cursor-pointer rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:aria-invalid:ring-destructive/40",
        className,
      )}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none">
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
export type { CheckboxProps };
