import { cn } from "@/lib/utils";

export function SwapRouteRightArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M19 8L12 1V5H1.8C1.51997 5 1.37996 5 1.273 5.0545C1.17892 5.10243 1.10243 5.17892 1.0545 5.273C1 5.37996 1 5.51997 1 5.8V10.2C1 10.48 1 10.62 1.0545 10.727C1.10243 10.8211 1.17892 10.8976 1.273 10.9455C1.37996 11 1.51997 11 1.8 11H12V15L19 8Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
