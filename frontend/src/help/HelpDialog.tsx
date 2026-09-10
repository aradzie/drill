import { useRef } from "react";
import { hotkeys } from "../app-hotkeys.ts";
import { useHotkey } from "../ui/hotkeys/useHotkey.ts";
import { HelpScreen } from "./HelpScreen.tsx";
import styles from "./HelpDialog.module.css";

export function HelpDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useHotkey(hotkeys.showHelp, () => dialogRef.current?.showModal());

  return (
    <dialog ref={dialogRef} className={styles.root}>
      <HelpScreen />
    </dialog>
  );
}
