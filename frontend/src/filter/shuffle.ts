import type { ProblemEntry } from "shared";

function rank(id: string, seed: number): number {
  let hash = seed ^ 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193);
  }
  // Mix all bits so similar IDs do not cluster together.
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Keep relative order stable when filtering or removing a problem from New. */
export function shuffleProblems(entries: readonly ProblemEntry[], seed: number): ProblemEntry[] {
  return entries
    .map((entry) => ({ entry, rank: rank(entry.problem.id, seed) }))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      const aId = a.entry.problem.id;
      const bId = b.entry.problem.id;
      return aId < bId ? -1 : aId > bId ? +1 : 0;
    })
    .map(({ entry }) => entry);
}
