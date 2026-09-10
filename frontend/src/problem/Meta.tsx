import type { Problem } from "shared";
import styles from "./Meta.module.css";

export function Meta({ problem }: { problem: Problem }) {
  const children = [];
  children.push(
    <span key={0} className={styles.deck}>
      {problem.deck}
    </span>,
  );
  for (const tag of problem.tags) {
    if (children.length > 2) {
      children.push(" ");
    } else {
      children.push(" / ");
    }
    children.push(
      <span key={tag} className={styles.tag}>
        {tag}
      </span>,
    );
  }
  return <span className={styles.root}>{...children}</span>;
}
