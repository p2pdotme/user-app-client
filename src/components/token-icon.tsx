import { useState } from "react";

const ICON_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

type TokenIconProps = {
  symbol: string;
  iconUrl?: string;
  chainIconUrl?: string;
  className?: string;
};

/** Token image (initials fallback) with a chain badge overlaid bottom-right. */
export function TokenIcon({
  symbol,
  iconUrl,
  chainIconUrl,
  className = "size-10",
}: TokenIconProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [chainImgFailed, setChainImgFailed] = useState(false);
  const color =
    ICON_COLORS[
      [...symbol].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
        ICON_COLORS.length
    ];

  return (
    <span className={`${className} relative shrink-0`}>
      {iconUrl && !imgFailed ? (
        <img
          src={iconUrl}
          alt={symbol}
          className="size-full rounded-full bg-muted object-cover p-1"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className={`${color} flex size-full items-center justify-center rounded-full font-semibold text-sm text-white`}
        >
          {symbol.slice(0, 2).toUpperCase()}
        </span>
      )}
      {chainIconUrl && !chainImgFailed && (
        <img
          src={chainIconUrl}
          alt=""
          className="absolute right-0 bottom-0 size-2/5 rounded-full border border-background bg-background object-cover"
          onError={() => setChainImgFailed(true)}
        />
      )}
    </span>
  );
}
