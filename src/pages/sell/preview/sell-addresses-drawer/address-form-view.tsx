import { ArrowLeftCircle, Clipboard, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PackedPaymentInput, TransferWarningAlert } from "@/components";
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
import { useSettings } from "@/contexts/settings";
import { getPaymentIdFields } from "@/lib/compound-payment-id";
import { usesCatalogPaymentForm } from "@/lib/constants";
import type { SellAddressesPage, SellAddressFormData } from "../shared";

interface AddressFormViewProps {
  page: SellAddressesPage;
  form: UseFormReturn<SellAddressFormData>;
  setPage: (page: SellAddressesPage) => void;
  handleSave: (values: SellAddressFormData) => void;
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
    settings: { currency },
  } = useSettings();

  const fields = getPaymentIdFields(currency.currency);
  const catalogForm = usesCatalogPaymentForm(currency.currency);

  const handleClipboardPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        form.setValue("address", clipboardText, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        toast.warning(t("INVALID_PAYMENT_DETAILS_FORMAT"));
      }
    } catch (err) {
      toast.error((err as Error).message);
      console.error("Clipboard error:", err);
    }
  };

  return (
    <motion.div
      key={page === "add" ? "add-address" : "edit-address"}
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full">
      <DrawerHeader className="w-full shrink-0 text-center">
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setPage("list")}>
            <ArrowLeftCircle className="size-6" />
          </Button>
          <DrawerTitle>
            {page === "add"
              ? t("ADD_ADDRESS", {
                  paymentAddressName: t(currency.paymentAddressName),
                })
              : t("EDIT_PAYMENT_ADDRESS")}
          </DrawerTitle>
          <div className="w-6" />
        </div>
      </DrawerHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-6 px-4 pb-4">
          <section
            data-vaul-no-drag
            className="max-h-[min(55dvh,calc(90dvh-14rem))] space-y-4 overflow-y-auto overscroll-contain">
            <TransferWarningAlert currency={currency.currency} />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("NAME")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("ENTER_PAYMENT_ADDRESS_LABEL")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {catalogForm ? (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(currency.paymentAddressName)}</FormLabel>
                    <FormControl>
                      <PackedPaymentInput
                        currency={currency.currency}
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(currency.paymentAddressName)}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t(fields[0].placeholder)}
                          className="pr-10"
                          {...field}
                        />
                        <div className="absolute top-0 right-0 flex h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-full"
                            onClick={
                              field.value
                                ? () =>
                                    form.setValue("address", "", {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    })
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
            )}

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
                      {t("MAKE_ACTIVE_PAYMENT_ADDRESS", {
                        paymentAddressName: t(currency.paymentAddressName),
                      })}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-col gap-2">
            <Button className="w-full p-6" type="submit">
              {t("SAVE")}
            </Button>
            {page === "edit" && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive p-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDelete}>
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
