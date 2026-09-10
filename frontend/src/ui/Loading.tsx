import { ScreenCenter } from "./ScreenCenter.tsx";
import styles from "./Loading.module.css";

export function Loading({ message = "Loading…" }: { message?: string }) {
  return (
    <ScreenCenter>
      <div className={styles.root} role="status">
        {message}
      </div>
    </ScreenCenter>
  );
}
