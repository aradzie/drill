import type { ReactNode } from "react";
import styles from "./ScreenCenter.module.css";

export function ScreenCenter({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
