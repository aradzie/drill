export function problemPath(id: string): string {
  return `/problem/${encodeURIComponent(id)}`;
}
