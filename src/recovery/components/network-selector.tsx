import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  RECOVERY_NETWORK_LIST,
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
} from "@/recovery/core";
import { NetworkIcon } from "./network-icon";

interface NetworkSelectorProps {
  selected: RecoveryNetworkKey;
  onSelect: (network: RecoveryNetworkKey) => void;
  disabled?: boolean;
}

/** Bottom-sheet picker for the network the funds were sent on. */
export function NetworkSelector({
  selected,
  onSelect,
  disabled = false,
}: NetworkSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return RECOVERY_NETWORK_LIST;
    return RECOVERY_NETWORK_LIST.filter(
      (network) =>
        network.label.toLowerCase().includes(query) ||
        network.chain.name.toLowerCase().includes(query) ||
        network.chain.nativeCurrency.symbol.toLowerCase().includes(query),
    );
  }, [search]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} autoFocus>
      <DrawerTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-14 w-full shrink-0 items-center gap-3 rounded-xl bg-primary/10 px-3 text-left disabled:cursor-not-allowed disabled:opacity-50">
          <NetworkIcon network={selected} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground text-xs">
              {t("NETWORK")}
            </span>
            <span className="truncate font-semibold text-sm">
              {RECOVERY_NETWORKS[selected].label}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>{t("SELECT_NETWORK")}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder={t("RECOVERY_SEARCH_NETWORK")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="no-scrollbar overflow-y-auto px-2 pb-6">
          {filtered.map((network) => (
            <button
              key={network.key}
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              onClick={() => {
                onSelect(network.key);
                handleOpenChange(false);
              }}>
              <NetworkIcon network={network.key} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-sm">
                  {network.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {network.chain.nativeCurrency.symbol}
                </span>
              </span>
              {network.key === selected && (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              {t("RECOVERY_NO_NETWORKS_FOUND")}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
