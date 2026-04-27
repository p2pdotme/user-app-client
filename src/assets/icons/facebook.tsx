import { cn } from "@/lib/utils";

export function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <path
        d="M8 0C3.58172 0 0 3.58172 0 8C0 11.993 2.925 15.302 6.75 15.902V10.3125H4.71875V8H6.75V6.2375C6.75 4.2325 7.94438 3.125 9.77156 3.125C10.6472 3.125 11.5625 3.28125 11.5625 3.28125V5.25H10.5544C9.56 5.25 9.25 5.86688 9.25 6.5V8H11.4688L11.1141 10.3125H9.25V15.902C13.075 15.302 16 11.993 16 8C16 3.58172 12.4183 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
