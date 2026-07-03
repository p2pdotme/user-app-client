import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { OneClickToken } from "@/core/near-intents";
import { getChainIconUrl } from "@/hooks/use-oneclick";

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

type TokenSelectorProps = {
  tokens: OneClickToken[];
  selected: OneClickToken | null;
  onSelect: (token: OneClickToken) => void;
  getTokenIconUrl: (token: OneClickToken) => string | undefined;
};

/** Pill trigger + bottom drawer with a searchable token/chain list. */
export function TokenSelector({
  tokens,
  selected,
  onSelect,
  getTokenIconUrl,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? tokens.filter(
          (token) =>
            token.symbol.toLowerCase().includes(query) ||
            token.blockchain.toLowerCase().includes(query),
        )
      : tokens;
    return [...list].sort(
      (a, b) =>
        a.symbol.localeCompare(b.symbol) ||
        a.blockchain.localeCompare(b.blockchain),
    );
  }, [tokens, search]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-muted py-1.5 pr-3 pl-1.5 text-left"
        >
          {selected ? (
            <>
              <TokenIcon
                symbol={selected.symbol}
                iconUrl={getTokenIconUrl(selected)}
                chainIconUrl={getChainIconUrl(selected.blockchain)}
                className="size-9"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-semibold text-sm">
                  {selected.symbol}
                </span>
                <span className="text-muted-foreground text-xs capitalize">
                  {selected.blockchain}
                </span>
              </span>
            </>
          ) : (
            <span className="px-2 font-medium text-sm">Select token</span>
          )}
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Select token</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder="Search token or chain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="no-scrollbar overflow-y-auto px-2 pb-6">
          {filtered.map((token) => (
            <button
              key={token.assetId}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              onClick={() => {
                onSelect(token);
                setSearch("");
                setOpen(false);
              }}
            >
              <TokenIcon
                symbol={token.symbol}
                iconUrl={getTokenIconUrl(token)}
                chainIconUrl={getChainIconUrl(token.blockchain)}
                className="size-9"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-sm">{token.symbol}</span>
                <span className="text-muted-foreground text-xs capitalize">
                  {token.blockchain}
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              No tokens found
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
