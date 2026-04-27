# Sound System Summary

## Quick Reference

The P2P.me sound system provides contextual audio feedback across the platform using direct sound control:

### Core Hook

#### `useSounds()` - Direct Sound Control

```typescript
import { useSounds } from "@/hooks";

const { triggerSuccessSound, triggerFailureSound, triggerQrScanSound } =
  useSounds();
```

## Sound Patterns

| Pattern     | Hook                                | Use Case                                                              | Audio File      |
| ----------- | ----------------------------------- | --------------------------------------------------------------------- | --------------- |
| **Success** | `useSounds().triggerSuccessSound()` | Transaction success, order completion, settings saves, bridge success | `SUCCESS.mp3`   |
| **Failure** | `useSounds().triggerFailureSound()` | Transaction errors, order failures, settings errors, bridge failure   | `FAILED.mp3`    |
| **QR Scan** | `useSounds().triggerQrScanSound()`  | QR code scanning success                                              | Generic success |

## Integration Points

### 1. Blockchain Events (`use-event-listeners.ts`)

```typescript
const sounds = useSounds();

// Order completion
sounds.triggerSuccessSound();

// Order cancellation
sounds.triggerFailureSound();
```

### 2. Bridge Handlers (`bridgeHandler/`)

```typescript
// Pass sounds to handlers
await handleDeposit(swapRes, primaryWallet, setDepositData, sounds);
await handleWithdraw(swapRes, account, setWithdrawData, sounds);

// Inside handlers
sounds.triggerSuccessSound(); // Success
sounds.triggerFailureSound(); // Failure
```

### 3. UI Components

```typescript
// Settings toggle
const { triggerSuccessSound, triggerFailureSound } = useSounds();

const handleToggle = async () => {
  try {
    await setSetting(value);
    triggerSuccessSound(); // Success
  } catch (error) {
    triggerFailureSound(); // Error
  }
};
```

### 4. Direct Transfers

```typescript
const sounds = useSounds();

const handleTransfer = async () => {
  try {
    await transferUSDC(params);
    sounds.triggerSuccessSound(); // Success
  } catch (error) {
    sounds.triggerFailureSound(); // Failure
  }
};
```

## When to Use Each Pattern

### `useSounds()` - For All Sound Feedback

- ✅ Transaction completions
- ✅ Order state changes
- ✅ Bridge operations
- ✅ Direct transfers
- ✅ QR scanning
- ✅ Settings changes
- ✅ Configuration updates
- ✅ User preferences
- ✅ All success/error actions

## User Control

The system respects user preferences through the settings:

- **Enabled**: `settings.sounds === true`
- **Disabled**: `settings.sounds === false`
- **Browser Support**: Automatic detection via Web Audio API

## Quick Implementation

### Add to Existing Component

```typescript
// Before
const handleAction = async () => {
  await performAction();
  toast.success("Done!");
};

// After
const { triggerSuccessSound } = useSounds();

const handleAction = async () => {
  await performAction();
  triggerSuccessSound(); // Add this line
  toast.success("Done!");
};
```

### Add to Core Handler

```typescript
// Function signature
export const handleOperation = async (
  // ... existing params
  sounds: ReturnType<typeof useSounds>, // Add this parameter
) => {
  try {
    // ... operation logic
    sounds.triggerSuccessSound(); // Add success sound
  } catch (error) {
    sounds.triggerFailureSound(); // Add failure sound
    throw error;
  }
};
```

## Best Practices

### ✅ DO

- Use success sounds for positive outcomes
- Use failure sounds for errors and failures
- Respect user preferences
- Test on actual devices
- Use appropriate patterns for context

### ❌ DON'T

- Overuse sound feedback
- Use sounds for continuous interactions
- Ignore user preferences
- Use sounds for decorative purposes
- Block UI with sound loading

## Audio Assets

- **Location**: `src/assets/audio/`
- **Format**: MP3
- **Files**: `SUCCESS.mp3`, `FAILED.mp3`
- **Duration**: < 1 second
- **Volume**: 0.6 (60% of max)

## Browser Support

- ✅ Chrome (desktop/mobile)
- ✅ Firefox (desktop/mobile)
- ✅ Safari (desktop/mobile)
- ✅ Edge (desktop/mobile)
- ⚠️ Requires user interaction to start audio context

## Common Issues

1. **No sound**: Check user preferences and browser audio permissions
2. **Inconsistent patterns**: Ensure consistent hook usage
3. **Performance**: Avoid rapid successive sound calls
4. **Mobile**: Test on actual devices for accurate results

For complete documentation, see [Sound Integration Guide](./sound-integration-guide.md).
