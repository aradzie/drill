import { mdiClose } from "@mdi/js";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { IconButton } from "../IconButton.tsx";
import type { ToastEntry } from "./toast-store.ts";
import { toastStore } from "./toast-store.ts";
import styles from "./ToastItem.module.css";

const AUTO_DISMISS_MS = 4000;

export function ToastItem({ toast }: { toast: ToastEntry }) {
  const [paused, setPaused] = useState(false);
  const autoDismiss = toast.variant !== "error";
  const urgent = toast.variant === "error" || toast.variant === "warning";

  useEffect(() => {
    if (!autoDismiss || paused) {
      return;
    }
    const timer = setTimeout(() => toastStore.dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [autoDismiss, paused, toast.id]);

  return (
    <div
      className={clsx(styles.root, styles[toast.variant])}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.message}>{toast.message}</div>
      <div className={styles.close}>
        <IconButton variant="ghost" icon={mdiClose} title="Dismiss" onClick={() => toastStore.dismiss(toast.id)} />
      </div>
    </div>
  );
}
