import type { ReactNode } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastOptions = {
  readonly message: ReactNode;
  readonly variant?: ToastVariant;
};

export type ToastEntry = {
  readonly id: number;
  readonly message: ReactNode;
  readonly variant: ToastVariant;
};

let toasts: readonly ToastEntry[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

function show(options: ToastOptions) {
  toasts = [
    ...toasts,
    {
      id: nextId++,
      message: options.message,
      variant: options.variant ?? "info",
    },
  ];
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export const toastStore = { subscribe, getSnapshot, show, dismiss };
