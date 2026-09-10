import type { Filter } from "../filter/filter.ts";
import { Button } from "../ui/Button.tsx";
import styles from "./EmptyProblemQueue.module.css";

export function EmptyProblemQueue({ filter, setFilter }: { filter: Filter; setFilter: (filter: Filter) => void }) {
  return (
    <div className={styles.root}>
      {filter.isActive ? (
        <>
          <p>Not found</p>
          <Button onClick={() => setFilter(filter.reset())}>Clear filters</Button>
        </>
      ) : (
        <p>Empty</p>
      )}
    </div>
  );
}
