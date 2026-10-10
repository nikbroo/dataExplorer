import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatNumber } from "../utils/format";

interface PaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number | null;
  loading?: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

const buttonClass =
  "inline-flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const Pagination = ({
  page,
  limit,
  totalPages,
  totalRecords: knownTotal,
  loading = false,
  disabled = false,
  onPageChange,
}: PaginationProps) => {
  const totalRecords = knownTotal ?? 0;
  const [draft, setDraft] = useState(String(page));
  const [syncedPage, setSyncedPage] = useState(page);

  if (page !== syncedPage) {
    setSyncedPage(page);
    setDraft(String(page));
  }

  const lastPage = Math.max(totalPages, 1);
  const from = totalRecords === 0 ? 0 : Math.min((page - 1) * limit + 1, totalRecords);
  const to = Math.min(page * limit, totalRecords);
  const canGoBack = !disabled && page > 1;
  const canGoForward = !disabled && page < totalPages;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Number(draft);
    if (Number.isInteger(target) && target >= 1 && target <= lastPage && target !== page) {
      onPageChange(target);
    } else {
      setDraft(String(page));
    }
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row"
    >
      <p>
        {knownTotal === null ? (
          loading && "Loading orders…"
        ) : totalRecords > 0 ? (
          <>
            Showing <span className="font-medium text-slate-900">{formatNumber(from)}</span>–
            <span className="font-medium text-slate-900">{formatNumber(to)}</span> of{" "}
            <span className="font-medium text-slate-900">{formatNumber(totalRecords)}</span> orders
          </>
        ) : (
          "No orders"
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(1)}
          disabled={!canGoBack}
          aria-label="First page"
        >
          <ChevronsLeft aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="page-input">Page</label>
          <input
            id="page-input"
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
            onBlur={() => setDraft(String(page))}
            disabled={disabled}
            className="h-9 w-14 rounded-md border border-slate-300 bg-white text-center text-slate-900 disabled:opacity-40"
          />
          <span>of {formatNumber(lastPage)}</span>
        </form>

        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoForward}
          aria-label="Last page"
        >
          <ChevronsRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
