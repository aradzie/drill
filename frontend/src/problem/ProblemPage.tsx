import { mdiClose } from "@mdi/js";
import { useState } from "react";
import { type Grade, isOpen, type ProblemEntry } from "shared";
import { hotkeys } from "../app-hotkeys.ts";
import { useHotkey } from "../ui/hotkeys/useHotkey.ts";
import { IconButton } from "../ui/IconButton.tsx";
import { RichText } from "../ui/rich-text/RichText.tsx";
import { Hint } from "./Hint.tsx";
import { Meta } from "./Meta.tsx";
import styles from "./ProblemPage.module.css";

export function ProblemPage({
  entry: { problem, state },
  isSubmitting,
  onStart,
  onStop,
  onGrade,
  onBack,
}: {
  entry: ProblemEntry;
  isSubmitting: boolean;
  onStart: () => void;
  onStop: () => void;
  onGrade: (grade: Grade) => void;
  onBack: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const open = isOpen(state);

  useHotkey(hotkeys.problem.back, onBack);
  useHotkey(hotkeys.problem.toggleWork, open ? onStop : onStart, { enabled: !isSubmitting });
  useHotkey(hotkeys.problem.showAnswer, () => setRevealed(true), { enabled: !revealed });
  useHotkey(hotkeys.problem.rateFail, () => onGrade("fail"), { enabled: revealed && !isSubmitting });
  useHotkey(hotkeys.problem.rateVeryHard, () => onGrade("very_hard"), { enabled: revealed && !isSubmitting });
  useHotkey(hotkeys.problem.rateHard, () => onGrade("hard"), { enabled: revealed && !isSubmitting });
  useHotkey(hotkeys.problem.rateGood, () => onGrade("good"), { enabled: revealed && !isSubmitting });
  useHotkey(hotkeys.problem.rateEasy, () => onGrade("easy"), { enabled: revealed && !isSubmitting });

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.problem}>
          <Meta problem={problem} />
          <RichText text={problem.body} />
          {problem.hint && <Hint text={problem.hint} />}
        </div>

        {revealed && (
          <div className={styles.answer}>
            <RichText text={problem.answer} />
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.button}
          title={open ? "Stop working (w)" : "Start working (w)"}
          disabled={isSubmitting}
          onClick={open ? onStop : onStart}
        >
          {open ? "Stop working" : "Start working"}
        </button>
      </div>

      <div className={styles.controls}>
        {revealed ? (
          <>
            <button
              className={styles.button}
              title="Fail (f or 1)"
              disabled={isSubmitting}
              onClick={() => onGrade("fail")}
            >
              Fail
            </button>
            <button
              className={styles.button}
              title="Very hard (v or 2)"
              disabled={isSubmitting}
              onClick={() => onGrade("very_hard")}
            >
              Very hard
            </button>
            <button
              className={styles.button}
              title="Hard (h or 3)"
              disabled={isSubmitting}
              onClick={() => onGrade("hard")}
            >
              Hard
            </button>
            <button
              className={styles.button}
              title="Good (g or 4)"
              disabled={isSubmitting}
              onClick={() => onGrade("good")}
            >
              Good
            </button>
            <button
              className={styles.button}
              title="Easy (e or 5)"
              disabled={isSubmitting}
              onClick={() => onGrade("easy")}
            >
              Easy
            </button>
          </>
        ) : (
          <button className={styles.button} title="Show answer (Space)" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        )}
      </div>

      <div className={styles.back}>
        <IconButton variant="ghost" icon={mdiClose} title="Back (b or Backspace)" onClick={onBack} />
      </div>
    </div>
  );
}
