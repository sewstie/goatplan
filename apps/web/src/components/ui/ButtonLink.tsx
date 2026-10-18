import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonClasses, type ButtonStyle } from "./Button";
import { cx } from "./cx";

type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> &
  ButtonStyle & {
    href: string;
    icon?: ReactNode;
    /** Opens in a new tab and says so to screen readers. */
    external?: boolean;
  };

/** A link that looks like a Button, like "Open Workday". */
export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  icon,
  external = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(buttonClasses({ variant, size, fullWidth }), className);

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
