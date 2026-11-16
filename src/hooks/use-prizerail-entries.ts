import type { DrawWindow } from "@/lib/prizerail";

export interface PrizerailEntriesSummary {
  entries: number;
  hasEntries: boolean;
  displayEntries: string;
  window: DrawWindow;
}
