import { useState } from "react";
import { useCollection } from "./collection/useCollection.ts";
import { useEvents } from "./collection/useEvents.ts";
import { ProblemListPage } from "./dashboard/ProblemListPage.tsx";
import { Header } from "./Header.tsx";
import { ProblemPage } from "./problem/ProblemPage.tsx";
import { SettingsPage } from "./settings/SettingsPage.tsx";
import { StatsPage } from "./stats/StatsPage.tsx";

export function App() {
  const [view, setView] = useState<
    | { screen: "problems" } //
    | { screen: "stats" }
    | { screen: "settings" }
    | { screen: "problem"; id: string }
  >({ screen: "problems" });
  const { start, stop, review, isSubmitting } = useEvents();
  const collection = useCollection();

  function renderScreen() {
    switch (view.screen) {
      case "problems": {
        return (
          <>
            <Header active={view.screen} onNavigate={(screen) => setView({ screen })} />
            <ProblemListPage onSelectProblem={(id) => setView({ screen: "problem", id })} />
          </>
        );
      }
      case "stats": {
        return (
          <>
            <Header active={view.screen} onNavigate={(screen) => setView({ screen })} />
            <StatsPage />
          </>
        );
      }
      case "settings": {
        return (
          <>
            <Header active={view.screen} onNavigate={(screen) => setView({ screen })} />
            <SettingsPage />
          </>
        );
      }
      case "problem": {
        const entry = collection.entries.find(({ problem }) => problem.id === view.id)!;
        return (
          <ProblemPage
            entry={entry}
            isSubmitting={isSubmitting}
            onStart={async () => {
              if (!isSubmitting) {
                await start(entry.problem.id);
              }
            }}
            onStop={async () => {
              if (!isSubmitting) {
                await stop(entry.problem.id);
              }
            }}
            onGrade={async (grade) => {
              if (!isSubmitting) {
                await review(entry.problem.id, grade);
                setView({ screen: "problems" });
              }
            }}
            onBack={() => setView({ screen: "problems" })}
          />
        );
      }
    }
  }

  return renderScreen();
}
