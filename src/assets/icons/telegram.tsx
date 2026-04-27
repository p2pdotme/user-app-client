import { cn } from "@/lib/utils";

export function Telegram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 23 18"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M6.61499 10.7949L8.71957 16.4771"
        stroke="currentColor"
        strokeWidth="1.00722"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.96026 11.8477L8.74976 16.5375L11.7681 13.9784L8.96026 11.8477Z"
        stroke="currentColor"
        strokeWidth="1.00722"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.841 0.662544L1.64246 7.95757C1.10008 8.16355 1.11443 8.93583 1.66412 9.12166L6.6151 10.7947L17.8891 4.02262L8.96015 11.8467L15.9112 17.1217C16.6344 17.6704 17.6829 17.3015 17.903 16.421L21.6607 1.39076C21.7818 0.905786 21.3081 0.485021 20.841 0.662544Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
