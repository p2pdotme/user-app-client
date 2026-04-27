/**
 * Haptic Integration Examples
 *
 * This file demonstrates how to integrate haptic feedback with various
 * shadcn/ui components following UX best practices. These examples show
 * the recommended patterns for different types of user interactions.
 */

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHaptics } from "@/hooks/use-haptics";

/**
 * Example 1: Enhanced Button with Haptic Feedback
 *
 * Demonstrates different haptic patterns for different button actions.
 * Haptic feedback is triggered AFTER the primary action to provide confirmation.
 */
export function HapticButtonExample() {
  const {
    triggerTapHaptic,
    triggerSuccessHaptic,
    triggerWarningHaptic,
    triggerErrorHaptic,
  } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardClick = () => {
    // Perform the action first
    console.log("Standard button clicked");
    // Then provide haptic feedback
    triggerTapHaptic();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Form submitted successfully");
      // Success haptic for completed important action
      triggerSuccessHaptic();
    } catch (err) {
      console.error("Submit failed:", err);
      // Error haptic for failed action
      triggerErrorHaptic();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestructiveAction = () => {
    // Warning haptic before showing confirmation
    triggerWarningHaptic();
    // In a real app, you'd show a confirmation dialog here
    if (confirm("Are you sure you want to delete this item?")) {
      console.log("Item deleted");
      triggerSuccessHaptic(); // Success haptic after confirmation
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Button Haptic Examples</h3>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {/* Standard button with light tap feedback */}
        <Button onClick={handleStandardClick} className="w-full sm:w-auto">
          Standard Button (tap)
        </Button>

        {/* Submit button with success/error feedback */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          variant="default"
          className="w-full sm:w-auto">
          {isLoading ? "Submitting..." : "Submit Form (success/error)"}
        </Button>

        {/* Destructive action with warning feedback */}
        <Button
          onClick={handleDestructiveAction}
          variant="destructive"
          className="w-full sm:w-auto">
          Delete Item (warning → success)
        </Button>
      </div>
    </div>
  );
}

/**
 * Example 2: Enhanced Checkbox with Selection Feedback
 *
 * Provides subtle haptic feedback for state changes in form elements.
 */
export function HapticCheckboxExample() {
  const { triggerSelectionChangeHaptic } = useHaptics();
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckedChange = (checked: boolean) => {
    // Update state first
    setIsChecked(checked);
    // Then provide subtle selection feedback
    triggerSelectionChangeHaptic();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Checkbox Haptic Example</h3>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="haptic-checkbox"
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          className="mt-0.5 flex-shrink-0"
        />
        <label
          htmlFor="haptic-checkbox"
          className="cursor-pointer font-medium text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Enable notifications (selection feedback)
        </label>
      </div>
    </div>
  );
}

/**
 * Example 3: Enhanced Select with Selection Feedback
 *
 * Demonstrates haptic feedback for dropdown selections.
 */
export function HapticSelectExample() {
  const { triggerSelectionChangeHaptic } = useHaptics();
  const [selectedValue, setSelectedValue] = useState<string>("");

  const handleValueChange = (value: string) => {
    // Update state first
    setSelectedValue(value);
    // Then provide selection feedback
    triggerSelectionChangeHaptic();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Select Haptic Example</h3>

      <div className="space-y-3">
        <Select value={selectedValue} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>

        {selectedValue && (
          <p className="text-muted-foreground text-sm">
            Selected: {selectedValue}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Example 4: Custom Switch Component with Toggle Feedback
 *
 * Shows how to create a custom component with haptic feedback for state toggles.
 */
export function HapticSwitchExample() {
  const { triggerToggleStateHaptic } = useHaptics();
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = () => {
    // Update state first
    setIsEnabled(!isEnabled);
    // Then provide toggle feedback (more distinct than selection)
    triggerToggleStateHaptic();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Switch Haptic Example</h3>

      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"} `}
          role="switch"
          aria-checked={isEnabled}>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"} `}
          />
        </Button>
        <label
          htmlFor="haptics-toggle"
          className="cursor-pointer font-medium text-sm"
          onClick={handleToggle}>
          Dark mode {isEnabled ? "enabled" : "disabled"} (toggle feedback)
        </label>
      </div>
    </div>
  );
}

/**
 * Example 5: Form with Comprehensive Haptic Feedback
 *
 * Demonstrates a complete form with various haptic feedback patterns
 * for validation, submission, and error handling.
 */
export function HapticFormExample() {
  const {
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerSelectionChangeHaptic,
  } = useHaptics();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    agreeToTerms: false,
    category: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push("Name is required");
    }

    if (!formData.email.includes("@")) {
      newErrors.push("Valid email is required");
    }

    if (!formData.agreeToTerms) {
      newErrors.push("You must agree to the terms");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Error haptic for validation failure
      triggerErrorHaptic();
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Success haptic for successful submission
      triggerSuccessHaptic();
      console.log("Form submitted successfully:", formData);

      // Reset form
      setFormData({
        name: "",
        email: "",
        agreeToTerms: false,
        category: "",
      });
    } catch (submissionError) {
      // Error haptic for submission failure
      triggerErrorHaptic();
      setErrors(["Submission failed. Please try again."]);
      console.error("Form submission failed:", submissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Complete Form Haptic Example</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="haptics-name"
            className="mb-1 block font-medium text-sm">
            Name
          </label>
          <input
            id="haptics-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Enter your name"
          />
        </div>

        {/* Email input */}
        <div>
          <label
            htmlFor="haptics-email"
            className="mb-1 block font-medium text-sm">
            Email
          </label>
          <input
            id="haptics-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Enter your email"
          />
        </div>

        {/* Category select */}
        <div>
          <label
            htmlFor="haptics-category"
            className="mb-1 block font-medium text-sm">
            Category
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              handleInputChange("category", value);
              triggerSelectionChangeHaptic();
            }}>
            <SelectTrigger id="haptics-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => {
              handleInputChange("agreeToTerms", checked as boolean);
              triggerSelectionChangeHaptic();
            }}
            className="mt-0.5 flex-shrink-0"
          />
          <label
            htmlFor="terms"
            className="cursor-pointer text-sm leading-relaxed">
            I agree to the terms and conditions
          </label>
        </div>

        {/* Error display */}
        {errors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="space-y-1 text-red-600 text-sm dark:text-red-400">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Form"}
        </Button>
      </form>
    </div>
  );
}

/**
 * Complete Haptic Integration Examples Component
 *
 * Renders all examples in a single component for easy testing and demonstration.
 */
export function HapticIntegrationExamples() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="mb-6 text-muted-foreground text-sm leading-relaxed">
          These examples demonstrate how to integrate haptic feedback with
          shadcn/ui components. The feedback respects user preferences.
        </p>
      </div>

      <HapticButtonExample />
      <HapticCheckboxExample />
      <HapticSelectExample />
      <HapticSwitchExample />
      <HapticFormExample />

      <div className="mt-8 rounded-lg bg-muted p-4">
        <h4 className="mb-2 font-semibold">Integration Notes:</h4>
        <ul className="space-y-1 text-muted-foreground text-sm">
          <li>
            • Haptic feedback respects user preferences (all/essential/none)
          </li>
          <li>• Essential patterns: success, warning, error</li>
          <li>• All patterns: tap, selection, toggle + essential</li>
          <li>• Always trigger haptic AFTER the primary action</li>
        </ul>
      </div>
    </div>
  );
}
