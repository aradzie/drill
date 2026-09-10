import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { deriveProblemState, type Grade, type ProblemAction, type ProblemEvent } from "shared";
import { fetchEvents, submitCommand } from "../api/events.ts";
import { randomId } from "../api/random-id.ts";
import { asApiError, type ResourceStatus } from "../api/resource.ts";
import { Toast } from "../ui/toast/Toast.ts";
import type { ToastVariant } from "../ui/toast/toast-store.ts";
import { type EventsApi, EventsContext } from "./EventsContext.ts";

const GRADE_LABEL: Record<Grade, string> = {
  fail: "Fail",
  very_hard: "Very hard",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

const GRADE_VARIANT: Record<Grade, ToastVariant> = {
  fail: "warning",
  very_hard: "info",
  hard: "info",
  good: "success",
  easy: "success",
};

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ProblemEvent[]>([]);
  const eventsRef = useRef(events);
  const [status, setStatus] = useState<ResourceStatus>("loading");
  const [error, setError] = useState<EventsApi["error"]>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateEvents(next: ProblemEvent[]) {
    eventsRef.current = next;
    setEvents(next);
  }

  const load = useCallback(async () => {
    try {
      updateEvents(await fetchEvents());
      setError(null);
      setStatus("ready");
    } catch (error) {
      setError(asApiError(error, "failed to load events"));
      setStatus("error");
    }
  }, []);

  const reload = async () => {
    setStatus("loading");
    setError(null);
    await load();
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const dispatch = async (problemId: string, action: ProblemAction) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const expectedCommandId = deriveProblemState(eventsRef.current, problemId).lastCommandId;
      const commandId = randomId();
      const result = await submitCommand({ commandId, problemId, expectedCommandId, action });
      if (result.outcome === "appended" || result.outcome === "duplicate") {
        if (!eventsRef.current.some((event) => event.commandId === result.event.commandId)) {
          updateEvents([...eventsRef.current, result.event]);
        }
      }
      if (action.type === "review") {
        Toast.show({ message: `Graded: ${GRADE_LABEL[action.grade]}`, variant: GRADE_VARIANT[action.grade] });
      }
      setError(null);
      setIsSubmitting(false);
    } catch (error) {
      setError(asApiError(error, "failed to submit action"));
      setIsSubmitting(false);
    }
  };

  const start: EventsApi["start"] = (problemId) => dispatch(problemId, { type: "start" });
  const stop: EventsApi["stop"] = (problemId) => dispatch(problemId, { type: "stop" });
  const review: EventsApi["review"] = (problemId, grade) => dispatch(problemId, { type: "review", grade });

  if (error) {
    throw error;
  }

  return (
    <EventsContext value={{ events, status, error, isSubmitting, reload, start, stop, review }}>
      {children}
    </EventsContext>
  );
}
