import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export const SearchInput = ({
  value,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="Type your question here..."
        className="h-12 pr-9"
        value={value}
        onChange={onChange}
        {...props}
      />
      <Search className="-translate-y-1/2 absolute top-1/2 right-3 size-4 text-muted-foreground" />
    </div>
  );
};
