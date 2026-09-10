import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";
import type { ListName } from "shared";
import styles from "./Tabs.module.css";

export function Tabs({
  tabs,
  activeId,
  onChange,
  children,
}: {
  tabs: { id: ListName; label: string; count: number }[];
  activeId: ListName;
  onChange: (id: ListName) => void;
  children: ReactNode;
}) {
  const buttonRefs = useRef(new Map<ListName, HTMLButtonElement>());

  function handleKeyDown(index: number) {
    return (event: KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "ArrowLeft": {
          event.preventDefault();
          const prevTab = tabs[(index - 1 + tabs.length) % tabs.length];
          onChange(prevTab.id);
          buttonRefs.current.get(prevTab.id)?.focus();
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          const nextTab = tabs[(index + 1) % tabs.length];
          onChange(nextTab.id);
          buttonRefs.current.get(nextTab.id)?.focus();
          break;
        }
      }
    };
  }

  return (
    <>
      <div className={styles.root} role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) {
                buttonRefs.current.set(tab.id, el);
              } else {
                buttonRefs.current.delete(tab.id);
              }
            }}
            id={`tab-${tab.id}`}
            role="tab"
            className={styles.tab}
            aria-selected={tab.id === activeId}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={tab.id === activeId ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown(index)}
          >
            {tab.label}
            <span className={styles.count}>{tab.count}</span>
          </button>
        ))}
      </div>
      <div id={`tabpanel-${activeId}`} role="tabpanel" aria-labelledby={`tab-${activeId}`}>
        {children}
      </div>
    </>
  );
}
