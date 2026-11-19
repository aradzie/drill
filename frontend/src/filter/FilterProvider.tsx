import { type ReactNode, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { LIST_NAMES, type ListName } from "shared";
import { useCollection } from "../collection/useCollection.ts";
import { Pager } from "../ui/pager.ts";
import { Filter } from "./filter.ts";
import { FilterContext } from "./FilterContext.tsx";
import { shuffleProblems } from "./shuffle.ts";

function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const collection = useCollection();
  // The route owns the active list. Off the list routes (e.g. a problem page) the last list is retained.
  const routeList = useMatch("/problems/:list")?.params.list;
  const [listName, setListNameState] = useState<ListName>("new");
  const [filter, setFilter] = useState(() => Filter.from(collection.entries));
  const [pageIndex, setPageIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

  if (routeList != null && routeList !== listName && (LIST_NAMES as string[]).includes(routeList)) {
    setListNameState(routeList as ListName);
    setPageIndex(0);
  }

  const filtered = filter.filter(collection[listName]);
  const entries = listName === "new" && shuffleSeed != null ? shuffleProblems(filtered, shuffleSeed) : filtered;
  const pager = Pager.of(entries.length, pageIndex);

  return (
    <FilterContext
      value={{
        listName,
        setListName: (listName) => {
          navigate(`/problems/${listName}`, { replace: true });
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
