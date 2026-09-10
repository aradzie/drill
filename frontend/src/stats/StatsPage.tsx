import { useCollection } from "../collection/useCollection.ts";
import { Page } from "../Page.tsx";
import { Calendar } from "./Calendar.tsx";
import { DeckStats } from "./DeckStats.tsx";
import { Stats } from "./Stats.tsx";

export function StatsPage() {
  const collection = useCollection();
  return (
    <Page>
      <Calendar collection={collection} />
      <Stats collection={collection} />
      <DeckStats collection={collection} />
    </Page>
  );
}
