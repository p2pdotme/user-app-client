import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned slot (buttons, info tip) */
  action?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="font-medium text-lg">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}
