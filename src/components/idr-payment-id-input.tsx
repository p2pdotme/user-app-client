import {
  getIndonesianPaymentProviderType,
  IDR_BANK_ACCOUNT_PLACEHOLDER,
  IDR_PLACEHOLDER,
  parseIndonesianPaymentId,
  serializeCompoundPaymentId,
} from "@p2pdotme/sdk/country";
import { Clipboard, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  DEFAULT_IDR_PAYMENT_METHOD,
  type IdrPaymentMethod,
  IdrPaymentMethodSelect,
} from "@/components/idr-payment-method-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IdrPaymentIdInputProps {
  /** Stored value packed as `Provider|number` (empty when nothing is entered). */
  value: string;
  onChange: (packed: string) => void;
}

function splitStoredValue(value: string): {
  provider: IdrPaymentMethod;
  number: string;
} {
  const parsed = parseIndonesianPaymentId(value);
  if (!parsed) return { provider: DEFAULT_IDR_PAYMENT_METHOD, number: "" };
  return { provider: parsed.provider as IdrPaymentMethod, number: parsed.value };
}

/**
 * IDR-specific payment ID editor: provider dropdown + phone/account number input.
 * Emits the packed `Provider|number` value (empty string when no number is typed).
 */
export function IdrPaymentIdInput({ value, onChange }: IdrPaymentIdInputProps) {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<IdrPaymentMethod>(
    () => splitStoredValue(value).provider,
  );
  const { number } = splitStoredValue(value);

  const isBank = getIndonesianPaymentProviderType(provider) === "bank";
  const numberLabelKey = isBank ? "ACCOUNT_NUMBER" : "PHONE_NUMBER";
  const placeholder = isBank ? IDR_BANK_ACCOUNT_PLACEHOLDER : IDR_PLACEHOLDER;

  const emit = (nextProvider: IdrPaymentMethod, nextNumber: string) => {
    const trimmed = nextNumber.trim();
    onChange(trimmed ? serializeCompoundPaymentId(nextProvider, trimmed) : "");
  };

  const handleProviderChange = (next: IdrPaymentMethod) => {
    setProvider(next);
    emit(next, number);
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText?.trim()) {
        emit(provider, clipboardText);
      } else {
        toast.warning(t("INVALID_PAYMENT_DETAILS_FORMAT"));
      }
    } catch (err) {
      toast.error((err as Error).message);
      console.error("Clipboard error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <IdrPaymentMethodSelect value={provider} onChange={handleProviderChange} />
      </div>
      <div className="space-y-2">
        <p className="font-medium text-sm">{t(numberLabelKey)}</p>
        <div className="relative">
          <Input
            placeholder={placeholder}
            className="pr-10"
            value={number}
            onChange={(e) => emit(provider, e.target.value)}
          />
          <div className="absolute top-0 right-0 flex h-full">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-full"
              onClick={number ? () => emit(provider, "") : handlePaste}>
              {number ? (
                <X className="size-4 text-primary" />
              ) : (
                <Clipboard className="size-4 text-primary" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
