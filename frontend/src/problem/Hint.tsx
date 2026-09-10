import { useState } from "react";
import { RichText } from "../ui/rich-text/RichText.tsx";
import styles from "./Hint.module.css";

export function Hint({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={styles.hint} title="Click to show/hide the hint" onClick={() => setRevealed(!revealed)}>
      {(revealed && <RichText text={text} />) || "Hint..."}
    </div>
  );
}
