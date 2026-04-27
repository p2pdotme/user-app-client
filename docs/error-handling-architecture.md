# Error Handling Architecture

A comprehensive, type-safe error handling system for the P2P.me React PWA using neverthrow that provides predictable, composable error management across the entire application stack.

## Overview

The error handling system creates a consistent flow of typed errors from the blockchain protocol layer through adapters to the UI, enabling robust error recovery and user-friendly error messages. It leverages neverthrow's `Result` type to make error handling explicit and composable.

## Architecture Flow

```
@p2pdotme Core → Thirdweb Adapter → TanStack Query/Hooks → UI Components
```

Each layer has clear error handling responsibilities:

1. **Core Layer**: Domain-specific blockchain errors (`P2PError`)
2. **Adapter Layer**: Integration and transformation errors (`ThirdwebAdapterError | P2PError`)
3. **Query Layer**: Async error handling with TanStack Query
4. **UI Layer**: User-facing error presentation and recovery

## Core Layer: @p2pdotme Protocol

### Error Types

```typescript
// From @/core/p2pdotme/shared/errors.ts
export type P2PErrorDomain =
  | "usdc"
  | "p2p-config"
  | "order-flow"
  | "order-processor"
  | "reputation-manager";

export interface P2PError<D extends P2PErrorDomain = P2PErrorDomain> {
  readonly domain: D;
  readonly code: P2PErrorCode;
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}
```

### Core Functions Pattern

All core protocol functions return `Result<T, P2PError>`:

```typescript
// Example from USDC contract
export function prepareGetUSDCBalanceTx(params: {
  address: Address;
}): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(params)
    .andThen(encodeContractCall)
    .mapErr((error) =>
      createP2PError("Failed to prepare USDC balance transaction", {
        domain: "usdc",
        code: "P2PPrepareFunctionCallError",
        cause: error,
        context: params,
      }),
    );
}
```

## Adapter Layer: Thirdweb Integration

### Error Transformation

The adapter layer chains P2P protocol calls with Thirdweb operations while preserving error types:

```typescript
// From @/core/adapters/wallet/thirdweb/actions.ts
export const getUSDCBalance = (
  address: Address,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareGetUSDCBalanceTx({ address })
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
            "Failed to send and confirm transaction",
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

### Adapter Error Types

```typescript
// From @/core/adapters/wallet/thirdweb/client.ts
export type ThirdwebAdapterError = AppError<"ThirdwebAdapter">;

// Error codes used in the adapter
type ThirdwebErrorCode =
  | "TWEstimateGasError"
  | "TWMaxPriorityFeeError"
  | "TWSendAndConfirmTransactionError";
```

## Query Layer: TanStack Query Integration

### Pattern 1: Direct Result Handling

For simple queries that don't need custom error handling:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getUSDCBalance } from "@/core/adapters/wallet/thirdweb";

export function useUSDCBalance(address: Address, account: Account) {
  return useQuery({
    queryKey: ["usdc-balance", address, account.address],
    queryFn: async () => {
      const result = await getUSDCBalance(address, account);

      if (result.isErr()) {
        // Convert Result error to thrown error for TanStack Query
        throw result.error;
      }

      return result.value;
    },
    enabled: !!address && !!account,
    staleTime: 30_000, // 30 seconds
    retry: (failureCount, error) => {
      // Custom retry logic based on error type
      if (
        error.domain === "ThirdwebAdapter" &&
        error.code === "TWEstimateGasError"
      ) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
  });
}
```

### Pattern 2: Custom Hook with Error Mapping

For complex error handling and user-friendly messages:

```typescript
import { useQuery } from "@tanstack/react-query";
import { ResultAsync } from "neverthrow";

type UIError = {
  title: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
};

function mapErrorToUI(error: ThirdwebAdapterError | P2PError): UIError {
  switch (error.domain) {
    case "ThirdwebAdapter":
      switch (error.code) {
        case "TWEstimateGasError":
          return {
            title: "Network Issue",
            message: "Unable to estimate transaction cost. Please try again.",
            recoverable: true,
            retryable: true,
          };
        case "TWSendAndConfirmTransactionError":
          return {
            title: "Transaction Failed",
            message:
              "Your transaction could not be completed. Please check your wallet and try again.",
            recoverable: true,
            retryable: true,
          };
        default:
          return {
            title: "Wallet Error",
            message: "There was an issue with your wallet connection.",
            recoverable: true,
            retryable: false,
          };
      }
    case "usdc":
      return {
        title: "USDC Error",
        message:
          "Unable to interact with USDC contract. Please try again later.",
        recoverable: true,
        retryable: true,
      };
    default:
      return {
        title: "Unexpected Error",
        message: "Something went wrong. Please try again.",
        recoverable: false,
        retryable: true,
      };
  }
}

export function useUSDCBalanceWithErrorHandling(
  address: Address,
  account: Account,
) {
  const query = useQuery({
    queryKey: ["usdc-balance", address, account.address],
    queryFn: async () => {
      const result = await getUSDCBalance(address, account);

      if (result.isErr()) {
        const uiError = mapErrorToUI(result.error);
        throw uiError;
      }

      return result.value;
    },
    enabled: !!address && !!account,
    retry: (failureCount, error) => {
      return (error as UIError).retryable && failureCount < 3;
    },
  });

  return {
    ...query,
    uiError: query.error as UIError | undefined,
  };
}
```

### Pattern 3: Mutation with Error Handling

For write operations like transactions:

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUSDCTransfer() {
  return useMutation({
    mutationFn: async (params: {
      to: Address;
      amount: bigint;
      account: Account;
    }) => {
      const result = await transferUSDC(params);

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
    onSuccess: (receipt) => {
      toast.success("Transfer completed successfully!");
    },
    onError: (error: ThirdwebAdapterError | P2PError) => {
      const uiError = mapErrorToUI(error);
      toast.error(uiError.title, {
        description: uiError.message,
        action: uiError.retryable
          ? {
              label: "Retry",
              onClick: () => {
                // Retry logic
              },
            }
          : undefined,
      });
    },
  });
}
```

## UI Layer: Component Integration

### Error Boundary Integration

```typescript
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Check if it's our typed error
  const typedError = error as any;
  const isTypedError = typedError.domain && typedError.code;

  if (isTypedError) {
    const uiError = mapErrorToUI(typedError);

    return (
      <div className="rounded-lg border border-destructive/50 p-4">
        <h3 className="font-semibold text-destructive">{uiError.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{uiError.message}</p>
        {uiError.retryable && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetErrorBoundary}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/50 p-4">
      <h3 className="font-semibold text-destructive">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mt-1">
        An unexpected error occurred. Please refresh the page.
      </p>
    </div>
  );
}

export function WalletBalanceComponent({ address, account }: Props) {
  const { data, error, isLoading, refetch } = useUSDCBalanceWithErrorHandling(address, account);

  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (error) {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => refetch()}>
        <div>Error loading balance</div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{formatUSDC(data.balance)}</span>
      <span className="text-sm text-muted-foreground">USDC</span>
    </div>
  );
}
```

### Loading States with Error Recovery

```typescript
export function TransactionComponent() {
  const transferMutation = useUSDCTransfer();

  const handleTransfer = (params: TransferParams) => {
    transferMutation.mutate(params);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => handleTransfer(params)}
        disabled={transferMutation.isPending}
      >
        {transferMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Send USDC'
        )}
      </Button>

      {transferMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{transferMutation.uiError?.title}</AlertTitle>
          <AlertDescription>
            {transferMutation.uiError?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Error Type Consistency

- Always use `Result<T, E>` for synchronous operations
- Use `ResultAsync<T, E>` for asynchronous operations
- Chain operations with `.andThen()` and `.asyncAndThen()`
- Map errors with `.mapErr()` to transform error types

### 2. Error Context

Always provide rich context in errors:

```typescript
return createP2PError("Failed to prepare transaction", {
  domain: "usdc",
  code: "P2PPrepareFunctionCallError",
  cause: originalError,
  context: {
    address,
    amount,
    chainId: chain.id,
    timestamp: Date.now(),
  },
});
```

### 3. Adapter Layer Patterns

- Transform external library errors to your error types
- Preserve original error information in `cause`
- Add adapter-specific context
- Use union types for multiple error sources

### 4. Query Layer Patterns

- Convert `Result` errors to thrown errors for TanStack Query
- Implement custom retry logic based on error type
- Map technical errors to user-friendly messages
- Use error boundaries for unhandled errors

### 5. UI Layer Patterns

- Always handle loading and error states
- Provide retry mechanisms for recoverable errors
- Show specific error messages when possible
- Use toast notifications for action feedback

## Testing Error Handling

### Unit Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { getUSDCBalance } from "@/core/adapters/wallet/thirdweb";

describe("USDC Balance Error Handling", () => {
  it("should handle network errors gracefully", async () => {
    vi.mock("thirdweb", () => ({
      sendAndConfirmTransaction: vi
        .fn()
        .mockRejectedValue(new Error("Network error")),
    }));

    const result = await getUSDCBalance(mockAddress, mockAccount);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.domain).toBe("ThirdwebAdapter");
      expect(result.error.code).toBe("TWSendAndConfirmTransactionError");
    }
  });
});
```

### Integration Tests

```typescript
describe("Error Flow Integration", () => {
  it("should propagate errors through the entire stack", async () => {
    const { result } = renderHook(() =>
      useUSDCBalance(mockAddress, mockAccount),
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.uiError?.title).toBe("Network Issue");
    });
  });
});
```

## Common Error Scenarios

### 1. Network Connectivity Issues

```typescript
// Retry logic for network errors
retry: (failureCount, error) => {
  const isNetworkError =
    error.code === "TWEstimateGasError" ||
    error.code === "TWMaxPriorityFeeError";
  return isNetworkError && failureCount < 3;
};
```

### 2. Wallet Connection Issues

```typescript
// Handle disconnected wallet
if (!account.address) {
  return err(
    createAppError("Wallet not connected", {
      domain: "ThirdwebAdapter",
      code: "TWWalletNotConnected",
      cause: new Error("No active wallet connection"),
      context: { account },
    }),
  );
}
```

### 3. Transaction Failures

```typescript
// Handle transaction failures with user guidance
onError: (error) => {
  if (error.code === "TWSendAndConfirmTransactionError") {
    toast.error("Transaction Failed", {
      description: "Please check your wallet balance and try again.",
      action: {
        label: "Check Wallet",
        onClick: () => openWalletModal(),
      },
    });
  }
};
```

## Debugging Error Flows

### Error Logging

```typescript
// In your error mapping function
function mapErrorToUI(error: ThirdwebAdapterError | P2PError): UIError {
  // Log for debugging
  console.error("Error mapping:", {
    domain: error.domain,
    code: error.code,
    message: error.message,
    context: error.context,
    cause: error.cause,
  });

  // Return user-friendly error
  return {
    title: "User-friendly title",
    message: "User-friendly message",
    recoverable: true,
    retryable: true,
  };
}
```

### Error Monitoring

```typescript
// Integrate with Sentry for production error tracking
import * as Sentry from "@sentry/react";

function logError(error: ThirdwebAdapterError | P2PError) {
  Sentry.captureException(error, {
    tags: {
      domain: error.domain,
      code: error.code,
    },
    extra: {
      context: error.context,
      cause: error.cause,
    },
  });
}
```

## Performance Considerations

- Error handling adds minimal overhead due to Result types
- Avoid excessive error mapping - do it at boundaries
- Cache error mappings for frequently occurring errors
- Use error boundaries to prevent cascading failures

## Migration Guide

### From Promise-based Error Handling

Before:

```typescript
try {
  const balance = await getBalance(address);
  return balance;
} catch (error) {
  console.error("Failed to get balance:", error);
  throw error;
}
```

After:

```typescript
const result = await getUSDCBalance(address, account);
return result.match(
  (balance) => balance,
  (error) => {
    console.error("Failed to get balance:", error);
    throw mapErrorToUI(error);
  },
);
```

### Gradual Adoption

1. Start with core protocol functions
2. Update adapters to use Result types
3. Modify hooks to handle Result types
4. Update UI components with error boundaries
5. Add comprehensive error mapping

---

This error handling architecture provides a robust, type-safe foundation for managing errors across the entire P2P.me application stack, ensuring users receive appropriate feedback and developers have clear error information for debugging.
