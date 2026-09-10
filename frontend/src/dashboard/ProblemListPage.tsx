import type { ListName } from "shared";
import { hotkeys } from "../app-hotkeys.ts";
import { useCollection } from "../collection/useCollection.ts";
import { DecksFilter } from "../filter/DecksFilter.tsx";
import { SearchFilter } from "../filter/SearchFilter.tsx";
import { TagsFilter } from "../filter/TagsFilter.tsx";
import { useFilter } from "../filter/useFilter.ts";
import { Page } from "../Page.tsx";
import { Button } from "../ui/Button.tsx";
import { useHotkey } from "../ui/hotkeys/useHotkey.ts";
import { FiltersPanel } from "./FiltersPanel.tsx";
import { ProblemQueue } from "./ProblemQueue.tsx";
import { Tabs } from "./Tabs.tsx";
import styles from "./ProblemListPage.module.css";

export function ProblemListPage({ onSelectProblem }: { onSelectProblem: (problemId: string) => void }) {
  const collection = useCollection();
  const { listName, setListName, filter, setFilter, entries, isNewShuffled, shuffleNew, unshuffleNew } = useFilter();

  const tabs: { id: ListName; label: string; count: number }[] = [
    { id: "new", label: "New", count: collection["new"].length },
    { id: "due", label: "Due", count: collection["due"].length },
    { id: "in-progress", label: "In progress", count: collection["in-progress"].length },
    { id: "reviewed", label: "Reviewed", count: collection["reviewed"].length },
  ];

  useHotkey(hotkeys.problemList.resetFilters, () => setFilter(filter.reset()));
  useHotkey(
    hotkeys.problemList.randomProblem,
    () => {
      if (entries.length > 0) {
        const entry = entries[Math.floor(Math.random() * entries.length)];
        onSelectProblem(entry.problem.id);
      }
    },
    { enabled: listName === "new" },
  );

  const canShuffle = listName === "new" && (entries.length >= 2 || isNewShuffled);
  useHotkey(hotkeys.problemList.shuffleProblems, shuffleNew, { enabled: canShuffle });
  useHotkey(hotkeys.problemList.unshuffleProblems, unshuffleNew, { enabled: canShuffle });

  return (
    <Page>
      <Tabs tabs={tabs} activeId={listName} onChange={setListName}>
        <FiltersPanel>
          <DecksFilter filter={filter} setFilter={setFilter} />
          <TagsFilter filter={filter} setFilter={setFilter} />
          <SearchFilter filter={filter} setFilter={setFilter} />
        </FiltersPanel>
        {listName === "new" && (
          <div className={styles.actions}>
            <Button
              variant="ghost"
              disabled={!canShuffle}
              title="Shuffle problems (s). Shift+Click (or Shift+s) to restore original order."
              onClick={(event) => {
                if (event.shiftKey) {
                  unshuffleNew();
                } else {
                  shuffleNew();
                }
              }}
            >
              Shuffle
            </Button>
          </div>
        )}
        <ProblemQueue onSelectProblem={onSelectProblem} />
      </Tabs>
    </Page>
  );
}
