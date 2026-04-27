import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWalletAddress,
  getWalletAddressBook,
  removeWalletAddressById,
  setActiveWalletAddressById,
  updateWalletAddressById,
  type WalletAddress,
} from "@/core/client/wallet-address-book";

/**
 * Hook for managing the wallet address book
 *
 * Provides a simple interface to load, add, update, and remove addresses
 */
export function useWalletAddressBook() {
  const queryClient = useQueryClient();

  // --- Queries --------------------------------------------------------------
  const walletBookQuery = useQuery({
    queryKey: ["walletAddressBook"],
    queryFn: () => {
      const result = getWalletAddressBook();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });

  // --- Mutations -----------------------------------------------------------
  const addMutation = useMutation({
    mutationFn: async ({
      label,
      address,
    }: {
      label: string;
      address: string;
    }) => {
      const res = addWalletAddress({ label, address });
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (newBook) =>
      queryClient.setQueryData(["walletAddressBook"], newBook),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<WalletAddress, "id">>;
    }) => {
      const res = updateWalletAddressById(id, updates);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (newBook) =>
      queryClient.setQueryData(["walletAddressBook"], newBook),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = removeWalletAddressById(id);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (newBook) =>
      queryClient.setQueryData(["walletAddressBook"], newBook),
  });

  const setActiveMutation = useMutation({
    mutationFn: async ({ id }: { id: string | null }) => {
      const res = setActiveWalletAddressById(id);
      if (res.isErr()) throw res.error;
      return res.value;
    },
    onSuccess: (newBook) =>
      queryClient.setQueryData(["walletAddressBook"], newBook),
  });

  // --- Public API ----------------------------------------------------------
  return {
    // TanStack Query flags
    isLoading: walletBookQuery.isLoading,
    error: walletBookQuery.error,

    // Data
    addressBook: walletBookQuery.data,

    // Actions (all return promises that reject with AppError on failure)
    refresh: walletBookQuery.refetch,
    add: (label: string, address: string) =>
      addMutation.mutateAsync({ label, address }),
    update: (id: string, updates: Partial<Omit<WalletAddress, "id">>) =>
      updateMutation.mutateAsync({ id, updates }),
    remove: (id: string) => removeMutation.mutateAsync({ id }),
    setActive: (id: string | null) => setActiveMutation.mutateAsync({ id }),
  };
}
