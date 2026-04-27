import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";
import { useHaptics } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-primary border text-primary shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Whether to provide haptic feedback when the button is clicked
   * @default true
   */
  hapticFeedback?: boolean;
  /**
   * Type of haptic feedback to provide
   * @default "tap"
   */
  hapticType?: "tap" | "success" | "error" | "warning";
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  hapticFeedback = true,
  hapticType = "tap",
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const {
    triggerTapHaptic,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerWarningHaptic,
  } = useHaptics();

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      onClick?.(e);

      if (hapticFeedback) {
        switch (hapticType) {
          case "tap":
            triggerTapHaptic();
            break;
          case "success":
            triggerSuccessHaptic();
            break;
          case "error":
            triggerErrorHaptic();
            break;
          case "warning":
            triggerWarningHaptic();
            break;
        }
      }
    },
    [
      disabled,
      hapticFeedback,
      hapticType,
      onClick,
      triggerTapHaptic,
      triggerSuccessHaptic,
      triggerErrorHaptic,
      triggerWarningHaptic,
    ],
  );

  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
