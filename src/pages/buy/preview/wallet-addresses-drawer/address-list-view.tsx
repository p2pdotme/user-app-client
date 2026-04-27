import { Edit, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";
import ASSETS from "@/assets";
import { Button, Button as ShadButton } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useThirdweb, useWalletAddressBook } from "@/hooks";
import { cn, truncateAddress } from "@/lib/utils";
import { getAvatarContent } from "../shared";

interface AddressListViewProps {
  isActiveAddress: (id: string) => boolean;
  handleSelectAddress: (id: string) => void;
  handleEditAddress: (address: {
    id: string;
    label: string;
    address: Address;
  }) => void;
  handleAddAddress: () => void;
}

export function AddressListView({
  isActiveAddress,
  handleSelectAddress,
  handleEditAddress,
  handleAddAddress,
}: AddressListViewProps) {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { addressBook, isLoading } = useWalletAddressBook();

  return (
    <motion.div
      key="address-list"
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout>
      <DrawerHeader className="text-center">
        <DrawerTitle>{t("SAVED_WALLET_ADDRESSES")}</DrawerTitle>
        <DrawerDescription>
          {t("SELECT_ADDRESS_FOR_BUY_ORDER")}
        </DrawerDescription>
      </DrawerHeader>
      <section className="my-4 flex flex-col p-2">
        {/* P2P.me wallet (built-in) */}
        <ShadButton
          type="button"
          variant="ghost"
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50",
            isActiveAddress("") ? "bg-primary/15" : "",
          )}
          onClick={() => handleSelectAddress("")}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <ASSETS.ICONS.Logo className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="bg-linear-to-b from-primary to-primary/70 bg-clip-text font-bold text-sm text-transparent">
                  {t("P2P_ME_WALLET")}
                </p>
              </div>
              <p className="font-light text-muted-foreground text-xs">
                {account?.address
                  ? truncateAddress(account.address, 10)
                  : "..."}
              </p>
            </div>
          </div>
        </ShadButton>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          addressBook?.addresses?.map((address) => (
            <div key={address.id}>
              <Separator className="my-2" />
              <ShadButton
                type="button"
                variant="ghost"
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50",
                  isActiveAddress(address.id) ? "bg-primary/15" : "",
                )}
                onClick={() => handleSelectAddress(address.id)}>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <span className="font-medium text-primary text-sm">
                      {getAvatarContent(address.label)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{address.label}</p>
                    </div>
                    <p className="font-light text-muted-foreground text-xs">
                      {truncateAddress(address.address)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAddress(address);
                  }}>
                  <Edit className="size-4 text-primary" />
                </Button>
              </ShadButton>
            </div>
          ))
        )}
      </section>
      <Button className="w-full p-6" onClick={handleAddAddress}>
        {t("ADD_NEW_ADDRESS")}
      </Button>
      <DrawerClose className="mt-2 w-full">
        <div className="w-full rounded-md border border-primary p-2">
          <p className="text-center text-primary">{t("CLOSE")}</p>
        </div>
      </DrawerClose>
    </motion.div>
  );
}
