import { cn } from "@/lib/utils";

export function Binance(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M4.93 6.46L8 3.39L11.07 6.46L12.86 4.67L8 -0.19L3.14 4.67L4.93 6.46ZM0 8L1.79 6.21L3.58 8L1.79 9.79L0 8ZM4.93 9.54L8 12.61L11.07 9.54L12.86 11.33L8 16.19L3.14 11.33L4.93 9.54ZM12.42 8L14.21 6.21L16 8L14.21 9.79L12.42 8ZM9.81 8L8 6.19L6.19 8L8 9.81L9.81 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
