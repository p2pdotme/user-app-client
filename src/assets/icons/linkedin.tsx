import { cn } from "@/lib/utils";

export function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 14"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M0.108643 13.147H3.04748V3.87891H0.108643V13.147Z"
        fill="currentColor"
      />
      <path
        d="M5.1228 3.60742H8.05176L8.06164 4.85388H8.09493C8.75903 4.13111 9.41456 3.60742 10.5355 3.60742C12.096 3.60742 14.2712 4.45675 14.2712 7.03997V13.1467H11.3324V7.90742C11.3324 6.98625 10.7513 6.101 9.80478 6.101C8.92481 6.101 8.06132 6.98625 8.06132 7.90742V13.1467H5.1228V3.60742Z"
        fill="currentColor"
      />
      <path
        d="M1.57802 3.15604C2.44953 3.15604 3.15603 2.44954 3.15603 1.57803C3.15603 0.70651 2.44953 0 1.57802 0C0.7065 0 0 0.70651 0 1.57803C0 2.44954 0.7065 3.15604 1.57802 3.15604Z"
        fill="currentColor"
      />
    </svg>
  );
}
