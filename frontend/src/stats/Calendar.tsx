import type { Collection } from "shared";
import { useToday } from "../time/useToday.ts";
import styles from "./Calendar.module.css";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKS_SHOWN = 20;

function levelFor(count: number): number {
  return Math.min(10, Math.ceil(count / 2));
}

/** GitHub-style activity heatmap: one square per day, colored by review count that day. */
export function Calendar({ collection: { stats } }: { collection: Collection }) {
  const today = useToday();
  const rangeStart = today.minusDays(WEEKS_SHOWN * 7 - 1);
  const gridStart = rangeStart.startOfWeek();
  const totalCells = WEEKS_SHOWN * 7 + rangeStart.dayOfWeek - 1;
  const weeks = Math.ceil(totalCells / 7);

  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    const date = gridStart.plusDays(i);
    if (date.timestamp > today.timestamp) return null;
    const count = stats.reviewsByDate.get(date).length;
    return { date, count };
  });

  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.weekdays}>
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className={styles.weekday}>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {days.map((day, i) =>
            day == null ? (
              <span key={i} className={styles.cell} data-empty="" />
            ) : (
              <span
                key={i}
                className={styles.cell}
                data-level={levelFor(day.count)}
                title={`${new Date(day.date.timestamp).toDateString()}: ${day.count} review${day.count === 1 ? "" : "s"}`}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
