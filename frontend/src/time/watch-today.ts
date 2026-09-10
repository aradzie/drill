import { LocalDate } from "shared";

export function watchToday(onChange: (today: LocalDate) => void): () => void {
  let timer: ReturnType<typeof setTimeout>;

  function refresh() {
    clearTimeout(timer);
    const now = Date.now();
    const today = new LocalDate(now);
    onChange(today);
    // Calendar arithmetic keeps the next midnight correct across DST changes.
    timer = setTimeout(refresh, today.plusDays(1).timestamp - now);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") refresh();
  }

  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", onVisibilityChange);
  refresh();

  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
