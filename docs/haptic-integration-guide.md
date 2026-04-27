# Haptic Integration Guide for P2P.me Platform

## Overview

This guide documents the comprehensive haptic feedback system implemented across the P2P.me platform. The system provides tactile feedback to enhance user experience and accessibility, following modern UX best practices and platform-specific guidelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Enhanced Components](#enhanced-components)
3. [Haptic Interaction Patterns](#haptic-interaction-patterns)
4. [Implementation Examples](#implementation-examples)
5. [Testing & Quality Assurance](#testing--quality-assurance)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Core Components

The haptic system is built on three foundational layers:

#### 1. Base Haptic System (`useHaptics` hook)

- **Location**: `src/hooks/use-haptics.ts`
- **Purpose**: Provides low-level haptic pattern generation and device capability detection
- **Features**:
  - Cross-platform haptic pattern support
  - User preference compliance
  - Device capability detection
  - Pattern library management

#### 2. Enhanced UI Components

- **Components**: Button, Checkbox, Select, NumpadInput
- **Location**: `src/components/ui/`
- **Purpose**: Self-contained haptic feedback for common UI interactions
- **Features**:
  - Backward compatibility with existing code
  - Configurable haptic types and feedback control
  - Consistent haptic patterns across the app

#### 3. Interaction Patterns (`useHapticInteractions` hook)

- **Location**: `src/hooks/use-haptic-interactions.ts`
- **Purpose**: Higher-level haptic patterns for complex user flows
- **Features**:
  - Semantic haptic feedback (success, error, warning)
  - Transaction flow patterns
  - Navigation and settings patterns

### Design Principles

1. **User-Controlled**: Respects user preferences and device capabilities
2. **Contextual**: Different haptic types for different interaction contexts
3. **Consistent**: Unified patterns across the entire application
4. **Performant**: Minimal overhead and efficient pattern execution
5. **Accessible**: Enhances accessibility without being intrusive

## Enhanced Components

### Button Component

**Enhanced Features:**

- `hapticFeedback?: boolean` - Enable/disable haptic feedback (default: `true`)
- `hapticType?: "tap" | "success" | "error" | "warning"` - Haptic pattern type (default: `"tap"`)

**Usage Examples:**

```typescript
// Standard button with default tap haptic
<Button onClick={handleClick}>
  Click Me
</Button>

// Success action button
<Button hapticType="success" onClick={handleSave}>
  Save Changes
</Button>

// Destructive action with warning haptic
<Button hapticType="warning" variant="destructive" onClick={handleDelete}>
  Delete Item
</Button>

// Silent button (no haptic feedback)
<Button hapticFeedback={false} onClick={handleQuietAction}>
  Silent Action
</Button>
```

### Checkbox Component

**Enhanced Features:**

- `hapticFeedback?: boolean` - Enable/disable haptic feedback (default: `true`)
- Automatic haptic on state change

**Usage Examples:**

```typescript
// Standard checkbox with haptic feedback
<Checkbox
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
/>

// Silent checkbox
<Checkbox
  hapticFeedback={false}
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
/>
```

### Select Component

**Enhanced Features:**

- `hapticFeedback?: boolean` - Enable/disable haptic feedback (default: `true`)
- Automatic haptic on selection change

**Usage Examples:**

```typescript
// Standard select with haptic feedback
<Select onValueChange={handleChange}>
  <SelectTrigger>
    <SelectValue placeholder="Choose option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Silent select
<Select hapticFeedback={false} onValueChange={handleChange}>
  {/* ... */}
</Select>
```

### NumpadInput Component

**Enhanced Features:**

- `hapticFeedback?: boolean` - Enable/disable haptic feedback (default: `true`)
- Different haptic patterns for different actions:
  - Number entry: tap haptic
  - Delete: tap haptic
  - Clear: tap haptic
  - Max: tap haptic

**Usage Examples:**

```typescript
// Standard numpad with haptic feedback
<NumpadInput
  onChange={handleInput}
  onMax={handleMax}
  onClear={handleClear}
  onDelete={handleDelete}
/>

// Silent numpad
<NumpadInput
  hapticFeedback={false}
  onChange={handleInput}
  onMax={handleMax}
  onClear={handleClear}
  onDelete={handleDelete}
/>
```

## Haptic Interaction Patterns

### Core Interaction Hooks

The `useHapticInteractions` hook provides semantic haptic patterns for complex interactions:

```typescript
import { useHapticInteractions } from "@/hooks";

function MyComponent() {
  const {
    // Basic interactions
    triggerTapHaptic,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerWarningHaptic,

    // Semantic interactions
    onNavigate,
    onBack,
    onValidationError,
    onSettingChange,
    onSettingSaved,
    onSettingError,
    onCurrencyToggle,
    onContinue,

    // Transaction flows
    onOrderPlaced,
    onOrderFailed,
    onPaymentMarked,
    onPaymentFailed,

    // QR scanning
    onQRScanned,
    onQRError,

    // Utility functions
    withHapticFeedback,
    withHapticChange,
  } = useHapticInteractions();

  // Usage examples...
}
```

### Transaction Flow Patterns

**Buy/Sell/Pay Flows:**

```typescript
const handleCurrencyToggle = () => {
  onCurrencyToggle(); // Provides tap haptic for toggle action
  setDenomination((prev) => (prev === "crypto" ? "fiat" : "crypto"));
};

const handleValidationError = (errorMessage: string) => {
  onValidationError(); // Provides error haptic for validation failure
  setError(errorMessage);
};

const handleContinue = () => {
  // Button component with default haptic handles the tap feedback
  navigate("/next-step");
};
```

**Order Management:**

```typescript
const handleOrderPlacement = async () => {
  try {
    await placeOrder();
    onOrderPlaced(); // Success haptic for successful order
  } catch (error) {
    onOrderFailed(); // Error haptic for failed order
  }
};

const handlePaymentMarking = async () => {
  try {
    await markPayment();
    onPaymentMarked(); // Success haptic for payment confirmation
  } catch (error) {
    onPaymentFailed(); // Error haptic for payment failure
  }
};
```

**QR Scanning:**

```typescript
const handleQRScan = async (qrData: string) => {
  try {
    const result = await processQR(qrData);
    onQRScanned(); // Success haptic for successful scan
  } catch (error) {
    onQRError(); // Error haptic for scan failure
  }
};
```

### Settings & Configuration

**Settings Changes:**

```typescript
const handleThemeChange = async (theme: Theme) => {
  try {
    onSettingChange(); // Haptic for setting change attempt
    await saveTheme(theme);
    onSettingSaved(); // Success haptic for save
  } catch (error) {
    onSettingError(); // Error haptic for failure
  }
};
```

**Address Book Management:**

```typescript
const handleAddressAdd = async (address: Address) => {
  try {
    await addAddress(address);
    triggerSuccessHaptic(); // Success for successful add
  } catch (error) {
    triggerErrorHaptic(); // Error for failure
  }
};

const handleAddressDelete = async (id: string) => {
  // Warning haptic handled by Button component with hapticType="warning"
  await deleteAddress(id);
};
```

## Implementation Examples

### Complex Form Validation

```typescript
function FormComponent() {
  const { onValidationError, withHapticFeedback } = useHapticInteractions();

  const handleSubmit = withHapticFeedback(
    async (data: FormData) => {
      // Validation
      if (!data.email) {
        throw new Error("Email is required");
      }

      // Submit logic
      await submitForm(data);
    },
    "success" // Success haptic on successful submission
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" hapticType="success">
        Submit
      </Button>
    </form>
  );
}
```

### Navigation with Haptic Feedback

```typescript
function NavigationComponent() {
  const { onNavigate, onBack } = useHapticInteractions();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    onNavigate(); // Navigation haptic
    navigate(path);
  };

  const handleBack = () => {
    onBack(); // Back navigation haptic
    navigate(-1);
  };

  return (
    <div>
      <Button onClick={handleBack}>Back</Button>
      <Button onClick={() => handleNavigation("/settings")}>
        Settings
      </Button>
    </div>
  );
}
```

### Error Handling with Haptic Feedback

```typescript
function ErrorBoundaryComponent() {
  const { triggerErrorHaptic } = useHapticInteractions();

  useEffect(() => {
    const handleError = (error: Error) => {
      triggerErrorHaptic(); // Error haptic for system errors
      console.error("System error:", error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [triggerErrorHaptic]);

  // Component logic...
}
```

## Testing & Quality Assurance

### Comprehensive Test Suite

The haptic system includes a comprehensive test suite accessible at `/dev/haptics`:

**Test Categories:**

1. **Core UI Components** - Test enhanced Button, Checkbox, Select components
2. **Transaction Flows** - Test NumpadInput and transaction-specific patterns
3. **Order Management** - Test order placement, payment, and QR scanning patterns
4. **Settings & Navigation** - Test configuration and navigation patterns

### Manual Testing Checklist

**Device Testing:**

- [ ] Test on iOS devices with haptic feedback
- [ ] Test on Android devices with vibration support
- [ ] Test on devices without haptic support
- [ ] Verify user preference compliance

**Interaction Testing:**

- [ ] All button types trigger appropriate haptic patterns
- [ ] Form validation errors provide error haptic
- [ ] Success actions provide success haptic
- [ ] Navigation actions provide tap haptic
- [ ] Settings changes provide appropriate feedback

**Performance Testing:**

- [ ] No noticeable lag when triggering haptics
- [ ] Haptic patterns don't interfere with UI animations
- [ ] Memory usage remains stable during extended haptic use

### Automated Testing

```typescript
// Example test for enhanced Button component
describe('Enhanced Button Component', () => {
  it('should trigger haptic feedback on click', () => {
    const mockHaptic = jest.fn();
    render(<Button onClick={mockHaptic}>Test</Button>);

    fireEvent.click(screen.getByText('Test'));
    expect(mockHaptic).toHaveBeenCalled();
  });

  it('should respect hapticFeedback=false', () => {
    const mockHaptic = jest.fn();
    render(
      <Button hapticFeedback={false} onClick={mockHaptic}>
        Test
      </Button>
    );

    fireEvent.click(screen.getByText('Test'));
    // Verify no haptic was triggered
  });
});
```

## Best Practices

### When to Use Haptic Feedback

**✅ DO use haptic feedback for:**

- Button interactions (especially primary actions)
- Form submission and validation
- Success/error state changes
- Navigation actions
- Toggle interactions
- Critical alerts and confirmations

**❌ DON'T use haptic feedback for:**

- Continuous scrolling or dragging
- Hover states (not applicable on mobile)
- Decorative animations
- High-frequency interactions (e.g., real-time updates)

### Haptic Pattern Selection

**Tap Haptic (`"tap"`):**

- Standard interactions
- Navigation
- Toggle actions
- Data entry

**Success Haptic (`"success"`):**

- Successful form submissions
- Order placements
- Payment confirmations
- Data saves

**Error Haptic (`"error"`):**

- Form validation failures
- Transaction errors
- System errors
- Failed operations

**Warning Haptic (`"warning"`):**

- Destructive actions
- Important confirmations
- Data loss warnings
- Irreversible operations

### Performance Considerations

1. **Timing**: Haptic feedback should be immediate (< 10ms delay)
2. **Frequency**: Avoid rapid successive haptic triggers
3. **Battery**: Haptic feedback consumes battery; respect user preferences
4. **Accessibility**: Provide haptic feedback as enhancement, not requirement

### Accessibility Guidelines

1. **User Control**: Always respect the user's haptic preference setting
2. **Alternative Feedback**: Provide visual/audio alternatives for haptic-only feedback
3. **Intensity**: Use appropriate intensity levels for different contexts
4. **Consistency**: Maintain consistent haptic patterns across similar interactions

## Troubleshooting

### Common Issues

**Haptic feedback not working:**

1. Check device haptic capability: `supportInfo.isAPIAvailable`
2. Verify user preference: `settings.haptics !== 'none'`
3. Ensure component has `hapticFeedback={true}` (default)
4. Check browser support for Vibration API

**Inconsistent haptic patterns:**

1. Verify consistent `hapticType` usage across similar interactions
2. Check if custom patterns are properly registered
3. Ensure `useHapticInteractions` is used consistently

**Performance issues:**

1. Avoid rapid successive haptic calls
2. Check for memory leaks in haptic event listeners
3. Verify haptic patterns aren't blocking UI thread

### Debug Information

Access debug information through the dev panel at `/dev/haptics`:

```typescript
// Check haptic system status
const { supportInfo } = useHaptics();
console.log({
  isAPIAvailable: supportInfo.isAPIAvailable,
  willTrigger: supportInfo.willTrigger,
  reasons: supportInfo.reasons,
});
```

### Browser Support

**Supported:**

- Safari on iOS (with user gesture)
- Chrome on Android (with user gesture)
- Edge on Windows (with haptic hardware)

**Limited/Unsupported:**

- Desktop browsers (except Windows with haptic hardware)
- Firefox (limited support)
- Older mobile browsers

## Migration Guide

### Updating Existing Components

**Before:**

```typescript
<Button onClick={handleClick}>Click Me</Button>
```

**After (automatic haptic):**

```typescript
<Button onClick={handleClick}>Click Me</Button>
// No changes needed - haptic feedback is automatic
```

**After (custom haptic):**

```typescript
<Button hapticType="success" onClick={handleClick}>
  Save Changes
</Button>
```

### Adding Haptic to Custom Components

**Before:**

```typescript
function CustomButton({ onClick, children }) {
  return <div onClick={onClick}>{children}</div>;
}
```

**After:**

```typescript
function CustomButton({ onClick, children }) {
  const { triggerTapHaptic } = useHapticInteractions();

  const handleClick = (e) => {
    triggerTapHaptic();
    onClick?.(e);
  };

  return <div onClick={handleClick}>{children}</div>;
}
```

## Conclusion

The haptic integration system provides a comprehensive, user-controlled, and performant solution for tactile feedback across the P2P.me platform. By following the patterns and guidelines outlined in this document, developers can create consistent and accessible haptic experiences that enhance user engagement and accessibility.

For additional support or feature requests, consult the haptic system test suite at `/dev/haptics` or refer to the source code documentation in the respective hook and component files.
