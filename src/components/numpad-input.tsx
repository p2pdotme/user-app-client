import type { TFunction } from "i18next";
import { Delete } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumpadInputProps {
  onChange: (value: string) => void;
  onMax: () => void;
  onClear: () => void;
  onDelete: () => void;
  /**
   * Whether to provide haptic feedback for numpad interactions
   * @default true
   */
  hapticFeedback?: boolean;
}

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "Delete"],
  ["Max", "Clear"],
];

const renderKey = (key: string, t: TFunction) => {
  switch (key) {
    case "Delete":
      return <Delete className="size-6" />;
    default:
      return Number.isNaN(Number(key)) && key !== "."
        ? t(key.toUpperCase())
        : key;
  }
};

/**
 * Get the appropriate haptic type for different numpad keys
 */
const getHapticTypeForKey = (
  key: string,
): "tap" | "success" | "error" | "warning" => {
  switch (key) {
    case "Max":
      return "tap"; // Significant action but not necessarily success
    case "Clear":
      return "tap"; // Reset action
    case "Delete":
      return "tap"; // Delete action
    default:
      return "tap"; // Number and decimal inputs
  }
};

export function NumpadInput({
  onChange,
  onMax,
  onClear,
  onDelete,
  hapticFeedback = true,
}: NumpadInputProps) {
  const { t } = useTranslation();

  const handleKeyPress = (key: string) => {
    switch (key) {
      case "Delete":
        onDelete();
        break;
      case "Max":
        onMax();
        break;
      case "Clear":
        onClear();
        break;
      default:
        onChange(key);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-between">
      {keys.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "grid w-full",
            row.length === 3 && "grid-cols-3",
            row.length === 2 && "grid-cols-2",
          )}>
          {row.map((key) => (
            <Button
              key={key}
              variant="ghost"
              hapticFeedback={hapticFeedback}
              hapticType={getHapticTypeForKey(key)}
              className={cn(
                "font-medium text-2xl",
                (key === "Max" || key === "Clear") && "text-md text-primary",
              )}
              onClick={() => handleKeyPress(key)}>
              {renderKey(key, t)}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}
