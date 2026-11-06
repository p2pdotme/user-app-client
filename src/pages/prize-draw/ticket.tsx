// The top banner is a ticket: the wallet's own number on the body, the
// campaign's totals on a tear-off stub behind a perforated edge. Built
// from the theme's own tokens (the same primary/5 surface the homescreen
// cards use) so it sits with the rest of the app in light and dark mode.
// Shared by the banner and its skeleton so the two have the same footprint.
export const TICKET_SURFACE =
  "relative flex overflow-hidden rounded-2xl bg-primary/5";
export const TICKET_STUB =
  "relative flex w-[48%] shrink-0 flex-col justify-center gap-3 border-primary/30 border-l border-dashed bg-primary/10 px-4 py-5";

/** The round cut-outs at both ends of the perforation. */
export function TicketNotches() {
  return (
    <>
      <span className="-top-3 -left-3 absolute size-6 rounded-full bg-background" />
      <span className="-bottom-3 -left-3 absolute size-6 rounded-full bg-background" />
    </>
  );
}
