import { useContext } from "react";
import { type FilterApi, FilterContext } from "./FilterContext.tsx";

export function useFilter(): FilterApi {
  const context = useContext(FilterContext);
  if (!context) throw new Error(import.meta.env.DEV ? "useFilter must be used inside FilterProvider" : undefined);
  return context;
}
