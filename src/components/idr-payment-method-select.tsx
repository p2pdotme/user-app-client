import {
  IDR_PAYMENT_PROVIDERS,
  type IndonesianPaymentProviderOption,
} from "@p2pdotme/sdk/country";
import { Landmark, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type IdrPaymentMethod = (typeof IDR_PAYMENT_PROVIDERS)[number]["name"];

export const DEFAULT_IDR_PAYMENT_METHOD: IdrPaymentMethod =
  IDR_PAYMENT_PROVIDERS[0].name;

interface IdrPaymentMethodSelectProps {
  value: IdrPaymentMethod;
  onChange: (value: IdrPaymentMethod) => void;
}

function ProviderIcon({
  provider,
}: {
  provider: IndonesianPaymentProviderOption;
}) {
  if (provider.name === "GoPay") {
    return <ASSETS.ICONS.GoPay className="size-4" />;
  }
  if (provider.type === "bank") {
    return <Landmark className="size-4 text-muted-foreground" />;
  }
  return <Wallet className="size-4 text-muted-foreground" />;
}

/** Payment method picker for Indonesia, listing every SDK `IDR_PAYMENT_PROVIDERS` entry. */
export function IdrPaymentMethodSelect({
  value,
  onChange,
}: IdrPaymentMethodSelectProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="font-medium text-md">{t("PAYMENT_METHOD")}</p>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as IdrPaymentMethod)}>
        <SelectTrigger className="h-10 w-full border-none bg-primary/10">
          <SelectValue placeholder={t("SELECT_PAYMENT_METHOD")} />
        </SelectTrigger>
        <SelectContent className="rounded-md border-none">
          {IDR_PAYMENT_PROVIDERS.map((provider) => (
            <SelectItem key={provider.name} value={provider.name}>
              <div className="flex items-center gap-2">
                <ProviderIcon provider={provider} />
                <p className="font-medium text-sm">{provider.name}</p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
