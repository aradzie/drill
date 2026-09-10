import { Fragment } from "react";
import type { Hotkey } from "./hotkey.ts";
import styles from "./HotkeyDisplay.module.css";

const keyLabels: Readonly<Record<string, string>> = {
  " ": "Space",
  "+": "Plus",
  "PageUp": "Page Up",
  "PageDown": "Page Down",
  "ArrowUp": "Arrow Up",
  "ArrowDown": "Arrow Down",
  "ArrowLeft": "Arrow Left",
  "ArrowRight": "Arrow Right",
  "CapsLock": "Caps Lock",
  "NumLock": "Num Lock",
  "ScrollLock": "Scroll Lock",
  "PrintScreen": "Print Screen",
  "ContextMenu": "Context Menu",
};

export function HotkeyDisplay({ hotkey }: { hotkey: Hotkey }) {
  const key = keyLabels[hotkey.key] ?? (/^[a-z]$/.test(hotkey.key) ? hotkey.key.toUpperCase() : hotkey.key);
  const keys = [
    ...(hotkey.ctrl ? ["Ctrl"] : []),
    ...(hotkey.alt ? ["Alt"] : []),
    ...(hotkey.shift ? ["Shift"] : []),
    ...(hotkey.meta ? ["Meta"] : []),
    key,
  ];

  return (
    <span className={styles.root} title={hotkey.description}>
      {keys.map((label, index) => (
        <Fragment key={label}>
          {index > 0 && " + "}
          <kbd className={styles.item}>{label}</kbd>
        </Fragment>
      ))}
    </span>
  );
}
