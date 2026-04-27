import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHapticInteractions } from "@/hooks/use-haptic-interactions";

/**
 * Test component to verify haptic feedback functionality
 * This component demonstrates the enhanced Button, Checkbox, and Select components
 * with haptic feedback capabilities
 */
export function TestHapticComponents() {
  const [isChecked, setIsChecked] = useState(false);
  const [selectValue, setSelectValue] = useState<string>("");
  const { withHapticClick, withHapticSubmit } = useHapticInteractions();

  const handleStandardClick = () => {
    console.log("Standard button clicked with haptic feedback");
  };

  const handleSuccessClick = () => {
    console.log("Success button clicked with haptic feedback");
  };

  const handleErrorClick = () => {
    console.log("Error button clicked with haptic feedback");
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    console.log("Checkbox changed:", checked);
  };

  const handleSelectChange = (value: string) => {
    setSelectValue(value);
    console.log("Select changed:", value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with haptic feedback");
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Button Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Standard button with default haptic feedback */}
          <Button onClick={handleStandardClick} className="w-full">
            Standard Button (Default Haptic)
          </Button>

          {/* Success button with success haptic */}
          <Button
            onClick={handleSuccessClick}
            hapticType="success"
            variant="default"
            className="w-full">
            Success Button (Success Haptic)
          </Button>

          {/* Error button with error haptic */}
          <Button
            onClick={handleErrorClick}
            hapticType="error"
            variant="destructive"
            className="w-full">
            Error Button (Error Haptic)
          </Button>

          {/* Button with haptic feedback disabled */}
          <Button
            onClick={() => console.log("Silent button clicked")}
            hapticFeedback={false}
            variant="outline"
            className="w-full">
            Silent Button (No Haptic)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Checkbox Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checkbox with default haptic feedback */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="haptic-checkbox"
              checked={isChecked}
              onCheckedChange={handleCheckboxChange}
            />
            <label htmlFor="haptic-checkbox" className="font-medium text-sm">
              Checkbox with Haptic Feedback
            </label>
          </div>

          {/* Checkbox with haptic feedback disabled */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="silent-checkbox"
              hapticFeedback={false}
              onCheckedChange={(checked) =>
                console.log("Silent checkbox:", checked)
              }
            />
            <label htmlFor="silent-checkbox" className="font-medium text-sm">
              Checkbox without Haptic Feedback
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Select Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select with default haptic feedback */}
          <div className="space-y-2">
            <label htmlFor="haptic-select" className="font-medium text-sm">
              Select with Haptic Feedback:
            </label>
            <Select value={selectValue} onValueChange={handleSelectChange}>
              <SelectTrigger id="haptic-select" className="w-full">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select with haptic feedback disabled */}
          <div className="space-y-2">
            <label htmlFor="silent-select" className="font-medium text-sm">
              Select without Haptic Feedback:
            </label>
            <Select
              hapticFeedback={false}
              onValueChange={(value) => console.log("Silent select:", value)}>
              <SelectTrigger id="silent-select" className="w-full">
                <SelectValue placeholder="Choose an option (silent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silent1">Silent Option 1</SelectItem>
                <SelectItem value="silent2">Silent Option 2</SelectItem>
                <SelectItem value="silent3">Silent Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Haptic Interaction Hooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form with haptic submit */}
          <form
            onSubmit={withHapticSubmit(handleFormSubmit)}
            className="space-y-4">
            <Button type="submit" className="w-full">
              Submit Form (Success Haptic)
            </Button>
          </form>

          {/* Button with haptic click wrapper */}
          <Button
            onClick={withHapticClick(
              () => console.log("Wrapped click"),
              "warning",
            )}
            variant="outline"
            className="w-full">
            Wrapped Click Handler (Warning Haptic)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Checkbox State:</strong>{" "}
              {isChecked ? "Checked" : "Unchecked"}
            </p>
            <p>
              <strong>Select Value:</strong> {selectValue || "None selected"}
            </p>
            <p className="text-muted-foreground">
              Check the browser console for interaction logs and test on a
              mobile device for haptic feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
