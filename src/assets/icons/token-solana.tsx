import { cn } from "@/lib/utils";

export function TokenSolana(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", props.className)}
      {...props}>
      <rect width="32" height="32" rx="16" fill="black" />
      <path
        d="M9.11037 20.212C9.23364 20.0887 9.40275 20.0168 9.58252 20.0168H25.873C26.1706 20.0168 26.3195 20.3759 26.1093 20.5865L22.8912 23.8047C22.7679 23.9279 22.5988 23.9998 22.419 23.9998H6.12852C5.83101 23.9998 5.68206 23.6407 5.89225 23.4301L9.11037 20.212Z"
        fill="url(#paint0_linear_2615_10037)"
      />
      <path
        d="M9.10994 8.19714C9.23835 8.07386 9.40745 8.00195 9.58209 8.00195H25.8726C26.1701 8.00195 26.3191 8.3611 26.1089 8.57169L22.8908 11.7898C22.7675 11.9131 22.5984 11.985 22.4186 11.985H6.12809C5.83058 11.985 5.68163 11.6258 5.89182 11.4153L9.10994 8.19714Z"
        fill="url(#paint1_linear_2615_10037)"
      />
      <path
        d="M22.8912 14.1664C22.7679 14.0431 22.5988 13.9712 22.419 13.9712H6.12852C5.83101 13.9712 5.68206 14.3304 5.89225 14.541L9.11037 17.7591C9.23364 17.8824 9.40275 17.9543 9.58252 17.9543H25.873C26.1706 17.9543 26.3195 17.5951 26.1093 17.3845L22.8912 14.1664Z"
        fill="url(#paint2_linear_2615_10037)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_2615_10037"
          x1="24.9472"
          y1="8.85142"
          x2="12.3793"
          y2="25.2052"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3" />
          <stop offset="1" stop-color="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_2615_10037"
          x1="24.9472"
          y1="8.85142"
          x2="12.3793"
          y2="25.2052"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3" />
          <stop offset="1" stop-color="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_2615_10037"
          x1="24.9472"
          y1="8.85142"
          x2="12.3793"
          y2="25.2052"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3" />
          <stop offset="1" stop-color="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
