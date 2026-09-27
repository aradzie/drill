import { Chip } from "../ui/Chip.tsx";
import type { Filter } from "./filter.ts";
import styles from "./TagsFilter.module.css";

function TagsFilter({
  filter,
  setFilter,
  foundTags,
}: {
  filter: Filter;
  setFilter: (filter: Filter) => void;
  foundTags: ReadonlySet<string>;
}) {
  const tags = [...filter.tags];
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className={styles.root}>
      {tags.map((tag) => (
        <Chip
          active={filter.tags.isSelected(tag)}
          muted={!foundTags.has(tag)}
          title="Click to select this tag. Shift+click to combine multiple tags."
          onClick={(ev) => setFilter(filter.withTags(filter.tags.toggleSelected(tag, ev.shiftKey)))}
        >
          {tag}
        </Chip>
      ))}
    </div>
  );
}

export { TagsFilter };
