import type { CostMethod } from "@/tax/core/types";

export interface CostMethodOption {
  value: CostMethod;
  /** Label in the settings radio list */
  label: string;
  /** Short name, e.g. on the Schedule VDA page */
  name: string;
  /** Used in a sentence: "matched … using {phrase}" */
  phrase: string;
}

/** The recognised cost methods. FIFO is the default. */
export const COST_METHODS: readonly CostMethodOption[] = [
  {
    value: "FIFO",
    label: "FIFO, oldest purchase first (default)",
    name: "FIFO",
    phrase: "FIFO (oldest purchase first)",
  },
  {
    value: "LIFO",
    label: "LIFO, newest purchase first",
    name: "LIFO",
    phrase: "LIFO (newest purchase held at the time of the sale first)",
  },
  {
    value: "SPECIFIC",
    label: "Specific identification, you pick the purchase for each sale",
    name: "Specific identification",
    phrase:
      "specific identification (the purchase you picked for each sale, then oldest first)",
  },
  {
    value: "AVERAGE",
    label: "Weighted average",
    name: "Weighted average",
    phrase: "weighted average cost",
  },
];

export const costMethodOption = (method: CostMethod): CostMethodOption =>
  COST_METHODS.find((m) => m.value === method) ?? COST_METHODS[0];

/** Shown wherever the method can be chosen or is printed. */
export const COST_METHOD_DISCLOSURE =
  "The method changes the answer. Once you file with a method, you must follow it in all later years and for all your wallets.";
