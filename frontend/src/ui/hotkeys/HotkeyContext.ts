import { createContext } from "react";
import type { Hotkey } from "./hotkey.ts";

export type HotkeyApi = {
  register: (keys: readonly Hotkey[], handler: () => void) => () => void;
};

export const HotkeyContext = createContext<HotkeyApi | undefined>(undefined);
