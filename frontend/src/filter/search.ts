import type { ProblemEntry } from "shared";

export type Query = {
  readonly text: string;
};

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u2012-\u2015\u2212]/g, "-") // figure, en, em, horizontal-bar dashes, minus sign
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'") // curly single quotes/apostrophes
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"') // curly double quotes
    .replace(/\s+/g, " ")
    .trim();
}

/** The query and entry's search fields must already be normalized. */
export function entryMatches(entry: ProblemEntry, query: Query): boolean {
  return query.text === "" || entry.searchFields.some((field) => field.includes(query.text));
}
