import { Link } from "react-router-dom";
import { isGraduated, type ProblemEntry } from "shared";
import { problemPath } from "../paths.ts";
import { Meta } from "../problem/Meta.tsx";
import { RichText } from "../ui/rich-text/RichText.tsx";
import styles from "./ProblemQueueItem.module.css";

export function ProblemQueueItem({ entry }: { entry: ProblemEntry }) {
  const { problem, state, lastReview } = entry;
  const { status } = state;
  const label = isGraduated(state) ? "graduated" : status === "active" ? (lastReview?.grade ?? status) : status;

  return (
    <li className={styles.root}>
      <Link className={styles.link} to={problemPath(problem.id)}>
        <div className={styles.head}>
          <Meta problem={problem} />
          <span className={styles.status}>{label.replace("_", " ")}</span>
        </div>
        <RichText className={styles.body} text={problem.body} align="center" />
      </Link>
    </li>
  );
}
