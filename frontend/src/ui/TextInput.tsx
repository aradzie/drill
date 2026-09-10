import type { AriaAttributes, Ref } from "react";
import type { DataProps, FocusProps, MouseProps } from "./props.ts";
import styles from "./TextInput.module.css";

function TextInput({
  ref,
  type = "text",
  value,
  placeholder,
  disabled,
  tabIndex,
  title,
  onChange,
  ...props
}: {
  ref?: Ref<HTMLInputElement>;
  type?: "text" | "email" | "password" | "search" | "url";
  value: string;
  placeholder?: string;
  title?: string;
  onChange: (value: string) => void;
} & FocusProps &
  MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <input
      ref={ref}
      className={styles.root}
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      tabIndex={tabIndex}
      title={title}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}

export { TextInput };
