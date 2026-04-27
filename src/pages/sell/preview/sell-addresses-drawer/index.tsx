import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { SellAddressBookError } from "@/core/client/sell-address-book";
import { useSellAddressBook } from "@/hooks/use-sell-address-book";
import {
  createSellAddressFormSchema,
  type SellAddressesPage,
  type SellAddressFormData,
} from "../shared";
import { AddressFormView } from "./address-form-view";
import { AddressListView } from "./address-list-view";
import { DeleteConfirmationView } from "./delete-confirmation-view";

export function SellAddressesDrawer({
  children,
  onAddressSelected,
}: {
  children: React.ReactNode;
  onAddressSelected?: () => void;
}) {
  const { t } = useTranslation();
  const { addressBook, add, update, remove, setActive } = useSellAddressBook();
  const [page, setPage] = useState<SellAddressesPage>("list");
  const closeRef = useRef<HTMLButtonElement>(null);

  // Get current currency for form validation
  const formSchema = createSellAddressFormSchema();

  // Create form with currency-aware validation
  const form = useForm<SellAddressFormData>({
    // @ts-expect-error - zodResolver types are compatible but TypeScript has trouble with complex validation
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      address: "",
      isActive: false,
    },
  });

  const resetForm = () => {
    form.reset({
      id: undefined,
      label: "",
      address: "",
      isActive: false,
    });
  };

  const handleAddAddress = () => {
    resetForm();
    setPage("add");
  };

  const handleEditAddress = (address: {
    id: string;
    label: string;
    address: string;
  }) => {
    form.reset({
      id: address.id,
      label: address.label,
      address: address.address,
      isActive: isActiveAddress(address.id),
    });
    setPage("edit");
  };

  const handleSave = async (values: SellAddressFormData) => {
    try {
      if (page === "add") {
        const { addresses } = await add(values.label, values.address);
        const newAddressObject = addresses.find(
          (obj) => obj.address === values.address,
        );

        // At this point the operation was successful and result.data contains the new address
        if (values.isActive && newAddressObject) {
          await setActive(newAddressObject.id);
        }

        toast.success(t("ADDRESS_ADDED_SUCCESSFULLY"));
        setPage("list");

        // Notify parent if address was added and set as default
        if (values.isActive && onAddressSelected) {
          onAddressSelected();
        }
      } else if (page === "edit" && values.id) {
        const wasDefault = isActiveAddress(values.id);

        await update(values.id, {
          label: values.label,
          address: values.address,
        });

        // At this point the update was successful
        if (values.isActive !== wasDefault) {
          await setActive(values.id ?? null);

          // Notify parent if address default status changed
          if (onAddressSelected) {
            onAddressSelected();
          }
        }

        toast.success(t("ADDRESS_UPDATED_SUCCESSFULLY"));
        setPage("list");
      }
    } catch (error) {
      const err = error as SellAddressBookError;
      toast.error(t(err.code), {
        description: t(err.message),
      });
    }
  };

  const handleDelete = async () => {
    try {
      const values = form.getValues();
      if (values.id) {
        const wasDefault = isActiveAddress(values.id);
        await remove(values.id);

        toast.success(t("ADDRESS_DELETED_SUCCESSFULLY"));
        setPage("list");

        // Notify parent if the active address was deleted
        if (wasDefault && onAddressSelected) {
          onAddressSelected();
        }
      }
    } catch (error) {
      const err = error as SellAddressBookError;
      toast.error(t(err.code), {
        description: t(err.message),
      });
    }
  };

  const isActiveAddress = (addressId: string) => {
    const id = addressBook?.active?.id ?? "";
    return id === addressId;
  };

  const handleSelectAddress = async (addressId: string) => {
    // For sell address book, we don't allow selecting empty string (no built-in method)
    if (!addressId) return;

    try {
      await setActive(addressId);
    } catch (error) {
      const err = error as SellAddressBookError;
      toast.error(t(err.code), {
        description: t(err.message),
      });
      return;
    }
    toast.success(t("ACTIVE_ADDRESS_UPDATED"));

    // Notify parent component that address was selected
    if (onAddressSelected) {
      onAddressSelected();
    }

    // Close the drawer after selection
    if (closeRef.current) {
      closeRef.current.click();
    }
  };

  return (
    <Drawer autoFocus={true}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="px-6 pb-6">
        <DrawerClose ref={closeRef} className="hidden" />
        <AnimatePresence mode="wait" initial={false}>
          {page === "list" && (
            <AddressListView
              key="address-list"
              isActiveAddress={isActiveAddress}
              handleSelectAddress={handleSelectAddress}
              handleEditAddress={handleEditAddress}
              handleAddAddress={handleAddAddress}
            />
          )}
          {(page === "add" || page === "edit") && (
            <AddressFormView
              key={page === "add" ? "add-address" : "edit-address"}
              page={page}
              // @ts-expect-error - form is incompatible with SellAddressFormValues
              form={form}
              setPage={setPage}
              handleSave={handleSave}
              onDelete={() => setPage("delete")}
            />
          )}
          {page === "delete" && (
            <DeleteConfirmationView
              key="delete-confirmation"
              addressLabel={form.getValues("label")}
              onBack={() => setPage("edit")}
              onConfirm={handleDelete}
            />
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}
