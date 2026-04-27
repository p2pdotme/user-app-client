import { cn } from "@/lib/utils";

export function Twitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 17"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M9.49752 6.82359L15.3395 0H13.9749L8.87296 5.92118L4.77554 0H3.41096H1.36425H1.14431H0L6.19736 9.02668L0 16.2196H1.45242L6.82658 9.94273L11.136 16.2196H11.3782H12.5887H14.5476H15.0098H16L9.49752 6.82359ZM2.1259 1.10038H4.16662L8.096 6.82325L6.9813 8.11696L2.1259 1.10038ZM11.8271 15.1196L7.61085 9.02702L8.71956 7.73198L13.7916 15.1196H11.8271Z"
        fill="currentColor"
      />
    </svg>
  );
}
