import { clsx } from "clsx";
import type { AriaAttributes, ReactNode, Ref } from "react";
import type { DataProps, FocusProps, MouseProps } from "./props.ts";
import styles from "./Button.module.css";

function Button({
  ref,
  children,
  variant = "default",
  disabled,
  tabIndex,
  title,
  onClick,
  ...props
}: {
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
  variant?: "default" | "primary" | "ghost";
  title?: string;
} & FocusProps &
  MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <button
      ref={ref}
      className={clsx(styles.root, styles[variant])}
      disabled={disabled}
      tabIndex={tabIndex}
      title={title}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button };
