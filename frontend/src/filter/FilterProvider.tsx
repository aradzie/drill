import { type ReactNode, useState } from "react";
import type { ListName } from "shared";
import { useCollection } from "../collection/useCollection.ts";
import { Pager } from "../ui/pager.ts";
import { Filter } from "./filter.ts";
import { FilterContext } from "./FilterContext.tsx";
import { shuffleProblems } from "./shuffle.ts";

function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const collection = useCollection();
  const [listName, setListName] = useState<ListName>("new");
  const [filter, setFilter] = useState(() => Filter.from(collection.entries));
  const [pageIndex, setPageIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

  const filtered = filter.filter(collection[listName]);
  const entries = listName === "new" && shuffleSeed != null ? shuffleProblems(filtered, shuffleSeed) : filtered;
  const pager = Pager.of(entries.length, pageIndex);

  return (
    <FilterContext
      value={{
        listName,
        setListName: (listName) => {
          setListName(listName);
          setPageIndex(0);
        },
        filter,
        setFilter: (filter) => {
          setFilter(filter);
          setPageIndex(0);
        },
        entries,
        isNewShuffled: shuffleSeed != null,
        shuffleNew: () => {
          setShuffleSeed(randomSeed());
          setPageIndex(0);
        },
        unshuffleNew: () => {
          setShuffleSeed(null);
          setPageIndex(0);
        },
        areFiltersOpen,
        toggleFilters: () => setAreFiltersOpen((open) => !open),
        pager,
        setPager: ({ pageIndex }) => {
          setPageIndex(pageIndex);
        },
      }}
    >
      {children}
    </FilterContext>
  );
}
