import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useId } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressSchema } from "@/tax/core/subgraph/schemas";
import { fyLabel, selectableFys } from "@/tax/lib/fy";

/** One person can have several wallets; FIFO runs across all of them. */
export const MAX_WALLETS = 10;

const AddressFormSchema = z.object({
  wallets: z
    .array(z.object({ address: AddressSchema }))
    .min(1)
    .max(MAX_WALLETS)
    .superRefine((list, ctx) => {
      const seen = new Set<string>();
      list.forEach((w, i) => {
        if (seen.has(w.address)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "address"],
            message: "This wallet is already in the list.",
          });
        }
        seen.add(w.address);
      });
    }),
});
type AddressFormInput = z.input<typeof AddressFormSchema>;
type AddressFormOutput = z.output<typeof AddressFormSchema>;

interface AddressFormProps {
  /** Wallets to show; changes from outside (e.g. "add this wallet") are applied */
  wallets: readonly string[];
  fy: number;
  onFyChange: (fy: number) => void;
  onGenerate: (addresses: string[]) => void;
  loading: boolean;
}

export function AddressForm({
  wallets,
  fy,
  onFyChange,
  onGenerate,
  loading,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddressFormInput, unknown, AddressFormOutput>({
    resolver: standardSchemaResolver(AddressFormSchema),
    defaultValues: {
      wallets: (wallets.length > 0 ? wallets : [""]).map((address) => ({
        address,
      })),
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "wallets",
  });

  // Keep the inputs in sync when a wallet is added from the report
  const walletsKey = wallets.join(",");
  useEffect(() => {
    if (walletsKey) {
      reset({ wallets: walletsKey.split(",").map((address) => ({ address })) });
    }
  }, [walletsKey, reset]);

  const baseId = useId();
  const fyId = useId();

  return (
    <form
      onSubmit={handleSubmit(({ wallets: list }) =>
        onGenerate(list.map((w) => w.address)),
      )}
      noValidate
      className="no-print flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fields.map((field, i) => {
          const id = `${baseId}-${i}`;
          const error = errors.wallets?.[i]?.address?.message;
          return (
            <div key={field.id} className="flex flex-col gap-2">
              <Label htmlFor={id}>
                {i === 0 ? "Wallet address" : `Wallet address ${i + 1}`}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={id}
                  {...register(`wallets.${i}.address`)}
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className="h-10 font-mono text-sm"
                />
                {i > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    aria-label={`Remove wallet ${i + 1}`}
                    onClick={() => remove(i)}>
                    <X />
                  </Button>
                )}
              </div>
              {error && (
                <p
                  id={`${id}-error`}
                  role="alert"
                  className="text-destructive text-sm">
                  {error}
                </p>
              )}
            </div>
          );
        })}
        {fields.length < MAX_WALLETS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-primary"
            onClick={() => append({ address: "" })}>
            <Plus />
            Add another wallet of yours
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={fyId}>Financial year</Label>
        <Select value={String(fy)} onValueChange={(v) => onFyChange(Number(v))}>
          <SelectTrigger id={fyId} className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectableFys().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {fyLabel(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin" /> : <Search />}
        Generate report
      </Button>
    </form>
  );
}
