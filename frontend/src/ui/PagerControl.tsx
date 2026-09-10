import type { KeyboardEvent, ReactNode } from "react";
import { LinkButton } from "./LinkButton.tsx";
import type { Pager } from "./pager.ts";
import styles from "./PagerControl.module.css";

function PagerControl({ pager, onPager }: { pager: Pager; onPager: (pager: Pager) => void }) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        onPager(pager.prev());
        break;
      case "ArrowRight":
        event.preventDefault();
        onPager(pager.next());
        break;
    }
  }

  const nodes: ReactNode[] = [];
  for (const [begin, end] of pager.intervals()) {
    if (nodes.length > 0) {
      nodes.push(
        <span key={-nodes.length} className={styles.item}>
          {"\u00B7\u00B7\u00B7"}
        </span>,
      );
    }
    for (let index = begin; index < end; index++) {
      nodes.push(
        <LinkButton
          key={index}
          className={styles.item}
          active={pager.pageIndex === index}
          tabIndex={-1}
          onClick={() => onPager(pager.goto(index))}
        >
          {index + 1}
        </LinkButton>,
      );
    }
  }
  return (
    <div className={styles.root} role="group" aria-label="Pager" tabIndex={0} onKeyDown={handleKeyDown}>
      <LinkButton className={styles.item} tabIndex={-1} onClick={() => onPager(pager.prev())}>
        {"\u2B9C"}
      </LinkButton>
      {nodes}
      <LinkButton className={styles.item} tabIndex={-1} onClick={() => onPager(pager.next())}>
        {"\u2B9E"}
      </LinkButton>
    </div>
  );
}

export { PagerControl };
