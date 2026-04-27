import { err, ok, type Result } from "neverthrow";
import { isAddress } from "viem";
import { z } from "zod";
import { STORAGE_KEYS } from "@/lib/constants";
import { type AppError, createAppError } from "@/lib/errors";
import {
  loadFromStorageWithMigrations,
  saveStrictToStorage,
} from "@/lib/storage-model";
import { safeParseWithResult } from "@/lib/zod-neverthrow";

const WalletAddressSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1, { error: "Label is required" }),
  address: z.string().refine(isAddress, {
    error: "Invalid address",
  }),
});

const AddressBookSchema = z.object({
  active: WalletAddressSchema.optional(),
  addresses: z.array(WalletAddressSchema),
});

export type WalletAddress = z.infer<typeof WalletAddressSchema>;
export type WalletAddressBook = z.infer<typeof AddressBookSchema>;
export type WalletAddressBookError = AppError<"WalletAddressBook">;

/**
 * Create an empty address book
 */
const createEmptyAddressBook = (): WalletAddressBook => ({
  active: undefined,
  addresses: [],
});

/**
 * Sorts an array of saved addresses lexically by label
 */
const sortAddressesByLabel = (addresses: WalletAddress[]): WalletAddress[] => {
  return [...addresses].sort((a, b) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
  );
};

/**
 * Gets the address book from localStorage
 */
export function getWalletAddressBook(): Result<
  WalletAddressBook,
  WalletAddressBookError
> {
  const res = loadFromStorageWithMigrations<WalletAddressBook>({
    key: STORAGE_KEYS.WALLET_ADDRESS_BOOK,
    schema: AddressBookSchema,
    getDefault: createEmptyAddressBook,
    migrate: (raw) => raw,
  });
  return res.mapErr((e) =>
    createAppError<"WalletAddressBook">(e.message, {
      domain: "WalletAddressBook",
      code: e.code,
      cause: e.cause,
      context: e.context ?? {},
    }),
  );
}

/**
 * Saves the address book to localStorage
 */
export function saveWalletAddressBook(
  addressBook: WalletAddressBook,
): Result<WalletAddressBook, WalletAddressBookError> {
  const validationResult = safeParseWithResult(
    AddressBookSchema,
    addressBook,
  ).mapErr((e: AppError<"Utils">) =>
    createAppError<"WalletAddressBook">("ValidationError", {
      domain: "WalletAddressBook",
      code: "ValidationError",
      cause: e.cause,
      context: e.context ?? { parsedData: addressBook },
    }),
  );
  if (validationResult.isErr()) return err(validationResult.error);

  const res = saveStrictToStorage<WalletAddressBook>({
    key: STORAGE_KEYS.WALLET_ADDRESS_BOOK,
    schema: AddressBookSchema,
    value: {
      ...validationResult.value,
      addresses: sortAddressesByLabel(addressBook.addresses),
    },
  });
  return res.match(
    () => ok(addressBook),
    (e) =>
      err(
        createAppError<"WalletAddressBook">(e.message, {
          domain: "WalletAddressBook",
          code: e.code,
          cause: e.cause,
          context: e.context ?? {},
        }),
      ),
  );
}

/**
 * Creates a new saved address with a generated ID
 */
export function createWalletAddress(
  label: string,
  address: string,
): Result<WalletAddress, WalletAddressBookError> {
  const newAddress = {
    id: crypto.randomUUID(),
    label,
    address,
  };

  return safeParseWithResult(WalletAddressSchema, newAddress).mapErr(
    (validationError) =>
      createAppError<"WalletAddressBook">(validationError.message, {
        domain: "WalletAddressBook",
        code: "ValidationError",
        cause: validationError.cause,
        context: {
          parsedData: newAddress,
        },
      }),
  );
}

/**
 * Finds an address by ID
 */
export function findWalletAddressById(
  id: string,
): Result<WalletAddress, WalletAddressBookError> {
  const addressBookResult = getWalletAddressBook();
  if (addressBookResult.isErr()) return err(addressBookResult.error);

  const addressBook = addressBookResult.value;
  const address = addressBook.addresses.find((addr) => addr.id === id);

  if (!address) {
    return err(
      createAppError<"WalletAddressBook">("ADDRESS_NOT_FOUND_IN_ADDRESS_BOOK", {
        domain: "WalletAddressBook",
        code: "NotFoundError",
        cause: new Error("Address not found."),
        context: { id },
      }),
    );
  }

  return ok(address);
}

/**
 * Checks if an address or label already exists
 */
export function isDuplicateWalletAddress(
  addressBook: WalletAddressBook,
  label: string,
  address: string,
  excludeId?: string,
): boolean {
  return addressBook.addresses.some(
    (addr) =>
      (addr.label === label || addr.address === address) &&
      (!excludeId || addr.id !== excludeId),
  );
}

/**
 * Adds an address to the address book
 */
export function addWalletAddress(labelOrAddress: {
  label: string;
  address: string;
}): Result<WalletAddressBook, WalletAddressBookError> {
  const addressBookResult = getWalletAddressBook();
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;
  const { label, address } = labelOrAddress;

  // Check for duplicates
  if (isDuplicateWalletAddress(addressBook, label, address)) {
    return err(
      createAppError<"WalletAddressBook">(
        "AN_ADDRESS_WITH_THIS_LABEL_OR_ADDRESS_ALREADY_EXISTS",
        {
          domain: "WalletAddressBook",
          code: "AlreadyExistsError",
          cause: new Error("Address already exists."),
          context: { label, address },
        },
      ),
    );
  }

  // Create new address with validation
  const newAddressResult = createWalletAddress(label, address);
  if (newAddressResult.isErr()) return err(newAddressResult.error);

  // Update address book and save
  return saveWalletAddressBook({
    ...addressBook,
    addresses: [...addressBook.addresses, newAddressResult.value],
  });
}

/**
 * Updates an existing address by ID
 */
export function updateWalletAddressById(
  id: string,
  updates: Partial<Omit<WalletAddress, "id">>,
): Result<WalletAddressBook, WalletAddressBookError> {
  const addressBookResult = getWalletAddressBook();
  if (addressBookResult.isErr()) return addressBookResult;
  const addressBook = addressBookResult.value;

  const addressResult = findWalletAddressById(id);
  if (addressResult.isErr()) return err(addressResult.error);
  const existingAddress = addressResult.value;

  // Merge existing address with updates to form the proposed new state
  const proposedAddressData = {
    ...existingAddress,
    ...updates,
  };

  // Validate the entire proposed new state.
  // This ensures all fields are correct according to the schema and applies any transformations
  // (e.g., trim for labels, toLowerCase for addresses) defined in SavedAddressSchema.
  const validationResult = safeParseWithResult(
    WalletAddressSchema,
    proposedAddressData,
  );

  if (validationResult.isErr()) {
    return err(
      createAppError<"WalletAddressBook">(validationResult.error.message, {
        domain: "WalletAddressBook",
        code: "ValidationError",
        cause: validationResult.error,
        context: {
          parsedData: proposedAddressData,
        },
      }),
    );
  }
  // validatedAddress contains the data after validation and potential transformations.
  const validatedAddress = validationResult.value;

  // Check for duplicates only if label or address fields were part of the update intent.
  // Use the validated (and potentially transformed) label and address for the check.
  if (updates.label !== undefined || updates.address !== undefined) {
    // Perform duplicate check using the final, validated values, excluding the current address ID.
    if (
      isDuplicateWalletAddress(
        addressBook,
        validatedAddress.label,
        validatedAddress.address,
        id, // Exclude the current address ID
      )
    ) {
      return err(
        createAppError<"WalletAddressBook">(
          "AN_ADDRESS_WITH_THIS_LABEL_OR_ADDRESS_ALREADY_EXISTS",
          {
            domain: "WalletAddressBook",
            code: "AlreadyExistsError",
            cause: new Error("Address already exists."),
            context: {
              label: validatedAddress.label,
              address: validatedAddress.address,
            },
          },
        ),
      );
    }
  }

  // Update the address in the list using the validated data
  const updatedAddresses = addressBook.addresses.map((addr) =>
    addr.id === id ? validatedAddress : addr,
  );

  // Determine the new state for the 'active' address pointer, ensuring immutability
  let newActive = addressBook.active;
  if (
    addressBook.active && // If there is a currently active address
    addressBook.active.address === existingAddress.address // And it's the one being edited
  ) {
    // Create a new active address object to maintain immutability
    newActive = validatedAddress;
  }

  // Save the updated address book
  return saveWalletAddressBook({
    ...addressBook,
    addresses: updatedAddresses,
    active: newActive,
  });
}

/**
 * Removes an address by ID
 */
export function removeWalletAddressById(
  id: string,
): Result<WalletAddressBook, WalletAddressBookError> {
  const addressBookResult = getWalletAddressBook();
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;
  const addressResult = findWalletAddressById(id);
  if (addressResult.isErr()) return err(addressResult.error);

  const addressToRemove = addressResult.value;
  const updatedAddresses = addressBook.addresses.filter(
    (addr) => addr.id !== id,
  );

  // If default was removed, reset to in-app wallet
  let newDefault = addressBook.active;
  if (addressToRemove.address === addressBook.active?.address) {
    newDefault = undefined;
  }

  // Save updated address book
  return saveWalletAddressBook({
    ...addressBook,
    addresses: updatedAddresses,
    active: newDefault,
  });
}

/**
 * Sets the active address by ID or uses in-app wallet if id is null/undefined
 */
export function setActiveWalletAddressById(
  id?: string | null,
): Result<WalletAddressBook, WalletAddressBookError> {
  const addressBookResult = getWalletAddressBook();
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;

  // If no ID is provided, use the in-app wallet as default
  if (!id) {
    return saveWalletAddressBook({
      ...addressBook,
      active: undefined,
    });
  }

  // Otherwise, find the address by ID and set it as default
  const addressResult = findWalletAddressById(id);
  if (addressResult.isErr()) return err(addressResult.error);

  // Save updated address book with new default
  return saveWalletAddressBook({
    ...addressBook,
    active: addressResult.value,
  });
}
