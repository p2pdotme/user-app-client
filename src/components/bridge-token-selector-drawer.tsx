import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { isSolanaWallet } from "@dynamic-labs/solana";
import { ArrowLeftCircle, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { useSafeDynamicContext } from "@/contexts";
import { bridgeMetaDeposit, bridgeMetaWithdraw } from "@/core/rango/config";
import type {
  BridgeChain,
  BridgeToken,
  SupportedBridgeChains,
} from "@/core/rango/types";
import { useRangoFetch } from "@/hooks";
import { cn } from "@/lib/utils";

interface TokenListViewProps {
  selectedNetwork: BridgeChain | null;
  selectedToken: BridgeToken | null;
  onNetworkSelect: () => void;
  bridgeType: "DEPOSIT" | "WITHDRAW";
  onTokenSelect: (token: BridgeToken) => void;
  onClose: () => void;
}

function TokenListView({
  selectedNetwork,
  selectedToken,
  onNetworkSelect,
  bridgeType,
  onTokenSelect,
  onClose,
}: TokenListViewProps) {
  const { t } = useTranslation();
  // Only fetch balances for DEPOSIT transactions
  // For WITHDRAW, users are withdrawing from P2P.me balance, not external wallets
  const {
    rangoBalance,
    isRangoBalanceLoading,
    isRangoBalanceError,
    rangoBalanceError,
  } = useRangoFetch(selectedNetwork?.id as SupportedBridgeChains, bridgeType);

  const getTokenBalances = (token: BridgeToken) => {
    // For withdraw transactions, don't show balances
    if (bridgeType === "WITHDRAW") {
      return { balance: null, usdBalance: null, isLoading: false };
    }

    if (isRangoBalanceLoading) {
      return { balance: null, usdBalance: null, isLoading: true };
    }

    if (isRangoBalanceError || !rangoBalance) {
      return { balance: "0", usdBalance: "0.00", isLoading: false };
    }

    const tokenData = rangoBalance.find((b) => b.symbol === token.symbol);
    return {
      balance: tokenData?.balance || "0",
      usdBalance: tokenData?.usdBalance || "0.00",
      isLoading: false,
    };
  };

  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout>
      <DrawerHeader className="text-center">
        <DrawerTitle>{t("SELECT_A_TOKEN")}</DrawerTitle>
        <DrawerDescription>
          {bridgeType === "DEPOSIT"
            ? t("SELECT_CHAIN_AND_TOKEN_TO_BRIDGE", {
                bridgeType: t("DEPOSIT"),
              })
            : t("SELECT_CHAIN_AND_TOKEN_TO_BRIDGE", {
                bridgeType: t("WITHDRAW"),
              })}
        </DrawerDescription>
      </DrawerHeader>

      <section className="flex flex-col gap-4 px-8 py-2">
        <Label>{t("NETWORK")}</Label>
        <Button
          variant="outline"
          onClick={onNetworkSelect}
          className="flex h-auto items-center justify-between gap-2 bg-primary/10 px-4 py-3 hover:bg-primary/20">
          {selectedNetwork ? (
            <div className="flex items-center gap-4">
              <img
                src={selectedNetwork.logo}
                alt={selectedNetwork.name}
                className="size-8"
              />
              <p>{selectedNetwork.name}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("SELECT_A_NETWORK")}</p>
          )}
          <ChevronRight className="size-4" />
        </Button>
      </section>

      <section className="flex flex-col gap-4 px-8 py-2">
        <Label>{t("TOKEN")}</Label>
        <div className="flex flex-col gap-2">
          {selectedNetwork ? (
            selectedNetwork.tokens.map((token) => {
              const tokenBalances = getTokenBalances(token);

              return (
                <Button
                  key={`${token.symbol}-${token.address}`}
                  variant="ghost"
                  className={cn(
                    "flex h-auto items-center justify-between gap-2 border border-border px-4 py-3 hover:bg-muted/50",
                    token.symbol === selectedToken?.symbol && "bg-primary/10",
                  )}
                  onClick={() => {
                    onTokenSelect(token);
                    onClose();
                  }}>
                  <div className="flex items-center gap-4">
                    <div className="relative size-8">
                      <img
                        src={token.logo}
                        alt={token.symbol}
                        className="size-8"
                      />
                      <img
                        src={selectedNetwork.logo}
                        alt={selectedNetwork.name}
                        className="-right-1 -bottom-1 absolute size-4 rounded-sm border border-background bg-background"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <p className="font-medium text-sm">{token.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {token.symbol}
                      </p>
                    </div>
                  </div>

                  {/* Only show balance section for deposits */}
                  {bridgeType === "DEPOSIT" && (
                    <div className="text-right">
                      {tokenBalances.isLoading ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                        </div>
                      ) : isRangoBalanceError ? (
                        <div className="text-right">
                          <p className="text-destructive text-sm">Error</p>
                          <p className="text-muted-foreground text-xs">--</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {tokenBalances.balance}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Number(tokenBalances.usdBalance))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {t("SELECT_NETWORK_TO_VIEW_AVAILABLE_TOKENS")}
              </p>
            </div>
          )}
        </div>
      </section>
      {/* Only show balance error for deposits */}
      {bridgeType === "DEPOSIT" && isRangoBalanceError && (
        <div className="px-8 py-2">
          <p className="text-destructive text-sm">
            {t("FAILED_TO_LOAD_BALANCES")}: {rangoBalanceError?.message}
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface NetworkSelectorViewProps {
  onBack: () => void;
  onNetworkSelect: (network: BridgeChain) => void;
  bridgeMetadata: BridgeChain[];
  selectedNetwork: BridgeChain | null;
  bridgeType: "DEPOSIT" | "WITHDRAW";
}

function NetworkSelectorView({
  onBack,
  onNetworkSelect,
  bridgeMetadata,
  selectedNetwork,
  bridgeType,
}: NetworkSelectorViewProps) {
  const { t } = useTranslation();
  const { primaryWallet } = useSafeDynamicContext();

  // Function to check if a chain is compatible with the current wallet type
  const isChainCompatible = (chain: BridgeChain) => {
    if (bridgeType === "WITHDRAW") {
      return true;
    }

    if (!primaryWallet) {
      return false;
    }

    if (isEthereumWallet(primaryWallet) && chain.id !== "SOLANA") {
      return true;
    }

    if (isSolanaWallet(primaryWallet) && chain.id === "SOLANA") {
      return true;
    }

    return false;
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <DrawerTitle>{t("SELECT_A_NETWORK")}</DrawerTitle>
          <div className="w-6" />
        </div>
        <DrawerDescription>{t("CHOOSE_NETWORK_TO_BRIDGE")}</DrawerDescription>
      </DrawerHeader>

      <section className="flex flex-col gap-2 px-8 py-2">
        {bridgeMetadata.map((chain) => {
          const isSelected = selectedNetwork?.id === chain.id;
          const isCompatible = isChainCompatible(chain);
          return (
            <Button
              key={chain.id}
              variant="ghost"
              onClick={() => isCompatible && onNetworkSelect(chain)}
              disabled={!isCompatible}
              className={cn(
                "flex h-auto items-center justify-start gap-4 p-2",
                isSelected && "bg-primary/10",
                !isCompatible && "cursor-not-allowed opacity-50",
              )}>
              <img src={chain.logo} alt={chain.name} className="size-8" />
              <div className="flex flex-col items-start">
                <p className="font-medium">{chain.name}</p>
                <p className="text-muted-foreground text-xs">
                  {chain.tokens.length} {t("TOKENS_PLURAL_AVAILABLE")}
                  {!isCompatible &&
                    bridgeType === "DEPOSIT" &&
                    ` (${t("INCOMPATIBLE_WALLET")})`}
                </p>
              </div>
            </Button>
          );
        })}
      </section>
    </motion.div>
  );
}

export const BridgeTokenSelectorDrawer = ({
  bridgeType,
  children,
  onTokenSelect,
  onNetworkSelect,
  selectedNetwork,
  selectedToken,
}: {
  bridgeType: "DEPOSIT" | "WITHDRAW";
  children: React.ReactNode;
  selectedNetwork: BridgeChain | null;
  selectedToken: BridgeToken | null;
  onTokenSelect: (token: BridgeToken) => void;
  onNetworkSelect: (network: BridgeChain) => void;
}) => {
  const [currentView, setCurrentView] = useState<
    "tokenList" | "networkSelector"
  >("tokenList");
  const [isOpen, setIsOpen] = useState(false);

  const bridgeMetadata =
    bridgeType === "DEPOSIT" ? bridgeMetaDeposit : bridgeMetaWithdraw;

  const handleNetworkSelectClick = () => {
    setCurrentView("networkSelector");
  };

  const handleNetworkSelect = (network: BridgeChain) => {
    onNetworkSelect(network);
    setCurrentView("tokenList");
  };

  const handleBack = () => {
    setCurrentView("tokenList");
  };

  return (
    <Drawer autoFocus={true} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {currentView === "tokenList" && (
            <TokenListView
              key="token-list"
              selectedNetwork={selectedNetwork}
              selectedToken={selectedToken}
              onNetworkSelect={handleNetworkSelectClick}
              bridgeType={bridgeType}
              onTokenSelect={onTokenSelect}
              onClose={() => setIsOpen(false)}
            />
          )}
          {currentView === "networkSelector" && (
            <NetworkSelectorView
              key="network-selector"
              onBack={handleBack}
              onNetworkSelect={handleNetworkSelect}
              bridgeMetadata={bridgeMetadata}
              selectedNetwork={selectedNetwork}
              bridgeType={bridgeType}
            />
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};
