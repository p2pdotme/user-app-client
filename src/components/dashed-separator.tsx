import { Separator as SeparatorPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

interface DashedSeparatorProps
  extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  dashSize?: string;
  dashGap?: string;
}

function DashedSeparator({
  className,
  orientation = "horizontal",
  decorative = true,
  dashSize = "4px",
  dashGap = "4px",
  ...props
}: DashedSeparatorProps) {
  const dashStyle = React.useMemo(() => {
    const size = dashSize.replace(/[^0-9.]/g, "");
    const gap = dashGap.replace(/[^0-9.]/g, "");
    const unit = dashSize.replace(/[0-9.]/g, "") || "px";

    const totalLength = `${parseInt(size, 10) + parseInt(gap, 10)}${unit}`;

    return {
      backgroundImage:
        orientation === "horizontal"
          ? `repeating-linear-gradient(to right, currentColor 0, currentColor ${size}${unit}, transparent ${size}${unit}, transparent ${totalLength})`
          : `repeating-linear-gradient(to bottom, currentColor 0, currentColor ${size}${unit}, transparent ${size}${unit}, transparent ${totalLength})`,
      border: "none",
    };
  }, [dashSize, dashGap, orientation]);

  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        orientation === "horizontal" ? "w-full" : "h-full",
        orientation === "vertical" ? "w-px" : "h-px",
        className,
      )}
      style={dashStyle}
      {...props}
    />
  );
}

export { DashedSeparator };
