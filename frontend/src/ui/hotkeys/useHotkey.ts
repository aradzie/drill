import { useContext, useEffect } from "react";
import type { Hotkey } from "./hotkey.ts";
import { HotkeyContext } from "./HotkeyContext.ts";

export function useHotkey(
  keys: Hotkey | readonly Hotkey[],
  handler: () => void,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const hotkeys = useContext(HotkeyContext);
  if (!hotkeys) {
    throw new Error(import.meta.env.DEV ? "useHotkey must be used inside HotkeyProvider" : undefined);
  }

  useEffect(() => {
    if (enabled) {
      return hotkeys.register("key" in keys ? [keys] : keys, handler);
    }
  }, [hotkeys, keys, handler, enabled]);
}
