import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { getSettings } from "@/core/client/settings";
import { STORAGE_KEYS } from "@/lib/constants";
import { type AppError, createAppError } from "@/lib/errors";
import {
  deepMergeDefaults,
  loadFromStorageWithMigrations,
  pruneUnknownUsingTemplate,
  saveStrictToStorage,
} from "@/lib/storage-model";
import { validatePaymentAddress } from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";

function migrateSellAddressBookContainer(
  raw: unknown,
  currency: string,
): unknown {
  if (!raw) return raw;
  if (typeof raw !== "object") return raw;

  const obj = raw as Record<string, unknown>;
  const looksLikeMap = Object.values(obj).some(
    (v) =>
      v &&
      typeof v === "object" &&
      "addresses" in (v as Record<string, unknown>),
  );
  if (looksLikeMap) return obj;
  if ("addresses" in obj || "active" in obj) {
    return { [currency]: obj };
  }
  return raw;
}

/**
 * Address schema validating the payment ID against `currencyOverride` when
 * given (e.g. an existing order's currency), else the app's current currency.
 */
const createSellAddressSchema = (currencyOverride?: string) =>
  z.object({
    id: z.uuid(),
    label: z.string().min(1, { error: "LABEL_IS_REQUIRED" }),
    address: z
      .string()
      .min(1, { error: "PAYMENT_DETAILS_ARE_REQUIRED" })
      .refine(
        (val) => {
          if (currencyOverride) {
            return validatePaymentAddress(val, currencyOverride);
          }
          // Get current currency for validation
          const settingsResult = getSettings();
          if (settingsResult.isErr()) return true; // Skip validation if settings error

          const currency = settingsResult.value.currency.currency;
          return validatePaymentAddress(val, currency);
        },
        {
          error: "INVALID_PAYMENT_DETAILS_FORMAT",
        },
      ),
  });

const createSellAddressBookSchema = (currencyOverride?: string) => {
  const address = createSellAddressSchema(currencyOverride);
  return z.object({
    active: address.optional(),
    addresses: z.array(address),
  });
};

export type SellAddress = z.infer<ReturnType<typeof createSellAddressSchema>>;
export type SellAddressBook = z.infer<
  ReturnType<typeof createSellAddressBookSchema>
>;
export type SellAddressBookError = AppError<"SellAddressBook">;

const createEmptySellAddressBook = (): SellAddressBook => ({
  active: undefined,
  addresses: [],
});

/**
 * The address book is stored per currency. Defaults to the app's current
 * currency; callers acting on an existing order pass the order's currency.
 */
function resolveCurrency(
  currencyOverride?: string,
): Result<string, SellAddressBookError> {
  if (currencyOverride) return ok(currencyOverride);
  const settingsResult = getSettings();
  if (settingsResult.isErr()) {
    return err(
      createAppError<"SellAddressBook">(
        "FAILED_TO_GET_CURRENCY_SETTINGS_FOR_SELL_ADDRESS_BOOK_FROM_STORAGE",
        {
          domain: "SellAddressBook",
          code: "StorageError",
          cause: settingsResult.error,
          context: {
            storageKey: STORAGE_KEYS.SETTINGS,
          },
        },
      ),
    );
  }
  return ok(settingsResult.value.currency.currency);
}

/**
 * Sorts an array of saved addresses lexically by label
 */
const sortAddressesByLabel = (addresses: SellAddress[]): SellAddress[] => {
  return [...addresses].sort((a, b) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
  );
};

/**
 * Gets the address book from localStorage for current currency
 */
export function getSellAddressBook(
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const currencyResult = resolveCurrency(currencyOverride);
  if (currencyResult.isErr()) return err(currencyResult.error);
  const currency = currencyResult.value;

  const migrateSellAddressBook = (raw: unknown): unknown =>
    migrateSellAddressBookContainer(raw, currency);

  const res = loadFromStorageWithMigrations<Record<string, unknown>>({
    key: STORAGE_KEYS.SELL_ADDRESS_BOOK,
    schema: z.record(z.string(), z.unknown()),
    getDefault: () => ({}),
    migrate: migrateSellAddressBook,
    prune: false,
  }).andThen((map) => {
    const entry = (map as Record<string, unknown>)[currency];
    if (!entry) return ok(createEmptySellAddressBook());
    const merged = deepMergeDefaults(createEmptySellAddressBook(), entry);
    const pruned = pruneUnknownUsingTemplate(
      merged,
      createEmptySellAddressBook(),
    );
    const v = safeParseWithResult(
      createSellAddressBookSchema(currency),
      pruned,
    );
    return v.match(
      (value) => ok<SellAddressBook, never>(value),
      () => ok<SellAddressBook, never>(createEmptySellAddressBook()),
    );
  });

  // Narrow the Result<..., AppError<"Utils">> to our domain by mapping the error
  return res.mapErr((e: AppError<"Utils">) =>
    createAppError<"SellAddressBook">(e.message, {
      domain: "SellAddressBook",
      code: e.code,
      cause: e.cause,
      context: e.context ?? {},
    }),
  );
}

/**
 * Saves the address book to localStorage for current currency
 */
export function saveSellAddressBook(
  addressBook: SellAddressBook,
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const currencyResult = resolveCurrency(currencyOverride);
  if (currencyResult.isErr()) return err(currencyResult.error);
  const currency = currencyResult.value;

  const validationResult = safeParseWithResult(
    createSellAddressBookSchema(currency),
    addressBook,
  ).mapErr((e: AppError<"Utils">) =>
    createAppError<"SellAddressBook">("ValidationError", {
      domain: "SellAddressBook",
      code: "ValidationError",
      cause: e.cause,
      context: e.context ?? { parsedData: addressBook },
    }),
  );
  if (validationResult.isErr()) return err(validationResult.error);

  // load base map leniently, then write only the current currency entry
  // Load the full container without pruning (to preserve other currency entries)
  const base = loadFromStorageWithMigrations<Record<string, unknown>>({
    key: STORAGE_KEYS.SELL_ADDRESS_BOOK,
    schema: z.record(z.string(), z.unknown()),
    getDefault: () => ({}),
    migrate: (raw) => migrateSellAddressBookContainer(raw, currency),
    prune: false,
  }).unwrapOr({});

  const next = {
    ...base,
    [currency]: {
      ...validationResult.value,
      addresses: sortAddressesByLabel(addressBook.addresses),
    },
  } as Record<string, unknown>;

  const res = saveStrictToStorage({
    key: STORAGE_KEYS.SELL_ADDRESS_BOOK,
    schema: z.record(z.string(), z.unknown()),
    value: next,
  });

  return res.match(
    () => ok(addressBook),
    (e) =>
      err(
        createAppError<"SellAddressBook">(e.message, {
          domain: "SellAddressBook",
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
export function createSellAddress(
  label: string,
  address: string,
  currencyOverride?: string,
): Result<SellAddress, SellAddressBookError> {
  const newAddress = {
    id: crypto.randomUUID(),
    label,
    address,
  };

  return safeParseWithResult(
    createSellAddressSchema(currencyOverride),
    newAddress,
  ).mapErr((validationError) =>
    createAppError<"SellAddressBook">(validationError.message, {
      domain: "SellAddressBook",
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
export function findSellAddressById(
  id: string,
  currencyOverride?: string,
): Result<SellAddress, SellAddressBookError> {
  const addressBookResult = getSellAddressBook(currencyOverride);
  if (addressBookResult.isErr()) return err(addressBookResult.error);

  const addressBook = addressBookResult.value;
  const address = addressBook.addresses.find((addr) => addr.id === id);

  if (!address) {
    return err(
      createAppError<"SellAddressBook">(
        "ADDRESS_NOT_FOUND_IN_SELL_ADDRESS_BOOK",
        {
          domain: "SellAddressBook",
          code: "NotFoundError",
          cause: new Error("Address not found."),
          context: { id },
        },
      ),
    );
  }

  return ok(address);
}

/**
 * Checks if an address or label already exists
 */
export function isDuplicateSellAddress(
  addressBook: SellAddressBook,
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
export function addSellAddress(
  labelOrAddress: {
    label: string;
    address: string;
  },
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const addressBookResult = getSellAddressBook(currencyOverride);
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;
  const { label, address } = labelOrAddress;

  // Check for duplicates
  if (isDuplicateSellAddress(addressBook, label, address)) {
    return err(
      createAppError<"SellAddressBook">(
        "AN_ADDRESS_WITH_THIS_LABEL_OR_ADDRESS_ALREADY_EXISTS",
        {
          domain: "SellAddressBook",
          code: "AlreadyExistsError",
          cause: new Error("Address already exists."),
          context: { label, address, addressBook },
        },
      ),
    );
  }

  // Create new address with validation
  const newAddressResult = createSellAddress(label, address, currencyOverride);
  if (newAddressResult.isErr()) return err(newAddressResult.error);

  // Update address book and save
  return saveSellAddressBook(
    {
      ...addressBook,
      addresses: [...addressBook.addresses, newAddressResult.value],
    },
    currencyOverride,
  );
}

/**
 * Updates an existing address by ID
 */
export function updateSellAddressById(
  id: string,
  updates: Partial<Omit<SellAddress, "id">>,
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const addressBookResult = getSellAddressBook(currencyOverride);
  if (addressBookResult.isErr()) return addressBookResult;
  const addressBook = addressBookResult.value;

  const addressResult = findSellAddressById(id, currencyOverride);
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
    createSellAddressSchema(currencyOverride),
    proposedAddressData,
  );

  if (validationResult.isErr()) {
    return err(
      createAppError<"SellAddressBook">(validationResult.error.message, {
        domain: "SellAddressBook",
        code: "ValidationError",
        cause: validationResult.error.cause,
        context: { parsedData: proposedAddressData },
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
      isDuplicateSellAddress(
        addressBook,
        validatedAddress.label,
        validatedAddress.address,
        id, // Exclude the current address ID
      )
    ) {
      return err(
        createAppError<"SellAddressBook">(
          "AN_ADDRESS_WITH_THIS_LABEL_OR_ADDRESS_ALREADY_EXISTS",
          {
            domain: "SellAddressBook",
            code: "AlreadyExistsError",
            cause: new Error("Address already exists."),
            context: {
              label: validatedAddress.label,
              address: validatedAddress.address,
              addressBook,
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
  return saveSellAddressBook(
    {
      ...addressBook,
      addresses: updatedAddresses,
      active: newActive,
    },
    currencyOverride,
  );
}

/**
 * Removes an address by ID
 */
export function removeSellAddressById(
  id: string,
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const addressBookResult = getSellAddressBook(currencyOverride);
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;
  const addressResult = findSellAddressById(id, currencyOverride);
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
  return saveSellAddressBook(
    {
      ...addressBook,
      addresses: updatedAddresses,
      active: newDefault,
    },
    currencyOverride,
  );
}

/**
 * Sets the active address by ID or uses in-app wallet if id is null/undefined
 */
export function setActiveSellAddressById(
  id?: string | null,
  currencyOverride?: string,
): Result<SellAddressBook, SellAddressBookError> {
  const addressBookResult = getSellAddressBook(currencyOverride);
  if (addressBookResult.isErr()) return addressBookResult;

  const addressBook = addressBookResult.value;

  // If no ID is provided, use the in-app wallet as default
  if (!id) {
    return saveSellAddressBook(
      {
        ...addressBook,
        active: undefined,
      },
      currencyOverride,
    );
  }

  // Otherwise, find the address by ID and set it as default
  const addressResult = findSellAddressById(id, currencyOverride);
  if (addressResult.isErr()) return err(addressResult.error);

  // Save updated address book with new default
  return saveSellAddressBook(
    {
      ...addressBook,
      active: addressResult.value,
    },
    currencyOverride,
  );
}
