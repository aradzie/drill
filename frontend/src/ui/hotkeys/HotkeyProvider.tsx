import { type ReactNode, useEffect } from "react";
import { HotkeyContext } from "./HotkeyContext.ts";
import { Hotkeys } from "./hotkeys.ts";

const hotkeys = new Hotkeys();

export function HotkeyProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.addEventListener("keydown", hotkeys.onKeyDown);
    return () => window.removeEventListener("keydown", hotkeys.onKeyDown);
  }, []);

  return <HotkeyContext value={hotkeys}>{children}</HotkeyContext>;
}
