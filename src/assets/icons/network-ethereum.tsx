import { cn } from "@/lib/utils";

export function NetworkEthereum(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn("size-4", props.className)}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <rect
        x="0.923828"
        width="16.0761"
        height="16.0761"
        rx="2.91033"
        fill="#627EEA"
      />
      <path
        d="M8.8916 3.04883V6.57286L11.8701 7.90371L8.8916 3.04883Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path
        d="M8.89144 3.04883L5.9126 7.90371L8.89144 6.57286V3.04883Z"
        fill="white"
      />
      <path
        d="M8.8916 10.1879V12.5824L11.872 8.45898L8.8916 10.1879Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path
        d="M8.89144 12.5826V10.1878L5.9126 8.45898L8.89144 12.5826Z"
        fill="white"
      />
      <path
        d="M8.8916 9.63385L11.8701 7.90438L8.8916 6.57422V9.63385Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M5.9126 7.90438L8.89144 9.63386V6.57422L5.9126 7.90438Z"
        fill="white"
        fillOpacity="0.602"
      />
    </svg>
  );
}
