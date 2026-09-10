import { clsx } from "clsx";
import type { AriaAttributes, ReactElement, Ref } from "react";
import { Icon } from "./Icon.tsx";
import type { DataProps, FocusProps, MouseProps } from "./props.ts";
import styles from "./IconButton.module.css";

function IconButton({
  ref,
  icon,
  variant = "default",
  disabled,
  tabIndex,
  title,
  onClick,
  ...props
}: {
  ref?: Ref<HTMLButtonElement>;
  icon: string | ReactElement<any>;
  variant?: "default" | "ghost";
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
      {typeof icon === "string" ? <Icon shape={icon} /> : icon}
    </button>
  );
}

export { IconButton };
