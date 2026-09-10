import type { CommandResult, ProblemCommand, ProblemEvent } from "shared";
import { get, post } from "./client.ts";

export function fetchEvents(): Promise<ProblemEvent[]> {
  return get<ProblemEvent[]>("/api/events");
}

export function submitCommand(command: ProblemCommand): Promise<CommandResult> {
  return post<CommandResult>("/api/problem-commands", command);
}
