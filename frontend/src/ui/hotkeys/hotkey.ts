/** A parsed shortcut. An omitted modifier must not be pressed. */
export type Hotkey = {
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
  readonly description?: string;
};

const namedKeys = new Set([
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Delete",
  "Insert",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Clear",
  "Pause",
  "PrintScreen",
  "ContextMenu",
  "CapsLock",
  "NumLock",
  "ScrollLock",
]);

function normalizeKey(key: string): string {
  // Shift is matched separately; Caps Lock must not change a letter shortcut.
  return /^[A-Z]$/.test(key) ? key.toLowerCase() : key;
}

/** Parse once at module scope. Use Space and Plus for delimiter-sensitive keys. */
export function hotkey(spec: string, description?: string): Hotkey {
  const parts = spec.split("+").map((part) => part.trim());
  const keyName = parts.pop() ?? "";
  const modifiers = { ctrl: false, alt: false, shift: false, meta: false };

  for (const part of parts) {
    const modifier = part.toLowerCase();
    if (modifier !== "ctrl" && modifier !== "alt" && modifier !== "shift" && modifier !== "meta") {
      throw new Error(`Unknown modifier ${JSON.stringify(part)} in hotkey ${JSON.stringify(spec)}`);
    }
    if (modifiers[modifier]) {
      throw new Error(`Duplicate modifier in hotkey ${JSON.stringify(spec)}`);
    }
    modifiers[modifier] = true;
  }

  const key = keyName === "Space" ? " " : keyName === "Plus" ? "+" : normalizeKey(keyName);
  const printable = [...key].length === 1 && !/[\p{C}\p{Z}]/u.test(key);
  if (key !== " " && !printable && !namedKeys.has(key) && !/^F([1-9]|1\d|2[0-4])$/.test(key)) {
    throw new Error(`Unknown key ${JSON.stringify(keyName)} in hotkey ${JSON.stringify(spec)}`);
  }

  return Object.freeze({ key, ...modifiers, ...(description === undefined ? {} : { description }) });
}

/** Registration identity excludes descriptions and object identity. */
export function hotkeyId({ key, ctrl, alt, shift, meta }: Hotkey): string {
  return JSON.stringify([normalizeKey(key), ctrl, alt, shift, meta]);
}
