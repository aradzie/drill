import { createContext } from "react";
import type { ListName, ProblemEntry } from "shared";
import type { Pager } from "../ui/pager.ts";
import type { Filter } from "./filter.ts";

export type FilterApi = {
  listName: ListName;
  setListName: (listName: ListName) => void;
  filter: Filter;
  setFilter: (value: Filter) => void;
  pager: Pager;
  setPager: (pager: Pager) => void;
  entries: readonly ProblemEntry[];
  isNewShuffled: boolean;
  shuffleNew: () => void;
  unshuffleNew: () => void;
  areFiltersOpen: boolean;
  toggleFilters: () => void;
};

export const FilterContext = createContext<FilterApi | undefined>(undefined);
