# Haptic Feedback System

A comprehensive, extensible haptic feedback system for the P2P.me React PWA that enhances user experience through carefully designed tactile feedback patterns.

## Overview

The haptic feedback system provides semantic, context-aware vibration patterns that complement visual and auditory feedback. It integrates seamlessly with the existing settings system, allowing users to control their haptic experience.

## Features

- **User-Controlled Preferences**: Three levels of haptic feedback (`all`, `essential`, `none`)
- **Semantic Patterns**: Carefully designed patterns based on UX research for different emotional responses
- **Type-Safe Integration**: Fully typed TypeScript interface with auto-completion
- **Extensible Architecture**: Easy to add new patterns and categorize them appropriately
- **Performance Optimized**: Memoized functions to prevent unnecessary re-renders
- **Robust Error Handling**: Graceful fallbacks when vibration is not supported

## Installation

The haptic system is already integrated into the project. Simply import and use:

```tsx
import { useHaptics } from "@/hooks/use-haptics";
```

## Quick Start

```tsx
import { useHaptics } from "@/hooks/use-haptics";

function MyComponent() {
  const { tap, success, error } = useHaptics();

  const handleAction = async () => {
    try {
      await performSomeAction();
      success(); // Positive feedback for successful action
    } catch (err) {
      error(); // Clear negative feedback for errors
    }
  };

  return (
    <Button
      onClick={() => {
        handleButtonClick();
        tap(); // Light confirmation for standard interactions
      }}>
      Click me
    </Button>
  );
}
```

## Haptic Patterns

### Pattern Categories

- **`all`**: Triggered when user preference is set to "all"
- **`essential`**: Triggered when user preference is "essential" or "all"

### Available Patterns

| Pattern           | Category  | Duration         | Use Cases                                | Feeling                         |
| ----------------- | --------- | ---------------- | ---------------------------------------- | ------------------------------- |
| `tap`             | all       | 10ms             | Button clicks, icon taps, tab selection  | Quick, responsive, unobtrusive  |
| `selectionChange` | all       | 5ms              | Dropdown selections, checkbox changes    | Barely perceptible, gentle      |
| `toggleState`     | all       | 25ms             | Switch components, toggle buttons        | Clear binary state change       |
| `success`         | essential | 30-50-30ms       | Form submissions, saves, completions     | Satisfying, affirmative         |
| `warning`         | essential | 60-70-60ms       | Destructive actions, validation warnings | Attention-grabbing, cautionary  |
| `error`           | essential | 70-60-70-60-70ms | Failed submissions, critical errors      | Distinct, noticeable problem    |
| `peek`            | all       | 3-50-3ms         | Long-press previews, peek gestures       | Gentle hint, preview indication |

## Usage Guide

### Basic Integration

```tsx
import { useHaptics } from "@/hooks/use-haptics";

function FormComponent() {
  const { selectionChange, success, error } = useHaptics();

  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      success(); // Success feedback after completion
    } catch (err) {
      error(); // Error feedback for failures
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Checkbox
        onCheckedChange={(checked) => {
          updateFormData(checked);
          selectionChange(); // Subtle feedback for state changes
        }}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Advanced Usage with Conditional Patterns

```tsx
function SmartComponent() {
  const haptics = useHaptics();

  const handleComplexAction = (actionType: string) => {
    switch (actionType) {
      case "save":
        performSave();
        haptics.success();
        break;
      case "delete":
        haptics.warning(); // Warning before action
        if (confirmDelete()) {
          performDelete();
          haptics.success(); // Success after confirmation
        }
        break;
      default:
        performAction();
        haptics.tap();
    }
  };

  return <ActionButton onClick={() => handleComplexAction("save")} />;
}
```

## Integration with shadcn/ui Components

### Button

```tsx
<Button
  onClick={() => {
    performAction();
    tap(); // Light confirmation
  }}
>
  Standard Action
</Button>

<Button
  variant="destructive"
  onClick={() => {
    warning(); // Warning feedback
    showConfirmDialog();
  }}
>
  Delete Item
</Button>
```

### Checkbox

```tsx
<Checkbox
  checked={isChecked}
  onCheckedChange={(checked) => {
    setIsChecked(checked);
    selectionChange(); // Subtle state change feedback
  }}
/>
```

### Select

```tsx
<Select
  onValueChange={(value) => {
    setValue(value);
    selectionChange(); // Selection feedback
  }}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Form Validation

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    error(); // Error feedback for validation failure
    return;
  }

  try {
    await submitForm();
    success(); // Success feedback for completion
  } catch (err) {
    error(); // Error feedback for submission failure
  }
};
```

## Best Practices

### 1. Timing

- **Trigger AFTER the action**: Provide haptic feedback after the primary action completes
- **Don't block interactions**: Haptic feedback should be supplementary, not blocking

### 2. Pattern Selection

- **Match emotional tone**: Use patterns that match the emotional context of the interaction
- **Be consistent**: Use the same pattern for similar actions throughout the app
- **Respect hierarchy**: Use `essential` patterns sparingly for important feedback

### 3. Integration Guidelines

- **Complement other feedback**: Haptics should enhance, not replace visual/auditory feedback
- **Consider accessibility**: Haptics can aid users with visual impairments
- **Test on devices**: Always test haptic patterns on actual devices

### 4. Performance

- **Use memoized functions**: The hook provides memoized functions to prevent re-renders
- **Avoid overuse**: Too much haptic feedback can be annoying and drain battery

## User Settings Integration

The system automatically respects user preferences through the `useSettings` hook:

```typescript
// User preference types (already implemented in settings)
type HapticPreference = "all" | "essential" | "none";

// Behavior by preference:
// "none" - No haptic feedback
// "essential" - Only success, warning, error patterns
// "all" - All haptic patterns including tap, selection, toggle
```

Users can control their haptic experience through the app settings, and the system will automatically respect their choice.

## Extending the System

### Adding New Patterns

1. Add the pattern definition to `HAPTIC_PATTERNS` in `use-haptics.ts`:

```typescript
const HAPTIC_PATTERNS = {
  // ... existing patterns

  newPattern: {
    pattern: [50, 30, 50], // Vibration array
    category: "all", // or "essential"
    description: "Description of when to use this pattern",
  },
} as const;
```

2. Add the function to the `HapticFunctions` interface:

```typescript
interface HapticFunctions {
  // ... existing functions
  newPattern: () => void;
}
```

3. Add the memoized function in the hook return:

```typescript
return {
  // ... existing functions
  newPattern: useCallback(() => triggerHaptic("newPattern"), [triggerHaptic]),
};
```

### Custom Patterns for Specific Components

For component-specific patterns, you can create custom haptic hooks:

```typescript
function useCustomComponentHaptics() {
  const { triggerHaptic } = useHaptics();

  const customPattern = useCallback(() => {
    // Custom pattern logic
    triggerHaptic("tap");
    setTimeout(() => triggerHaptic("success"), 100);
  }, [triggerHaptic]);

  return { customPattern };
}
```

## Browser Support

The haptic system uses the [Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API):

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ❌ No support (gracefully degrades)
- **Mobile browsers**: ✅ Generally supported

The system gracefully handles browsers without vibration support.

## Performance Considerations

- Haptic functions are memoized to prevent unnecessary re-renders
- Vibration checks are performed efficiently with early returns
- Failed vibrations are handled silently to avoid console spam
- Settings are cached through the existing settings context

## Troubleshooting

### Common Issues

1. **No vibration on iOS Safari**: Safari doesn't support the Web Vibration API
2. **Vibration disabled**: Check if the device has vibration disabled in system settings
3. **Pattern not triggering**: Verify the user's haptic preference setting
4. **Performance issues**: Ensure you're not calling haptic functions excessively

### Debugging

Use the utility functions for debugging:

```typescript
import {
  getHapticPatternInfo,
  getAllHapticPatternNames,
} from "@/hooks/use-haptics";

// Get pattern information
console.log(getHapticPatternInfo("success"));
// { pattern: [30, 50, 30], category: "essential", description: "..." }

// Get all pattern names
console.log(getAllHapticPatternNames());
// ["tap", "selectionChange", "toggleState", ...]
```

## Examples

See `src/components/examples/haptic-integration-examples.tsx` for comprehensive examples showing:

- Button integration with different patterns
- Form validation with error/success feedback
- Checkbox and select integration
- Custom switch component
- Complete form with comprehensive haptic feedback

## Contributing

When adding new haptic patterns:

1. Research the emotional response you want to create
2. Test patterns on actual devices
3. Follow the naming convention (descriptive, action-based names)
4. Document the pattern's intended use case and feeling
5. Categorize appropriately (`all` vs `essential`)
6. Update this documentation

---

_This haptic feedback system is designed to enhance the native feel and emotional engagement of the P2P.me PWA while respecting user preferences and maintaining performance._
