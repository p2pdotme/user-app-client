import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  amount: string;
  onChange: (value: string) => void;
  balance: string | undefined;
  balanceExists: boolean;
  isBalanceLoading: boolean;
  disabled?: boolean;
};

export function AmountInput({
  amount,
  onChange,
  balance,
  balanceExists,
  isBalanceLoading,
  disabled,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) onChange(v);
  };

  const handleMax = () => {
    if (balance && balanceExists) onChange(balance.replace(/0+$/, "").replace(/\.$/, ""));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">From · SPL P2P on Solana (devnet)</span>
        {isBalanceLoading ? (
          <Skeleton className="h-3.5 w-20" />
        ) : (
          <span className="text-muted-foreground text-xs">
            Balance:{" "}
            {balanceExists ? (
              <span className="font-medium text-foreground">{balance} P2P</span>
            ) : (
              <span className="text-destructive">No SPL P2P found</span>
            )}
          </span>
        )}
      </div>

      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.000000"
          value={amount}
          onChange={handleChange}
          disabled={disabled}
          className="pr-28 text-lg font-medium"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {balanceExists && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={handleMax}
              disabled={disabled}>
              MAX
            </Button>
          )}
          <span className="text-muted-foreground text-sm">P2P</span>
        </div>
      </div>
    </div>
  );
}
