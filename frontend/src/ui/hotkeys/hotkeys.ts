import { type Hotkey, hotkeyId } from "./hotkey.ts";

type Registration = { handler: () => void };

export class Hotkeys {
  #registrations = new Map<string, Registration>();

  register = (keys: readonly Hotkey[], handler: () => void): (() => void) => {
    const uniqueKeys = [...new Set(keys.map(hotkeyId))];
    for (const key of uniqueKeys) {
      if (this.#registrations.has(key)) {
        throw new Error(`Hotkey ${JSON.stringify(key)} is already registered`);
      }
    }

    const registration = { handler };
    for (const key of uniqueKeys) {
      this.#registrations.set(key, registration);
    }

    return () => {
      for (const key of uniqueKeys) {
        if (this.#registrations.get(key) === registration) {
          this.#registrations.delete(key);
        }
      }
    };
  };

  onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.repeat || event.isComposing) {
      return;
    }

    // Inspect the path so nested elements and controls inside shadow roots work too.
    for (const target of event.composedPath()) {
      const element = target as HTMLElement;
      if (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
        return;
      }
      if ((event.key === " " || event.key === "Enter") && ["BUTTON", "A", "SUMMARY"].includes(element.tagName)) {
        return;
      }
    }

    const registration = this.#registrations.get(
      hotkeyId({
        key: event.key,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      }),
    );
    if (registration) {
      event.preventDefault();
      registration.handler();
    }
  };
}
