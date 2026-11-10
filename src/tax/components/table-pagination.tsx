import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/tax/hooks/use-pagination";

interface TablePaginationProps {
  pagination: Pagination<unknown>;
  /** What is being counted, e.g. "orders" */
  noun: string;
}

/** "Showing 1 to 20 of 127 orders  ‹ Previous | Page 1 of 7 | Next ›" */
export function TablePagination({ pagination, noun }: TablePaginationProps) {
  const { page, pages, total, from, to, setPage } = pagination;
  return (
    <nav
      aria-label={`${noun} pagination`}
      className="no-print flex flex-wrap items-center justify-between gap-2 border-t px-2 pt-3 text-sm">
      <span className="text-muted-foreground" aria-live="polite">
        {total === 0
          ? `No ${noun}`
          : `Showing ${from} to ${to} of ${total.toLocaleString("en-IN")} ${noun}`}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}>
            <ChevronLeft />
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pages - 1}>
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </nav>
  );
}
