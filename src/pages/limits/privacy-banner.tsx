import { ShieldCheck } from "lucide-react";

interface PrivacyBannerProps {
  title: string;
  description: string;
}

/** Soft primary-tinted notice with a shield tile, used atop the limits sub-pages. */
export function PrivacyBanner({ title, description }: PrivacyBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="size-[18px] text-primary" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="font-semibold text-foreground text-sm leading-5">
          {title}
        </p>
        <p className="text-[13px] text-muted-foreground leading-[18px]">
          {description}
        </p>
      </div>
    </div>
  );
}
