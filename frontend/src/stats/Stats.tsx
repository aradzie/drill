import type { Collection } from "shared";
import styles from "./Stats.module.css";

export function Stats({ collection }: { collection: Collection }) {
  const stats = [
    { label: "All problems", value: collection.stats.totalProblemCount },
    { label: "Reviewed problems", value: collection.stats.reviewedProblemCount },
    { label: "Total reviews", value: collection.stats.reviewCount },
  ];
  return (
    <div className={styles.root}>
      {stats.map(({ label, value }) => (
        <div key={label} className={styles.stat}>
          <span className={styles.value}>{value}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
