import type { ReactNode } from "react";
import { useFilter } from "../filter/useFilter.ts";
import { Button } from "../ui/Button.tsx";
import styles from "./FiltersPanel.module.css";

export function FiltersPanel({ children }: { children: ReactNode }) {
  const { areFiltersOpen, toggleFilters } = useFilter();
  return (
    <>
      <div className={styles.root}>
        <Button
          variant="ghost"
          aria-expanded={areFiltersOpen}
          aria-controls="filters-panel-content"
          title="Show or hide filters."
          onClick={toggleFilters}
        >
          <span>
            Filters <span aria-hidden="true">{areFiltersOpen ? "\u25BC" : "\u25BA"}</span>
          </span>
        </Button>
      </div>
      {areFiltersOpen && <div id="filters-panel-content">{children}</div>}
    </>
  );
}
