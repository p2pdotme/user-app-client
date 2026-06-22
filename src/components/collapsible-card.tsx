import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function readStoredOpen(storageKey: string, defaultOpen: boolean): boolean {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return defaultOpen;
    return raw === "true";
  } catch {
    return defaultOpen;
  }
}

export function CollapsibleCard({
  title,
  storageKey,
  defaultOpen = true,
  className,
  children,
}: {
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));
  const contentId = useId();

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(open));
    } catch {
      // ignore storage write failures
    }
  }, [storageKey, open]);

  return (
    <Card
      className={cn(
        "w-full gap-3 border-none bg-primary/5 px-6 pt-4 pb-4",
        className,
      )}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center justify-between">
        <span className="font-semibold leading-none">{title}</span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </Card>
  );
}
