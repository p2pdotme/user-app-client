import { FileDown, FileUp, Lock } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { NonHomeHeader } from "@/components/non-home-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { usePageMeta } from "@/hooks/use-page-meta";
import { INTERNAL_HREFS } from "@/lib/constants";
import { useTaxSettings } from "@/tax/contexts";
import { SPECIFIED_PERSON_TEST } from "@/tax/core/tax/rules";
import { downloadText } from "@/tax/lib/download";
import { parseManualData, serializeManualData } from "@/tax/lib/manual-data";
import { AmountInputSchema, isValidOptional } from "@/tax/lib/schemas";
import {
  COST_METHOD_DISCLOSURE,
  COST_METHODS,
  costMethodOption,
} from "@/tax/pages/report/cost-methods";
import { LotsEditor, TdsEditor } from "@/tax/pages/report/manual-entries";

interface Option<T extends string> {
  value: T;
  label: string;
}

function SwitchSetting({
  id,
  label,
  help,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id} className="font-medium text-base">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs">{help}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-1"
      />
    </div>
  );
}

function RadioSetting<T extends string>({
  legend,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-medium">{legend}</legend>
      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(v) => onChange(v as T)}
        className="gap-3">
        {options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className="font-normal">
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} />
            {o.label}
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function Section({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="py-5">{children}</div>
      <Separator />
    </>
  );
}

/** Tax profile: the choices and manual entries behind the report (/tax/config). */
export function Config() {
  usePageMeta({ title: "Tax profile" });
  const navigate = useNavigate();
  const { data, setData, updateSettings, setLots, setTds, setOtherGifts } =
    useTaxSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const incomeId = useId();
  const userSpecifiedId = useId();
  const counterpartySpecifiedId = useId();
  const s = data.settings;
  const incomeValid = isValidOptional(AmountInputSchema, s.otherIncome);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const result = parseManualData(await file.text());
    if (fileRef.current) fileRef.current.value = "";
    result.match(
      (imported) => {
        setData(imported);
        const forOther =
          imported.wallets.length > 0 &&
          data.wallets.length > 0 &&
          !imported.wallets.some((w) => data.wallets.includes(w));
        toast.success("Tax profile imported", {
          description: `${imported.lots.length} lot(s), ${imported.tds.length} TDS entr${imported.tds.length === 1 ? "y" : "ies"}.${forOther ? " The file was saved for a different wallet; its entries now apply to the wallet shown." : ""}`,
        });
      },
      () =>
        toast.error("Could not import this file", {
          description: "It must be a JSON file exported by this app.",
        }),
    );
  };

  const onExport = () => {
    downloadText(
      "p2p-tax-manual-entries.json",
      serializeManualData(data),
      "application/json",
    );
    toast.success("Tax profile exported", {
      description: "Saved p2p-tax-manual-entries.json",
    });
  };

  return (
    <>
      <NonHomeHeader
        title="Tax profile"
        subtitle="India · Crypto (VDA) income tax"
        showHelp={false}
        onBack={() => navigate(INTERNAL_HREFS.TAX)}
      />
      <main
        aria-label="Tax profile"
        className="no-scrollbar container-narrow flex h-full w-full flex-col overflow-y-auto pb-8">
        <p className="pt-5 text-muted-foreground text-sm">
          Kept until you close or reload the app. Export to save them.
        </p>
        <Section>
          <div className="flex flex-col gap-3">
            <RadioSetting
              legend="Cost method"
              value={s.costMethod}
              disabled={s.costMethodLocked}
              onChange={(costMethod) => updateSettings({ costMethod })}
              options={COST_METHODS.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
            />
            <p
              data-testid="method-disclosure"
              className="text-muted-foreground text-xs">
              {COST_METHOD_DISCLOSURE}
              {s.costMethod === "SPECIFIC" &&
                " Pick the purchase for each sale in the Schedule VDA tab; sales you do not tag use the oldest purchase first."}
            </p>
            {s.costMethodLocked ? (
              <p
                data-testid="method-locked"
                className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Lock className="size-3.5" />
                Locked to {costMethodOption(s.costMethod).name}. The lock is
                saved when you export.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs">
                  Optional: lock it so it cannot change by mistake.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => updateSettings({ costMethodLocked: true })}>
                  <Lock />
                  Lock this method
                </Button>
              </div>
            )}
          </div>
        </Section>
        <Section>
          <SwitchSetting
            id={userSpecifiedId}
            label='I am a "specified person" (for my purchases)'
            help={`${SPECIFIED_PERSON_TEST} Your own limit for deducting TDS when you buy: ₹50,000 if yes, ₹10,000 if no.`}
            checked={s.userSpecifiedPerson}
            onChange={(userSpecifiedPerson) =>
              updateSettings({ userSpecifiedPerson })
            }
          />
        </Section>
        <Section>
          <SwitchSetting
            id={counterpartySpecifiedId}
            label='Buyers of my USDC are "specified persons"'
            help="Their status is usually unknown. Liquidity providers are generally in business, so the ₹10,000 limit is used by default."
            checked={s.counterpartySpecifiedPerson}
            onChange={(counterpartySpecifiedPerson) =>
              updateSettings({ counterpartySpecifiedPerson })
            }
          />
        </Section>
        <Section>
          <RadioSetting
            legend="Tax regime"
            value={s.regime}
            onChange={(regime) => updateSettings({ regime })}
            options={[
              { value: "NEW", label: "New regime" },
              { value: "OLD", label: "Old regime" },
            ]}
          />
        </Section>
        <Section>
          <div className="flex flex-col gap-2">
            <Label htmlFor={incomeId} className="font-medium text-base">
              Other total income (₹)
            </Label>
            <p className="text-muted-foreground text-xs">
              Salary, interest, etc. Used only to decide surcharge.
            </p>
            <Input
              id={incomeId}
              inputMode="decimal"
              value={s.otherIncome}
              onChange={(e) =>
                updateSettings({ otherIncome: e.target.value.slice(0, 30) })
              }
              aria-invalid={!incomeValid}
            />
            {!incomeValid && (
              <p className="text-destructive text-xs">Invalid value</p>
            )}
          </div>
        </Section>
        <Section>
          <RadioSetting
            legend="Head of income"
            value={s.headOfIncome}
            onChange={(headOfIncome) => updateSettings({ headOfIncome })}
            options={[
              { value: "CAPITAL_GAINS", label: "Capital Gain (ITR-2)" },
              {
                value: "BUSINESS",
                label: "Business Income (trading as a business, ITR-3)",
              },
            ]}
          />
          <p className="mt-3 text-muted-foreground text-xs">
            Frequent trading or acting as a liquidity provider points to
            business income. Buying USDC to spend it (Pay) is capital gains.
          </p>
        </Section>
        {data.notMyWallets.length > 0 && (
          <Section>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-medium">
                Wallets you said are not yours
              </legend>
              <p className="text-muted-foreground text-xs">
                Purchases delivered here are not counted as your cost.
              </p>
              {data.notMyWallets.map((w) => (
                <div
                  key={w}
                  className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm">
                    {w.slice(0, 6)}…{w.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setData({
                        ...data,
                        notMyWallets: data.notMyWallets.filter((x) => x !== w),
                      })
                    }>
                    Undo
                  </Button>
                </div>
              ))}
            </fieldset>
          </Section>
        )}
        <Section>
          <LotsEditor
            lots={data.lots}
            onChange={setLots}
            otherGifts={data.otherGifts}
            onOtherGiftsChange={setOtherGifts}
          />
        </Section>
        <Section>
          <TdsEditor entries={data.tds} onChange={setTds} />
        </Section>
        <div className="flex flex-col gap-3 pt-5">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <FileDown />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}>
              <FileUp />
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              data-testid="import-json"
              onChange={(e) => void onImport(e.target.files?.[0])}
            />
          </div>
        </div>
      </main>
    </>
  );
}
