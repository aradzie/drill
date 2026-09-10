import * as Radix from "@radix-ui/react-radio-group";
import type { ReactNode } from "react";
import type { MouseProps } from "./props.ts";
import styles from "./RadioGroup.module.css";

function RadioGroup({
  value,
  children,
  disabled,
  onValueChange,
}: {
  children: ReactNode;
  value: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <Radix.Root className={styles.root} value={value} disabled={disabled} onValueChange={onValueChange}>
      {children}
    </Radix.Root>
  );
}

function RadioItem({
  children,
  id,
  value,
  ...props
}: { children: ReactNode; id?: string; value: string } & MouseProps) {
  return (
    <label className={styles.item} htmlFor={id ?? value} {...props}>
      <Radix.Item className={styles.radio} value={value} id={id ?? value}>
        <Radix.Indicator className={styles.indicator} />
      </Radix.Item>
      {children}
    </label>
  );
}

export { RadioGroup, RadioItem };
