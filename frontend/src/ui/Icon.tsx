import type { AriaAttributes, Ref } from "react";
import type { DataProps, MouseProps } from "./props.ts";
import styles from "./Icon.module.css";

function Icon({
  ref,
  shape,
  viewBox = "0 0 24 24",
  ...props
}: {
  ref?: Ref<SVGSVGElement>;
  shape: string;
  viewBox?: string;
} & MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <svg ref={ref} className={styles.root} viewBox={viewBox} {...props}>
      <path d={shape} />
    </svg>
  );
}

export { Icon };
