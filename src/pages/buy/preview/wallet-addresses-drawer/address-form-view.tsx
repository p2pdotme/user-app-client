import { ArrowLeftCircle, Clipboard, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isAddress } from "viem";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useHapticInteractions } from "@/hooks";
import type { WalletAddressesPage, WalletAddressFormData } from "../shared";

interface AddressFormViewProps {
  page: WalletAddressesPage;
  form: UseFormReturn<WalletAddressFormData>;
  setPage: (page: WalletAddressesPage) => void;
  handleSave: (values: WalletAddressFormData) => void;
  onDelete: () => void;
}

export function AddressFormView({
  page,
  form,
  setPage,
  handleSave,
  onDelete,
}: AddressFormViewProps) {
  const { t } = useTranslation();
  const {
    onNavigate,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerTapHaptic,
  } = useHapticInteractions();

  const handleClipboardPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isAddress(clipboardText)) {
        form.setValue("address", clipboardText, {
          shouldValidate: true,
          shouldDirty: true,
        });
        triggerSuccessHaptic(); // Success haptic for successful paste
      } else {
        triggerErrorHaptic(); // Error haptic for invalid address
        toast.warning(t("INVALID_WALLET_ADDRESS_FORMAT"));
      }
    } catch (err) {
      triggerErrorHaptic(); // Error haptic for clipboard error
      toast.error((err as Error).message);
      console.error("Clipboard error:", err);
    }
  };

  const handleClearAddress = () => {
    triggerTapHaptic(); // Tap haptic for clear action
    form.setValue("address", "" as `0x${string}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleBackNavigation = () => {
    onNavigate(); // Navigation haptic
    setPage("list");
  };

  const handleSaveWithHaptic = (values: WalletAddressFormData) => {
    try {
      handleSave(values);
      // Note: Success haptic will be handled by the Button component with hapticType="success"
    } catch (error) {
      triggerErrorHaptic(); // Error haptic for save failure
      throw error; // Re-throw to maintain error handling
    }
  };

  const handleDeleteWithHaptic = () => {
    try {
      onDelete();
      // Note: Warning haptic will be handled by the Button component with hapticType="warning"
    } catch (error) {
      triggerErrorHaptic(); // Error haptic for delete failure
      throw error; // Re-throw to maintain error handling
    }
  };

  return (
    <motion.div
      key={page === "add" ? "add-address" : "edit-address"}
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      layout
      className="w-full">
      <DrawerHeader className="w-full text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBackNavigation}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <DrawerTitle>
            {page === "add" ? t("ADD_NEW_WALLET") : t("EDIT_WALLET")}
          </DrawerTitle>
          <div className="w-6" />
        </div>
      </DrawerHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveWithHaptic)}
          className="space-y-6 px-4">
          <section className="space-y-4">
            <div className="rounded-md bg-primary/10 p-4">
              <div className="flex w-full items-center justify-between">
                <p className="font-medium text-sm">{t("NETWORK")}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full border-3 border-background bg-background">
                    <ASSETS.ICONS.NetworkBase />
                  </div>
                  <p className="font-medium text-sm">BASE</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("NAME")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("ENTER_WALLET_NAME")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("WALLET_ADDRESS")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="0x..." className="pr-10" {...field} />
                      <div className="absolute top-0 right-0 flex h-full">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-full"
                          onClick={
                            field.value
                              ? handleClearAddress
                              : handleClipboardPaste
                          }>
                          {field.value ? (
                            <X className="size-4 text-primary" />
                          ) : (
                            <Clipboard className="size-4 text-primary" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-sm">
                      {t("MAKE_ACTIVE_RECEIVING_WALLET")}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-col gap-2">
            <Button
              hapticType="success" // Success haptic for save action
              onClick={form.handleSubmit(handleSaveWithHaptic)}
              className="w-full p-6">
              {t("SAVE")}
            </Button>
            {page === "edit" && (
              <Button
                type="button"
                variant="outline"
                hapticType="warning" // Warning haptic for destructive action
                className="w-full border-destructive p-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteWithHaptic}>
                <Trash2 className="mr-2 size-4" />
                {t("DELETE_ADDRESS")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
