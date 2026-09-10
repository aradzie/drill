import * as Radix from "@radix-ui/react-checkbox";
import type { MouseProps } from "./props.ts";
import styles from "./Checkbox.module.css";

function Checkbox({
  id,
  checked,
  disabled,
  onCheckedChange,
  ...props
}: {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
} & MouseProps) {
  return (
    <Radix.Root
      id={id}
      className={styles.root}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      {...props}
    >
      <Radix.Indicator className={styles.indicator}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Radix.Indicator>
    </Radix.Root>
  );
}

export { Checkbox };
