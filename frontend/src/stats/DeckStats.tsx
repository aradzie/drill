import { type Collection, countProblemStates, EntriesByDeck } from "shared";
import styles from "./DeckStats.module.css";

export function DeckStats({ collection }: { collection: Collection }) {
  const decks = EntriesByDeck.from(collection.entries);
  const rows = [decks.root];
  for (let index = 0; index < rows.length; index++) {
    rows.push(...rows[index].children);
  }
  rows.sort((a, b) => a.deck.localeCompare(b.deck));

  return (
    <table className={styles.root}>
      <caption>All / reviewed by deck (including subdecks)</caption>
      <thead>
        <tr>
          <th className={styles.path}>Deck</th>
          <th className={styles.count}>All</th>
          <th className={styles.count}>Rev</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((deck) => {
          const counts = countProblemStates(deck.entries);
          return (
            <tr key={deck.deck}>
              <td className={styles.path}>{deck.deck || "All problems"}</td>
              <td className={styles.count}>{counts.total}</td>
              <td className={styles.count}>{counts.active}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
