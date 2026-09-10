import { isValidElement, type ReactNode } from "react";

export function joinNodes(nodes: readonly ReactNode[]) {
  return {
    with(separator: ReactNode): ReactNode[] {
      const result: ReactNode[] = [];
      for (const node of nodes) {
        if (result.length > 0) {
          if (isValidElement(separator)) {
            result.push({ ...separator, key: `#SEP#~${separator.key}~${result.length}` });
          } else {
            result.push(separator);
          }
        }
        if (isValidElement(node)) {
          result.push({ ...node, key: `#ELEM#~${node.key}~${result.length}` });
        } else {
          result.push(node);
        }
      }
      return result;
    },
  };
}
