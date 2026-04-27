# Sound Integration Guide for P2P.me Platform

## Overview

This guide documents the comprehensive sound feedback system implemented across the P2P.me platform. The system provides audio feedback to enhance user experience and accessibility, offering contextual sound patterns for different user interactions and system events.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Sound System Components](#sound-system-components)
3. [Sound Patterns and Usage](#sound-patterns-and-usage)
4. [Implementation Examples](#implementation-examples)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Core Components

The sound system is built on a layered architecture with clear separation of concerns:

#### 1. Base Sound System (`useSounds` hook)

- **Location**: `src/hooks/use-sounds.ts`
- **Purpose**: Provides low-level sound generation and device capability detection
- **Features**:
  - Web Audio API integration
  - Device capability detection
  - User preference compliance
  - Sound pattern library management

#### 2. Sound Interaction Patterns (`useSoundInteractions` hook)

- **Location**: `src/hooks/use-sound-interactions.ts`
- **Purpose**: Higher-level sound patterns for complex user flows
- **Features**:
  - Semantic sound feedback (success, error, warning)
  - Transaction flow patterns
  - Settings and configuration patterns
  - Order management patterns

#### 3. Direct Integration Points

- **Blockchain Event Listeners**: `src/hooks/use-event-listeners.ts`
- **Bridge Handlers**: `src/core/rango/bridgeHandler/`
- **UI Components**: Settings, transaction flows, and user interactions

### Design Principles

1. **User-Controlled**: Respects user preferences and device capabilities
2. **Contextual**: Different sound patterns for different interaction contexts
3. **Consistent**: Unified patterns across the entire application
4. **Performant**: Minimal overhead and efficient audio processing
5. **Accessible**: Enhances accessibility without being intrusive

## Sound System Components

### Core Sound Hook (`useSounds`)

**Basic Usage:**

```typescript
import { useSounds } from "@/hooks";

function MyComponent() {
  const { triggerSuccessSound, triggerFailureSound, triggerQrScanSound } = useSounds();

  const handleSuccess = () => {
    triggerSuccessSound(); // Play success sound
  };

  const handleError = () => {
    triggerFailureSound(); // Play error sound
  };

  const handleQRScan = () => {
    triggerQrScanSound(); // Play QR scan sound
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success Action</button>
      <button onClick={handleError}>Error Action</button>
      <button onClick={handleQRScan}>QR Scan</button>
    </div>
  );
}
```

**Available Sound Functions:**

- `triggerQrScanSound()` - QR scan success feedback
- `triggerSuccessSound()` - Success feedback for orders and transactions
- `triggerFailureSound()` - Failure feedback for orders and transactions

**Support Information:**

```typescript
const { supportInfo } = useSounds();

console.log({
  isAPIAvailable: supportInfo.isAPIAvailable,
  isDisabledByUser: supportInfo.isDisabledByUser,
  willTrigger: supportInfo.willTrigger,
  reasons: supportInfo.reasons,
});
```

### Direct Sound Usage Pattern

**For Settings and Configuration:**

```typescript
import { useSounds } from "@/hooks";

function SettingsComponent() {
  const { triggerSuccessSound, triggerFailureSound } = useSounds();

  const handleSettingToggle = async () => {
    try {
      await toggleSetting();
      triggerSuccessSound(); // Success sound for settings save
    } catch (error) {
      triggerFailureSound(); // Error sound for settings failure
    }
  };

  return (
    <button onClick={handleSettingToggle}>
      Toggle Setting
    </button>
  );
}
```

**Direct Sound Functions:**

- `triggerSuccessSound()` - Success sound for all positive actions
- `triggerFailureSound()` - Error sound for all failed actions
- `triggerQrScanSound()` - QR scan success feedback

## Sound Patterns and Usage

### Pattern Categories

| Pattern             | Hook                                | Use Cases                                                                      | Audio File           |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| **QR Scan Success** | `useSounds().triggerQrScanSound()`  | QR code scanning, barcode reading                                              | Generic success tone |
| **Success**         | `useSounds().triggerSuccessSound()` | Order completion, transaction success, saves, settings saves, bridge success   | `SUCCESS.mp3`        |
| **Failure**         | `useSounds().triggerFailureSound()` | Order failure, transaction errors, validation, settings errors, bridge failure | `FAILED.mp3`         |

### When to Use Each Pattern

**QR Scan Sound (`triggerQrScanSound`):**

- QR code scanning success
- Barcode reading confirmation
- Payment code recognition

**Success Sound (`triggerSuccessSound`):**

- Order placement success
- Transaction completion
- Payment confirmation
- Data synchronization success
- Settings saves
- Configuration updates
- User preference changes
- Bridge operation success
- Direct transfer success

**Failure Sound (`triggerFailureSound`):**

- Order placement failure
- Transaction errors
- Payment failures
- Network connectivity issues
- Settings save failures
- Configuration errors
- Bridge operation failures
- Direct transfer failures

**Generic Error (`onOrderFailed`):**

- Settings save failures
- Configuration errors
- User preference update failures
- Non-critical negative actions

**Bridge Success/Failure:**

- Cross-chain bridge operations
- Deposit/withdraw transactions
- Multi-network operations

## Implementation Examples

### Blockchain Event Listeners

**Order Event Handling:**

```typescript
// src/hooks/use-event-listeners.ts
import { useSounds } from "@/hooks";

export function useEventListeners(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const sounds = useSounds();

  useEffect(() => {
    // Order completion event
    const unwatchOrderCompleted = viemPublicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "OrderCompleted",
      args: { orderId: BigInt(orderId) },
      onLogs: (logs) => {
        console.log("Order completed:", logs);
        sounds.triggerSuccessSound(); // Success sound for order completion
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    // Order cancellation event
    const unwatchOrderCancelled = viemPublicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      eventName: "CancelledOrders",
      args: { orderId: BigInt(orderId) },
      onLogs: (logs) => {
        console.log("Order cancelled:", logs);
        sounds.triggerFailureSound(); // Failure sound for order cancellation
        queryClient.invalidateQueries({
          queryKey: ["order", "getOrderById", numericOrderId],
        });
      },
    });

    return () => {
      unwatchOrderCompleted?.();
      unwatchOrderCancelled?.();
    };
  }, [orderId, sounds]);
}
```

### Bridge Handler Integration

**Deposit Handler:**

```typescript
// src/core/rango/bridgeHandler/deposit.ts
import { useSounds } from "@/hooks";

export const handleDeposit = async (
  swapRes: RangoSwapResponse,
  primaryWallet: Wallet | null,
  setDepositData: React.Dispatch<React.SetStateAction<DepositState>>,
  sounds: ReturnType<typeof useSounds>,
) => {
  try {
    const success = await processDeposit(swapRes, primaryWallet);

    if (success) {
      toast.success("Deposit completed successfully");
      sounds.triggerSuccessSound(); // Success sound for successful deposit
      console.log("Deposit completed successfully");
    } else {
      setDepositData((prev) => ({ ...prev, status: "failed" }));
      sounds.triggerFailureSound(); // Failure sound for failed deposit
      throw new Error("Deposit failed");
    }
  } catch (error) {
    sounds.triggerFailureSound(); // Failure sound for deposit errors
    throw error;
  }
};
```

**Withdraw Handler:**

```typescript
// src/core/rango/bridgeHandler/withdraw.ts
import { useSounds } from "@/hooks";

export const handleWithdraw = async (
  swapRes: RangoSwapResponse,
  account: Account | undefined,
  setWithdrawData: React.Dispatch<React.SetStateAction<WithdrawState>>,
  sounds: ReturnType<typeof useSounds>,
) => {
  try {
    // Approve transaction
    const approveTransaction = await prepareApproveTransaction(swapRes);
    if (approveTransaction.isErr()) {
      setWithdrawData((prev) => ({ ...prev, status: "failed" }));
      sounds.triggerFailureSound(); // Failure sound for approve failure
      throw new Error("Approve transaction preparation failed");
    }

    // Main transaction
    const mainTransaction = await prepareMainTransaction(swapRes);
    if (mainTransaction.isErr()) {
      setWithdrawData((prev) => ({ ...prev, status: "failed" }));
      sounds.triggerFailureSound(); // Failure sound for main transaction failure
      throw new Error("Main transaction preparation failed");
    }

    const success = await executeWithdraw(swapRes);
    if (success) {
      toast.success("Withdrawal completed successfully");
      sounds.triggerSuccessSound(); // Success sound for successful withdrawal
      console.log("Withdrawal completed successfully");
    } else {
      setWithdrawData((prev) => ({ ...prev, status: "failed" }));
      sounds.triggerFailureSound(); // Failure sound for failed withdrawal
      throw new Error("Withdrawal failed");
    }
  } catch (error) {
    sounds.triggerFailureSound(); // Failure sound for withdrawal errors
    throw error;
  }
};
```

### Direct USDC Transfer

**Withdraw Drawer:**

```typescript
// src/pages/homescreen/withdraw-drawer.tsx
import { useUSDCBalance, useThirdweb, useSounds } from "@/hooks";

function DirectWithdraw({ onBack }: { onBack: () => void }) {
  const { account } = useThirdweb();
  const { usdcBalance } = useUSDCBalance();
  const sounds = useSounds();

  const handleSend = async () => {
    setIsLoading(true);

    try {
      const amountInWei = parseUnits(amount, 6);
      const result = await transferUSDC({
        address: recipientAddress as `0x${string}`,
        amount: amountInWei,
      }, account);

      if (result.isErr()) {
        toast.error(t("TRANSFER_FAILED"));
        sounds.triggerFailureSound(); // Failure sound for transfer error
        return;
      }

      toast.success(t("USDC_SENT_SUCCESSFULLY", { amount }));
      sounds.triggerSuccessSound(); // Success sound for successful transfer
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });

      setAmount("");
      setRecipientAddress("");
      onBack();
    } catch {
      toast.error(t("TRANSFER_FAILED"));
      sounds.triggerFailureSound(); // Failure sound for failed transfer
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Transfer form UI */}
      <Button onClick={handleSend} disabled={isLoading}>
        {isLoading ? "Sending..." : "Send USDC"}
      </Button>
    </div>
  );
}
```

### Settings Integration

**Settings Panel:**

```typescript
// src/pages/settings/index.tsx
import { useSoundInteractions } from "@/hooks/use-sound-interactions";

export function Settings() {
  const { setSounds } = useSettings();
  const soundInteractions = useSoundInteractions();

  const handleSoundsToggle = async () => {
    try {
      await setSounds(!settings.sounds);
      // Provide audio feedback when successfully toggling sounds
      if (!settings.sounds) {
        // If we just enabled sounds, play success sound
        soundInteractions.onOrderPlaced(); // Generic success sound
      }
    } catch (error) {
      // Play error sound when settings change fails
      soundInteractions.onOrderFailed(); // Generic error sound
      const settingsError = error as SettingsError;
      toast.error(t(settingsError.code), {
        description: t(settingsError.message),
      });
    }
  };

  return (
    <div>
      <Switch
        checked={settings.sounds}
        onCheckedChange={handleSoundsToggle}
        disabled={isLoading}
      />
    </div>
  );
}
```

## Integration Patterns

### Pattern 1: Direct Sound Integration

**For simple success/failure feedback:**

```typescript
import { useSounds } from "@/hooks";

function SimpleComponent() {
  const { triggerSuccessSound, triggerFailureSound } = useSounds();

  const handleAction = async () => {
    try {
      await performAction();
      triggerSuccessSound(); // Direct success sound
    } catch (error) {
      triggerFailureSound(); // Direct failure sound
    }
  };

  return <button onClick={handleAction}>Action</button>;
}
```

### Pattern 2: Semantic Sound Integration

**For settings and configuration:**

```typescript
import { useSoundInteractions } from "@/hooks/use-sound-interactions";

function SettingsComponent() {
  const soundInteractions = useSoundInteractions();

  const handleConfigChange = async () => {
    try {
      await updateConfig();
      soundInteractions.onOrderPlaced(); // Generic success for settings
    } catch (error) {
      soundInteractions.onOrderFailed(); // Generic error for settings
    }
  };

  return <button onClick={handleConfigChange}>Update Config</button>;
}
```

### Pattern 3: Bridge Operation Integration

**For cross-chain operations:**

```typescript
import { useSoundInteractions } from "@/hooks/use-sound-interactions";

function BridgeComponent() {
  const soundInteractions = useSoundInteractions();

  const handleBridgeOperation = async () => {
    try {
      await executeBridge();
      soundInteractions.onBridgeSuccess(); // Bridge-specific success
    } catch (error) {
      soundInteractions.onBridgeFailure(); // Bridge-specific failure
    }
  };

  return <button onClick={handleBridgeOperation}>Bridge Assets</button>;
}
```

### Pattern 4: Function Parameter Integration

**For core handlers that need sound feedback:**

```typescript
// Component usage
function BridgeHandlerComponent() {
  const sounds = useSounds();

  const handleDeposit = async (swapRes: RangoSwapResponse) => {
    await handleDeposit(swapRes, primaryWallet, setDepositData, sounds);
  };

  return <button onClick={() => handleDeposit(swapRes)}>Deposit</button>;
}
```

## Best Practices

### When to Use Sound Feedback

**✅ DO use sound feedback for:**

- Transaction completions (success/failure)
- Order state changes (placed, accepted, completed, cancelled)
- Bridge operations (deposit/withdraw)
- Critical user actions (payments, transfers)
- Settings saves and configuration changes
- QR code scanning success
- System errors and warnings

**❌ DON'T use sound feedback for:**

- Continuous UI interactions (scrolling, hovering)
- Rapid-fire events (typing, real-time updates)
- Decorative animations
- Background processes
- Minor UI state changes

### Sound Pattern Selection

**Success Sounds:**

- Order completions
- Transaction success
- Payment confirmations
- Settings saves
- Bridge operation success

**Failure Sounds:**

- Order failures
- Transaction errors
- Payment failures
- Settings save errors
- Bridge operation failures
- Network connectivity issues

**QR Scan Sounds:**

- QR code scanning success
- Barcode reading confirmation
- Payment code recognition

### Performance Considerations

1. **Audio Loading**: Sounds are loaded asynchronously and cached
2. **User Preferences**: Always respect user's sound settings
3. **Device Capabilities**: Gracefully handle devices without audio support
4. **Memory Management**: Audio objects are properly cleaned up
5. **Volume Control**: Sounds play at appropriate volume levels (0.6 default)

### Accessibility Guidelines

1. **User Control**: Always respect the user's sound preference setting
2. **Alternative Feedback**: Provide visual/haptic alternatives for audio-only feedback
3. **Volume Levels**: Use appropriate volume levels for different contexts
4. **Consistency**: Maintain consistent sound patterns across similar interactions
5. **Clear Meaning**: Ensure sound patterns have clear semantic meaning

## Troubleshooting

### Common Issues

**Sound feedback not working:**

1. Check device audio capability: `supportInfo.isAPIAvailable`
2. Verify user preference: `settings.sounds === true`
3. Check browser support for Web Audio API
4. Ensure audio files are properly loaded
5. Verify device volume and mute settings

**Inconsistent sound patterns:**

1. Verify consistent sound function usage across similar interactions
2. Check if custom sound integrations are properly implemented
3. Ensure sound hooks are used consistently throughout the app

**Performance issues:**

1. Avoid rapid successive sound calls
2. Check for memory leaks in audio event listeners
3. Verify audio files are properly optimized
4. Monitor audio context creation and cleanup

### Debug Information

**Check sound system status:**

```typescript
const { supportInfo } = useSounds();
console.log({
  isAPIAvailable: supportInfo.isAPIAvailable,
  isDisabledByUser: supportInfo.isDisabledByUser,
  willTrigger: supportInfo.willTrigger,
  reasons: supportInfo.reasons,
});
```

**Test sound patterns:**

```typescript
const { triggerSuccessSound, triggerFailureSound } = useSounds();

// Test success sound
triggerSuccessSound();

// Test failure sound
triggerFailureSound();
```

### Browser Support

**Fully Supported:**

- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile)
- Edge (desktop and mobile)

**Limitations:**

- Requires user interaction to start audio context
- May be affected by browser autoplay policies
- Some mobile browsers may have reduced audio capabilities

### Audio Files

**Current Audio Assets:**

- `SUCCESS.mp3` - Success feedback sound
- `FAILED.mp3` - Failure feedback sound

**Audio Specifications:**

- Format: MP3
- Duration: Short (< 1 second)
- Volume: Moderate level for ambient use
- Quality: Optimized for web delivery

## Migration Guide

### Adding Sound to Existing Components

**Before:**

```typescript
const handleAction = async () => {
  try {
    await performAction();
    toast.success("Action completed!");
  } catch (error) {
    toast.error("Action failed!");
  }
};
```

**After:**

```typescript
const { triggerSuccessSound, triggerFailureSound } = useSounds();

const handleAction = async () => {
  try {
    await performAction();
    triggerSuccessSound(); // Add success sound
    toast.success("Action completed!");
  } catch (error) {
    triggerFailureSound(); // Add failure sound
    toast.error("Action failed!");
  }
};
```

### Updating Core Handlers

**Before:**

```typescript
export const handleDeposit = async (
  swapRes: RangoSwapResponse,
  primaryWallet: Wallet | null,
  setDepositData: React.Dispatch<React.SetStateAction<DepositState>>,
) => {
  // Handler logic without sound feedback
};
```

**After:**

```typescript
export const handleDeposit = async (
  swapRes: RangoSwapResponse,
  primaryWallet: Wallet | null,
  setDepositData: React.Dispatch<React.SetStateAction<DepositState>>,
  sounds: ReturnType<typeof useSounds>, // Add sounds parameter
) => {
  try {
    // Handler logic
    if (success) {
      sounds.triggerSuccessSound(); // Add success sound
    } else {
      sounds.triggerFailureSound(); // Add failure sound
    }
  } catch (error) {
    sounds.triggerFailureSound(); // Add error sound
    throw error;
  }
};
```

## Conclusion

The sound integration system provides a comprehensive, user-controlled, and performant solution for audio feedback across the P2P.me platform. By following the patterns and guidelines outlined in this document, developers can create consistent and accessible audio experiences that enhance user engagement and provide clear feedback for all user interactions.

The system's layered architecture ensures that sound feedback is contextually appropriate while maintaining performance and respecting user preferences. The integration patterns provide flexibility for different use cases, from simple success/failure feedback to complex transaction flows and bridge operations.

For additional support or feature requests, refer to the sound system implementation in the respective hook files or consult the development team for guidance on extending the sound pattern library.
