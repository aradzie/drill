import type { AriaAttributes, Ref } from "react";
import type { DataProps, FocusProps, MouseProps } from "./props.ts";
import styles from "./Select.module.css";

function Select<T extends string>({
  ref,
  value,
  options,
  disabled,
  tabIndex,
  title,
  onChange,
  ...props
}: {
  ref?: Ref<HTMLSelectElement>;
  value: T;
  options: readonly { value: T; name: string }[];
  title?: string;
  onChange: (value: T) => void;
} & FocusProps &
  MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <select
      ref={ref}
      className={styles.root}
      value={value}
      disabled={disabled}
      tabIndex={tabIndex}
      title={title}
      onChange={(e) => onChange(e.target.value as T)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

export { Select };
