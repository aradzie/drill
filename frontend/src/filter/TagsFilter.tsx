import { Chip } from "../ui/Chip.tsx";
import type { Filter } from "./filter.ts";
import styles from "./TagsFilter.module.css";

function TagsFilter({ filter, setFilter }: { filter: Filter; setFilter: (filter: Filter) => void }) {
  const tags = [...filter.tags];
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className={styles.root}>
      {tags.map((tag) => (
        <TagToggle key={tag} filter={filter} setFilter={setFilter} tag={tag} />
      ))}
    </div>
  );
}

function TagToggle({ filter, setFilter, tag }: { filter: Filter; setFilter: (filter: Filter) => void; tag: string }) {
  return (
    <Chip
      active={filter.tags.isToggled(tag)}
      onClick={(ev) => setFilter(filter.withTags(filter.tags.toggle(tag, ev.shiftKey)))}
    >
      {tag}
    </Chip>
  );
}

export { TagsFilter };
