import type { FallbackProps } from "react-error-boundary";
import { Button } from "./ui/Button.tsx";
import { ScreenCenter } from "./ui/ScreenCenter.tsx";
import styles from "./ErrorFallback.module.css";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ScreenCenter>
      <div className={styles.root} role="alert">
        <p>Something went wrong.</p>
        <p>{String(error)}</p>
        <p>
          <Button onClick={() => resetErrorBoundary()}>Try again</Button>
        </p>
      </div>
    </ScreenCenter>
  );
}
