import { useFilter } from "../filter/useFilter.ts";
import { PagerControl } from "../ui/PagerControl.tsx";
import { EmptyProblemQueue } from "./EmptyProblemQueue.tsx";
import { ProblemQueueItem } from "./ProblemQueueItem.tsx";
import styles from "./ProblemQueue.module.css";

export function ProblemQueue({ onSelectProblem }: { onSelectProblem: (problemId: string) => void }) {
  const { pager, setPager, entries, filter, setFilter } = useFilter();
  if (entries.length === 0) {
    return <EmptyProblemQueue filter={filter} setFilter={setFilter} />;
  }
  return (
    <>
      <PagerControl pager={pager} onPager={setPager} />
      <ul className={styles.root}>
        {pager.slice(entries).map((entry) => (
          <ProblemQueueItem key={entry.problem.id} entry={entry} onSelect={() => onSelectProblem(entry.problem.id)} />
        ))}
      </ul>
      <PagerControl pager={pager} onPager={setPager} />
    </>
  );
}
