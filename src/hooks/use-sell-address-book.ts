import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/settings";
import {
  addSellAddress,
  getSellAddressBook,
  removeSellAddressById,
  type SellAddress,
  setActiveSellAddressById,
  updateSellAddressById,
} from "@/core/client/sell-address-book";

/**
 * Hook for managing the sell address book
 * Currency-aware - reloads when currency changes in settings
 *
 * Provides a simple interface to load, add, update, and remove addresses
 */
export function useSellAddressBook() {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  // Query: load address book, refetch when currency changes
  const sellBookQuery = useQuery({
    queryKey: ["sellAddressBook", settings.currency.currency],
    queryFn: () => {
      const res = getSellAddressBook();
      if (res.isErr()) throw res.error;
      return res.value;
    },
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: async ({
      label,
      address,
    }: {
      label: string;
      address: string;
    }) => {
      const res = addSellAddress({ label, address });
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (book) =>
      queryClient.setQueryData(
        ["sellAddressBook", settings.currency.currency],
        book,
      ),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<SellAddress, "id">>;
    }) => {
      const res = updateSellAddressById(id, updates);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (book) =>
      queryClient.setQueryData(
        ["sellAddressBook", settings.currency.currency],
        book,
      ),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = removeSellAddressById(id);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (book) =>
      queryClient.setQueryData(
        ["sellAddressBook", settings.currency.currency],
        book,
      ),
  });

  const setActiveMutation = useMutation({
    mutationFn: async ({ id }: { id: string | null }) => {
      const res = setActiveSellAddressById(id);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (book) =>
      queryClient.setQueryData(
        ["sellAddressBook", settings.currency.currency],
        book,
      ),
  });

  return {
    isLoading: sellBookQuery.isLoading,
    error: {
      query: sellBookQuery.error,
      add: addMutation.error,
      update: updateMutation.error,
      remove: removeMutation.error,
      setActive: setActiveMutation.error,
    },
    addressBook: sellBookQuery.data,

    refresh: sellBookQuery.refetch,

    add: (label: string, address: string) =>
      addMutation.mutateAsync({ label, address }),
    update: (id: string, updates: Partial<Omit<SellAddress, "id">>) =>
      updateMutation.mutateAsync({ id, updates }),
    remove: (id: string) => removeMutation.mutateAsync({ id }),
    setActive: (id: string | null) => setActiveMutation.mutateAsync({ id }),
  };
}
