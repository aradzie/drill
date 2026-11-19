import type { ListName } from "shared";

export function problemPath(id: string): string {
  return `/problem/${encodeURIComponent(id)}`;
}

/** `params` carries filter and page parameters. */
export function listPath(list: ListName, params?: URLSearchParams): string {
  let path = `/problems/${list}`;
  const search = String(params ?? "");
  if (search !== "") {
    path += `?${search}`;
  }
  return path;
}
