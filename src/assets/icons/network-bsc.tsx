import { cn } from "@/lib/utils";

export function NetworkBsc(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn("size-4", props.className)}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <rect width="16" height="16" rx="2.89655" fill="#F0B90B" />
      <path
        d="M5.84157 7.13998L7.05283 5.93285L7.30834 5.67734L7.91365 5.07204L9.97486 7.13998L11.1748 5.93285L7.91365 2.66602L4.6416 5.93285L5.84157 7.13998Z"
        fill="white"
      />
      <path
        d="M7.91488 6.79313L6.70996 7.99805L7.91488 9.20297L9.1198 7.99805L7.91488 6.79313Z"
        fill="white"
      />
      <path
        d="M9.97486 8.86133L7.913 10.9234L7.18884 10.1993L7.05566 10.0661L5.84157 8.86133L4.6416 10.0613L7.91365 13.3279L11.1748 10.0613L9.97486 8.86133Z"
        fill="white"
      />
      <path
        d="M3.78304 6.79508L2.57812 8L3.78304 9.20492L4.98796 8L3.78304 6.79508Z"
        fill="white"
      />
      <path
        d="M12.0404 6.79508L10.8354 8L12.0404 9.20492L13.2453 8L12.0404 6.79508Z"
        fill="white"
      />
    </svg>
  );
}
