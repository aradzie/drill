import type { Problem, ProblemEntry } from "shared";
import { extractProse } from "../ui/rich-text/extract-prose.ts";
import { normalizeSearchText } from "./search.ts";

type Prepared = { tags: string[]; searchFields: string[] };

/**
 * Parsing every problem's markdown is expensive (hundreds of milliseconds for a few thousand problems), while
 * the collection is rebuilt whenever a component mounts or an event is recorded. Problem objects are stable
 * between those rebuilds, so the result is cached per problem and released along with it.
 */
const cache = new WeakMap<Problem, Prepared>();

export function prepareSearch(entry: ProblemEntry): ProblemEntry {
  // Cast: the entry's readonly view of the problem is the same object that was loaded.
  const key = entry.problem as Problem;
  let prepared = cache.get(key);
  if (prepared == null) {
    cache.set(
      key,
      (prepared = {
        tags: expandTags(key.tags),
        searchFields: buildSearchFields(key),
      }),
    );
  }
  return { ...entry, ...prepared };
}

/**
 * Adds every ancestor of each hierarchical tag, so `Calculus/Multivariable` also yields `Calculus`.
 * Ancestors precede their descendants and duplicates are dropped. The note parser has already removed empty levels.
 */
export function expandTags(tags: readonly string[]): string[] {
  const expanded = new Set<string>();
  for (const tag of tags) {
    const segments = tag.split("/");
    for (let i = 1; i <= segments.length; i++) {
      expanded.add(segments.slice(0, i).join("/"));
    }
  }
  return [...expanded];
}

export function buildSearchFields(problem: Problem): string[] {
  return [
    extractProse(problem.body),
    extractProse(problem.answer),
    ...problem.tags,
    ...problem.deck.split("::"),
    problem.id,
  ].map(normalizeSearchText);
}
