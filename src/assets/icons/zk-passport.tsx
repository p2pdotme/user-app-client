import { cn } from "@/lib/utils";

export function ZkPassport(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M4 2C2.89543 2 2 2.89543 2 4V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V4C22 2.89543 21.1046 2 20 2H4Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M6 6H18V8H6V6Z" fill="currentColor" />
      <path d="M6 10H18V12H6V10Z" fill="currentColor" />
      <path d="M6 14H12V16H6V14Z" fill="currentColor" />
      <path
        d="M16 14C16.5523 14 17 14.4477 17 15C17 15.5523 16.5523 16 16 16C15.4477 16 15 15.5523 15 15C15 14.4477 15.4477 14 16 14Z"
        fill="currentColor"
      />
      <path
        d="M16 17C16.5523 17 17 17.4477 17 18C17 18.5523 16.5523 19 16 19C15.4477 19 15 18.5523 15 18C15 17.4477 15.4477 17 16 17Z"
        fill="currentColor"
      />
      <path
        d="M16 20C16.5523 20 17 20.4477 17 21C17 21.5523 16.5523 22 16 22C15.4477 22 15 21.5523 15 21C15 20.4477 15.4477 20 16 20Z"
        fill="currentColor"
      />
    </svg>
  );
}
