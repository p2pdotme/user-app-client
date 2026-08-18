import { Edit, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/contexts/settings";
import { useSellAddressBook } from "@/hooks/use-sell-address-book";
import { formatPaymentIdPreview } from "@/lib/compound-payment-id";
import { cn } from "@/lib/utils";
import { getAvatarContent } from "../shared";

interface AddressListViewProps {
  isActiveAddress: (id: string) => boolean;
  handleSelectAddress: (id: string) => void;
  handleEditAddress: (address: {
    id: string;
    label: string;
    address: string;
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
  const {
    settings: { currency },
  } = useSettings();
  const { addressBook, isLoading } = useSellAddressBook();

  const hasAddresses =
    addressBook?.addresses && addressBook.addresses.length > 0;

  return (
    <motion.div
      key="address-list"
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex w-full flex-col overflow-hidden">
      <DrawerHeader className="shrink-0 text-center">
        <DrawerTitle>
          {t("SAVED_ADDRESSES", {
            paymentAddressName: t(currency.paymentAddressName),
          })}
        </DrawerTitle>
        <DrawerDescription>
          {t("SELECT_ADDRESS_FOR_SELL_ORDER")}
        </DrawerDescription>
      </DrawerHeader>
      <section
        data-vaul-no-drag
        className="my-4 flex max-h-[50dvh] flex-col overflow-y-auto overscroll-contain p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : hasAddresses ? (
          addressBook.addresses.map((address, index) => (
            <div key={address.id}>
              {index > 0 && <Separator className="my-2" />}
              <div
                className={cn(
                  "flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50",
                  isActiveAddress(address.id) ? "bg-primary/15" : "",
                )}>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                  onClick={() => handleSelectAddress(address.id)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="font-medium text-primary text-sm">
                      {getAvatarContent(address.label)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{address.label}</p>
                    </div>
                    <p className="max-w-[14rem] truncate font-light text-muted-foreground text-xs">
                      {formatPaymentIdPreview(
                        address.address,
                        currency.currency,
                        {
                          peruQr: t("YAPE_PLIN_CCI_DETAILS"),
                          venQr: t("PAGO_MOVIL_QR_DETAILS"),
                        },
                      )}
                    </p>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditAddress(address)}>
                  <Edit className="size-4 text-primary" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Plus className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-medium text-lg">
              {t("NO_ADDRESSES_SAVED", {
                paymentAddressName: t(currency.paymentAddressName),
              })}
            </h3>
            <p className="mb-6 max-w-xs text-muted-foreground text-sm">
              {t("ADD_ADDRESS_DESCRIPTION", {
                paymentAddressName: t(currency.paymentAddressName),
              })}
            </p>
          </div>
        )}
      </section>
      <div className="shrink-0">
        <Button className="w-full p-6" onClick={handleAddAddress}>
          {t("ADD_ADDRESS", {
            paymentAddressName: t(currency.paymentAddressName),
          })}
        </Button>
        <DrawerClose className="mt-2 w-full">
          <div className="w-full rounded-md border border-primary p-2">
            <p className="text-center text-primary">{t("CLOSE")}</p>
          </div>
        </DrawerClose>
      </div>
    </motion.div>
  );
}
