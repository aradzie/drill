import type { Problem, ProblemEntry } from "shared";
import { extractProse } from "../ui/rich-text/extract-prose.ts";
import { normalizeSearchText } from "./search.ts";

export function prepareSearch(entry: ProblemEntry): ProblemEntry {
  return {
    ...entry,
    tags: expandTags(entry.problem.tags),
    searchFields: buildSearchFields(entry.problem),
  };
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
