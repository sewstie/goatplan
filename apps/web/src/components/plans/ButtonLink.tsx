import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

// Stand-in until components/ui/Button can render a link: the same classes as Button's primary and
// secondary variants, for links that look like buttons.

type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  variant?: "primary" | "secondary";
  size?: "lg" | "sm";
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Opens in a new tab and says so to screen readers. */
  external?: boolean;
};

const variantClasses = {
  primary: "border-accent bg-accent text-on-accent hover:bg-accent/90",
  secondary: "border-line-button bg-surface text-ink hover:bg-surface-selected",
};

const sizeClasses = {
  lg: "min-h-36 gap-6 rounded-control px-11 py-9 text-11 leading-13-2 [&_svg]:size-16",
  sm: "min-h-32 gap-6 rounded-control px-9 py-7 text-10 leading-12 [&_svg]:size-16",
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "lg",
  icon,
  fullWidth = false,
  external = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center border font-570 whitespace-nowrap transition-[color,background-color,border-color] [&_svg]:shrink-0",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} {...rest}>
        {icon}
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
