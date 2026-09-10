import { clsx } from "clsx";
import type { AriaAttributes, ReactNode, Ref } from "react";
import type { DataProps, FocusProps, MouseProps } from "./props.ts";
import styles from "./Chip.module.css";

function Chip({
  ref,
  children,
  active,
  disabled,
  tabIndex,
  title,
  onClick,
  ...props
}: {
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
  active?: boolean;
  title?: string;
} & FocusProps &
  MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <button
      ref={ref}
      className={clsx(styles.root, active && styles.active)}
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

export { Chip };
