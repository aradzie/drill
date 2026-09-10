import { TextInput } from "../ui/TextInput.tsx";
import type { Filter } from "./filter.ts";
import style from "./SearchFilter.module.css";

function SearchFilter({ filter, setFilter }: { filter: Filter; setFilter: (filter: Filter) => void }) {
  return (
    <div className={style.root}>
      <TextInput
        type="search"
        placeholder="Search..."
        value={filter.query.text}
        onChange={(value) => {
          setFilter(filter.withQuery({ text: value }));
        }}
      />
    </div>
  );
}

export { SearchFilter };
