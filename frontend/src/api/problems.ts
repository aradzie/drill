import type { Problem } from "shared";
import { get } from "./client.ts";

export function fetchProblems(): Promise<Problem[]> {
  return get<Problem[]>("/api/problems");
}
