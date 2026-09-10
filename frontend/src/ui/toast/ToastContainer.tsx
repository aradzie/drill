import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toastStore } from "./toast-store.ts";
import { ToastItem } from "./ToastItem.tsx";
import styles from "./ToastContainer.module.css";

export function ToastContainer() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.showPopover();
  }, []);

  return createPortal(
    <div ref={ref} popover="manual" className={styles.root}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}
