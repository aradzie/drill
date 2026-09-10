import { Select } from "../ui/Select.tsx";
import type { Filter } from "./filter.ts";
import styles from "./DecksFilter.module.css";

function DecksFilter({ filter, setFilter }: { filter: Filter; setFilter: (filter: Filter) => void }) {
  const { decks } = filter;
  if (decks.options.length === 0) {
    return null;
  }
  return (
    <div className={styles.root}>
      <Select
        aria-label="Filter by deck"
        value={decks.selected}
        options={[
          { value: "", name: "All decks" },
          ...decks.options.map((option) => ({ value: option.path, name: option.path })),
        ]}
        onChange={(value) => setFilter(filter.withDecks(decks.select(value)))}
      />
    </div>
  );
}

export { DecksFilter };
