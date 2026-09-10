import type { ToastOptions } from "./toast-store.ts";
import { toastStore } from "./toast-store.ts";

export const Toast = {
  show(options: ToastOptions): void {
    toastStore.show(options);
  },
};
