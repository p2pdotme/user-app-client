import { useState } from "react";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  /** Flag emoji from COUNTRY_OPTIONS, shown when no image is available. */
  flag: string;
  /** Flag image URL from COUNTRY_OPTIONS (SDK `flagUrl`). */
  flagUrl?: string;
  className?: string;
}

/** Country flag image from the SDK, falling back to the emoji. */
export function CountryFlag({ flag, flagUrl, className }: CountryFlagProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!flagUrl || imgFailed) {
    return <span className={cn("leading-none", className)}>{flag}</span>;
  }

  return (
    <img
      src={flagUrl}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setImgFailed(true)}
      className={cn("size-4 object-contain", className)}
    />
  );
}
