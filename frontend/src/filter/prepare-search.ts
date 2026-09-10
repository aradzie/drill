import type { Problem, ProblemEntry } from "shared";
import { extractProse } from "../ui/rich-text/extract-prose.ts";
import { normalizeSearchText } from "./search.ts";

export function prepareSearch(entry: ProblemEntry): ProblemEntry {
  return {
    ...entry,
    searchFields: buildSearchFields(entry.problem),
  };
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
