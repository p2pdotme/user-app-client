# P2P.me Application Architecture

A comprehensive guide to the P2P.me React PWA architecture, demonstrating clean separation of concerns through a layered approach that enables maintainable, testable, and potentially extractable core functionality.

## Overview

The P2P.me application follows a strict layered architecture that separates blockchain protocol logic from UI concerns, enabling clean data flow and potential future extraction of the core protocol as an npm package.

## Related Documentation

- **[Sound Integration Guide](./sound-integration-guide.md)** - Comprehensive documentation for the sound feedback system
- **[Sound System Summary](./sound-system-summary.md)** - Quick reference for sound patterns and integration
- **[Haptic Feedback System](./haptic-feedback-system.md)** - Comprehensive haptic feedback documentation
- **[Haptic Integration Guide](./haptic-integration-guide.md)** - Complete haptic integration patterns and examples
- **[Error Handling Architecture](./error-handling-architecture.md)** - Type-safe error handling across the application

## Architecture Layers

The P2P.me application follows a strict layered architecture with clear data flow and separation of concerns:

## Layer Breakdown

### 1. Core Protocol Layer (`@/core/p2pdotme`)

**Purpose**: Pure blockchain protocol logic, completely UI-agnostic.

**Structure**:

```
src/core/p2pdotme/
├── contracts/
│   ├── abis/              # Contract ABIs and addresses
│   │   ├── diamond.ts     # Main diamond contract ABI
│   │   ├── order-flow-facet.ts      # Order flow functions ABI
│   │   ├── order-processor-facet.ts # Order processing functions ABI
│   │   ├── p2p-config-facet.ts      # Configuration functions ABI
│   │   ├── reputation-manager.ts    # Reputation system ABI
│   │   └── index.ts       # Combined ABIs & contract addresses
│   ├── order/             # Order-related contract preparation functions
│   ├── p2p-config/        # Configuration contract preparation functions
│   ├── reputation-manager/ # Reputation system preparation functions
│   ├── usdc/              # USDC token contract preparation functions
│   └── index.ts
├── shared/
│   ├── errors.ts          # P2P-specific error types
│   ├── validation.ts      # Zod schemas and validation functions
│   └── index.ts
├── subgraph/              # Currently empty - future subgraph integration
│   └── index.ts
└── index.ts
```

**Responsibilities**:

- Contract interaction preparation functions (prepareArgs/prepareTx)
- Parameter validation using comprehensive Zod schemas
- Error handling with typed `P2PError<Domain>`
- Pure functions that return `Result<T, P2PError>`

**Key Pattern - Read Operations**:

```typescript
export function prepareGetUSDCBalanceArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.EXTERNAL.USDC;
    functionName: "balanceOf";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUSDCBalanceParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.USDC,
      abi: ABIS.EXTERNAL.USDC,
      functionName: "balanceOf" as const,
      args: [validatedParams.address],
    }),
  );
}
```

**Key Pattern - Write Operations**:

```typescript
export function prepareUSDCTransferTx(
  params: USDCTransferParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodUSDCTransferParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.USDC,
          data: encodeFunctionData({
            abi: ABIS.EXTERNAL.USDC,
            functionName: "transfer",
            args: [validatedParams.address, validatedParams.amount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare USDC transfer transaction", {
            domain: "usdc",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: { operation: "prepareUSDCTransferTx", params },
          }),
      )(),
  );
}
```

**Implemented Contract Modules**:

- **Order Module**: 32 functions including `placeOrder`, `acceptOrder`, `completeOrder`, `getUserBuyLimit`, etc.
- **USDC Module**: 4 functions including `getUSDCBalance`, `getUSDCAllowance`, `transferUSDC`, `approveUSDC`
- **P2P Config Module**: 2 functions including `getPriceConfig`, `getProcessingTime`
- **Reputation Manager Module**: 29 functions for reputation and verification management

**NPM Package Potential**: This layer is completely independent and could be extracted as `@p2pdotme/core`.

### 2. Client Layer (`@/core/client`)

**Purpose**: Application-specific client-side data management.

**Structure**:

```
src/core/client/
├── settings.ts           # User settings and preferences with currency/language
├── user.ts              # User session management
├── wallet-address-book.ts # Saved wallet addresses with CRUD operations
├── sell-address-book.ts  # Saved payment addresses (currency-specific)
└── index.ts
```

**Responsibilities**:

- Local storage management with error handling
- User preferences (currency, language, theme, haptics, sounds)
- Currency-specific address book management
- Client-side validation with Zod schemas

**Key Pattern**:

```typescript
export function getSettings(): Result<Settings, SettingsError> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (!data) {
      return ok(createDefaultSettings());
    }

    const parsedData = JSON.parse(data);
    return safeParseWithResult(SettingsSchema, parsedData).mapErr(
      (validationError) =>
        createAppError<"Settings">("SETTINGS_IS_INVALID", {
          domain: "Settings",
          code: "ValidationError",
          cause: validationError.cause,
          context: { parsedData },
        }),
    );
  } catch (error) {
    return err(
      createAppError<"Settings">("FAILED_TO_LOAD_SETTINGS_FROM_STORAGE", {
        domain: "Settings",
        code: "StorageError",
        cause: error,
        context: { storageKey: STORAGE_KEYS.SETTINGS },
      }),
    );
  }
}
```

**Implemented Features**:

- **Settings**: Complete settings management with themes, currencies (INR/IDR/BRL), languages, haptics/sounds
- **Wallet Address Book**: Full CRUD operations for saved wallet addresses
- **Sell Address Book**: Currency-specific payment address management
- **User Management**: Basic user session functions

### 3. Adapter Layer (`@/core/adapters/wallet/thirdweb`)

**Purpose**: Bridge between protocol layer and Thirdweb wallet integration.

**Structure**:

```
src/core/adapters/wallet/thirdweb/
├── actions/
│   ├── order.ts    # Order operations (read & write)
│   ├── usdc.ts     # USDC operations
│   ├── p2p-config.ts # Config operations
│   └── index.ts
├── client.ts       # Thirdweb client with gas estimation
├── chain.ts        # Multi-chain support (Base, Base Sepolia, Hardhat)
└── index.ts
```

**Responsibilities**:

- Execute protocol transactions via Thirdweb
- Transform external errors to application errors
- Gas estimation and transaction optimization with 2x buffer
- Multi-chain configuration (Base, Base Sepolia, Hardhat)
- Viem public client integration for read operations

**Key Pattern - Read Operations**:

```typescript
export function getTxLimit(params: {
  address: Address;
  currency: "INR" | "IDR" | "BRL";
}) {
  return prepareGetTxLimitArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read tx limit from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}
```

**Key Pattern - Write Operations**:

```typescript
export const placeOrder = (
  params: PlaceOrderParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return preparePlaceOrderTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to sendAndConfirm placeOrder transaction",
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};
```

**Implemented Actions**:

- **Order Actions**: All 32 order functions (13 read, 19 write operations)
- **USDC Actions**: Balance, allowance, transfer, approve operations
- **P2P Config Actions**: Price config and processing time operations

### 4. Hook Layer (Custom React Hooks)

**Purpose**: Reusable React hooks for common patterns.

**Current Implementation**:
Located in `src/hooks/` directory with hooks like:

- `useWalletAddressBook()` - Manage wallet addresses
- `useSellAddressBook()` - Manage payment addresses
- `useThirdweb()` - Thirdweb integration helpers
- `useHaptics()` - Haptic feedback integration

**Pattern**:

```typescript
export function useWalletAddressBook() {
  return useQuery({
    queryKey: ["wallet-address-book"],
    queryFn: async () => {
      const result = getWalletAddressBook();
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    },
    staleTime: Infinity, // Local storage doesn't change externally
  });
}
```

### 5. UI Layer (React Components + TanStack Query)

**Purpose**: User interface with declarative data fetching and state management.

**Current Implementation**: Full PWA with pages for:

- Buy/Sell orders with preview screens
- Deposit/Withdraw flows
- Transaction history
- Settings management
- Help system with FAQ
- User limits and verification

**Pattern - Direct TanStack Query Integration**:

```typescript
function USDCBalanceComponent({ address }: Props) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["usdc-balance", address],
    queryFn: async () => {
      const result = await getUSDCBalance(address);

      if (result.isErr()) {
        throw result.error; // TanStack Query handles thrown errors
      }

      return result.value;
    },
    enabled: !!address,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Custom retry logic based on error type
      if (error.domain === "ThirdwebAdapter" &&
          error.code === "TWEstimateGasError") {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
  });

  if (isLoading) return <Skeleton className="h-8 w-24" />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;

  return <div>{formatUSDC(data)} USDC</div>;
}
```

## Data Flow Patterns

### Query Flow (Read Operations)

1. **UI Component** calls TanStack Query hook
2. **Hook** calls appropriate **Adapter Action** (e.g., `getTxLimit`)
3. **Adapter** calls **Core Protocol** prepare function (e.g., `prepareGetTxLimitArgs`)
4. **Core Protocol** validates params with Zod schema and returns contract call config
5. **Adapter** executes read via Viem public client
6. **Result** flows back through layers with proper error transformation

### Mutation Flow (Write Operations)

1. **UI Component** calls TanStack Mutation
2. **Mutation** calls **Adapter Action** (e.g., `placeOrder`)
3. **Adapter** calls **Core Protocol** prepare function (e.g., `preparePlaceOrderTx`)
4. **Core Protocol** validates params and returns transaction data
5. **Adapter** estimates gas and executes via Thirdweb `sendAndConfirmTransaction`
6. **Transaction Receipt** flows back with error handling at each layer

### Local Data Flow (Settings/Address Books)

For local data operations, the flow bypasses blockchain layers:

1. **UI Component** calls custom hook (e.g., `useSettings`)
2. **Hook** calls **Client Layer** function (e.g., `getSettings`)
3. **Client** reads from localStorage with validation
4. **Result** flows back with proper error handling

## Error Handling Strategy

Comprehensive error handling system with domain-specific error types:

### Error Type Hierarchy

```typescript
// Core protocol errors (5 domains)
type P2PErrorDomain =
  | "usdc"
  | "p2p-config"
  | "order"
  | "reputation-manager"
  | "validation";

type P2PError<D extends P2PErrorDomain> = {
  domain: D;
  code: P2PErrorCode;
  message: string;
  cause?: unknown;
  context?: Record<string, unknown>;
};

// Adapter-specific errors
type ThirdwebAdapterError = AppError<"ThirdwebAdapter">;

// Client-specific errors
type SettingsError = AppError<"Settings">;
type WalletAddressBookError = AppError<"WalletAddressBook">;
type SellAddressBookError = AppError<"SellAddressBook">;
```

### Error Transformation Pattern

Each layer transforms errors appropriately:

- **Core Protocol**: Validation errors → `P2PError<"validation">`
- **Adapter**: Network/wallet errors → `ThirdwebAdapterError`
- **Client**: Storage errors → Domain-specific `AppError`
- **UI**: All errors → User-friendly messages via error mapping

## Benefits of This Architecture

### 1. **Complete Separation of Concerns**

- Protocol logic (63 functions) independent of UI
- Adapter layer isolates Thirdweb dependencies
- Client layer manages all local state separately

### 2. **Comprehensive Type Safety**

- End-to-end type safety with Result types
- 50+ Zod schemas ensure runtime validation
- Domain-specific typed errors with context

### 3. **Production-Ready Error Handling**

- Structured error hierarchy across 8+ domains
- Context preservation for debugging
- User-friendly error mapping

### 4. **High Reusability**

- Core protocol layer ready for npm extraction
- Multi-chain adapter support implemented
- Comprehensive address book system

### 5. **Excellent Maintainability**

- Clear boundaries between all layers
- Consistent patterns across 63 contract functions
- Functional programming with Result types

## Current Implementation Status

### ✅ Fully Implemented

- **Core Protocol Layer**: 63 contract functions across 4 modules
- **Client Layer**: Settings, address books, user management
- **Adapter Layer**: Complete Thirdweb integration with gas optimization
- **Error Handling**: Comprehensive error system with 8+ domains
- **UI Layer**: Full PWA with buy/sell flows, settings, transactions

### 🔄 In Progress / Planned

- **Subgraph Integration**: Directory exists but empty
- **Multi-Adapter Support**: Architecture ready, only Thirdweb implemented
- **NPM Package Extraction**: Core layer designed for extraction

## Getting Started

### 1. **Core Protocol Usage**

```typescript
import { prepareGetUSDCBalanceArgs } from "@/core/p2pdotme";

const result = prepareGetUSDCBalanceArgs({ address: "0x..." });
if (result.isOk()) {
  const { to, abi, functionName, args } = result.value;
  // Use for contract read call
}
```

### 2. **Adapter Integration**

```typescript
import { getUSDCBalance } from "@/core/adapters/wallet/thirdweb";

const balance = await getUSDCBalance("0x...");
balance.match(
  (amount) => console.log("Balance:", amount),
  (error) => console.error("Error:", error),
);
```

### 3. **UI Integration**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getUSDCBalance } from "@/core/adapters/wallet/thirdweb";

function MyComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["usdc-balance", address],
    queryFn: () => getUSDCBalance(address),
  });

  // Render UI...
}
```

This architecture provides a robust, type-safe, and maintainable foundation for the P2P.me platform with clear separation of concerns and potential for future npm package extraction.
