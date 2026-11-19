import { type ReactNode, useState } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { LIST_NAMES, type ListName } from "shared";
import { useCollection } from "../collection/useCollection.ts";
import { listPath } from "../paths.ts";
import { Pager } from "../ui/pager.ts";
import { Filter } from "./filter.ts";
import { FilterContext } from "./FilterContext.tsx";
import { shuffleProblems } from "./shuffle.ts";

function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

function isListName(value: string | undefined): value is ListName {
  return (LIST_NAMES as readonly (string | undefined)[]).includes(value);
}

/** The page is 1-based in the URL, omitted for the first page. */
function pageIndexOf(params: URLSearchParams): number {
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return Number.isFinite(page) && page >= 1 ? page - 1 : 0;
}

function withoutPage(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("page");
  return next;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const collection = useCollection();
  const navigate = useNavigate();
  const location = useLocation();
  const routeList = useMatch("/problems/:list")?.params.list;

  // The URL owns the active list, filters and page. Off the list routes (e.g. a problem page) the last
  // list route is retained, so returning to the list restores it.
  const [current, setCurrent] = useState(() =>
    isListName(routeList) ? { list: routeList, search: location.search } : { list: "new" as ListName, search: "" },
  );
  if (isListName(routeList) && (routeList !== current.list || location.search !== current.search)) {
    setCurrent({ list: routeList, search: location.search });
  }
  const { list: listName } = current;
  const params = new URLSearchParams(current.search);

  const filter = Filter.from(collection.entries).withSearchParams(params);
  const pageIndex = pageIndexOf(params);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [areFiltersOpen, setAreFiltersOpen] = useState(filter.isActive);

  const filtered = filter.filter(collection[listName]);
  const entries = listName === "new" && shuffleSeed != null ? shuffleProblems(filtered, shuffleSeed) : filtered;
  const pager = Pager.of(entries.length, pageIndex);

  // Changes replace rather than push, so back/forward moves between screens, not between filter states.
  function go(list: ListName, params: URLSearchParams) {
    navigate(listPath(list, params), { replace: true });
  }

  function resetPage() {
    if (params.has("page")) {
      go(listName, withoutPage(params));
    }
  }

  return (
    <FilterContext
      value={{
        listName,
        listPath: listPath(listName, params),
        setListName: (listName) => go(listName, withoutPage(params)),
        filter,
        setFilter: (filter) => go(listName, filter.toSearchParams()),
        entries,
        isNewShuffled: shuffleSeed != null,
        shuffleNew: () => {
          setShuffleSeed(randomSeed());
          resetPage();
        },
        unshuffleNew: () => {
          setShuffleSeed(null);
          resetPage();
        },
        areFiltersOpen,
        toggleFilters: () => setAreFiltersOpen((open) => !open),
        pager,
        setPager: ({ pageIndex }) => {
          const next = new URLSearchParams(params);
          if (pageIndex > 0) {
            next.set("page", String(pageIndex + 1));
          } else {
            next.delete("page");
          }
          go(listName, next);
        },
      }}
    >
      {children}
    </FilterContext>
  );
}
