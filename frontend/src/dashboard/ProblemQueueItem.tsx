import type { KeyboardEvent } from "react";
import { isGraduated, type ProblemEntry } from "shared";
import { Meta } from "../problem/Meta.tsx";
import { RichText } from "../ui/rich-text/RichText.tsx";
import styles from "./ProblemQueueItem.module.css";

export function ProblemQueueItem({ entry, onSelect }: { entry: ProblemEntry; onSelect: () => void }) {
  const { problem, state, lastReview } = entry;
  const { status } = state;
  const label = isGraduated(state) ? "graduated" : status === "active" ? (lastReview?.grade ?? status) : status;

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        onSelect();
        break;
    }
  }

  return (
    <li className={styles.root} role="button" tabIndex={0} onClick={onSelect} onKeyDown={handleKeyDown}>
      <div className={styles.head}>
        <Meta problem={problem} />
        <span className={styles.status}>{label.replace("_", " ")}</span>
      </div>
      <RichText className={styles.body} text={problem.body} />
    </li>
  );
}
