import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const GearIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4v-4h.09A1.7 1.7 0 0 0 4.2 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.6 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.4h4v.09a1.7 1.7 0 0 0 1 1.71 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.6c.14.4.35.75.6 1 .3.27.69.41 1.1.4h.09v4h-.09a1.7 1.7 0 0 0-1.7 1Z" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const KeyIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
  </Icon>
);

export const UploadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 16V4m0 0L7 9m5-5 5 5" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}><path d="M5 12h14m-5-5 5 5-5 5" /></Icon>
);

export const BackLoopIcon = (props: IconProps) => (
  <Icon {...props}><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>
);

export const EyeIcon = (props: IconProps) => (
  <Icon {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></Icon>
);

export const EyeOffIcon = (props: IconProps) => (
  <Icon {...props}><path d="m3 3 18 18M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-2.1 2.8M6.6 6.7C3.6 8.4 2 12 2 12s3.5 6 10 6c1 0 2-.15 2.8-.42" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" /></Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>
);

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></Icon>
);
