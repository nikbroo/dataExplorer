import { ArrowDownWideNarrow, ArrowUpNarrowWide, FilterX } from "lucide-react";
import SearchInput from "./SearchInput";
import {
  ORDER_STATUSES,
  PAGE_SIZES,
  SORT_FIELDS,
  type OrdersQuery,
  type OrderStatus,
  type SortBy,
} from "../types/order";
import { capitalize } from "../utils/format";
import { SORT_LABELS } from "./sortLabels";

interface OrderFiltersProps {
  query: OrdersQuery;
  onChange: (patch: Partial<OrdersQuery>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const selectClass = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900";

const OrderFilters = ({ query, onChange, onReset, hasActiveFilters }: OrderFiltersProps) => (
  <div
    role="search"
    aria-label="Filter and sort orders"
    className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
  >
    <SearchInput value={query.q} onSearch={(q) => onChange({ q })} />

    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="status-filter" className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          id="status-filter"
          value={query.status}
          onChange={(event) => onChange({ status: event.target.value as OrderStatus | "" })}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {capitalize(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort-by" className="text-xs font-medium text-slate-600">
          Sort by
        </label>
        <div className="flex">
          <select
            id="sort-by"
            value={query.sortBy}
            onChange={(event) => onChange({ sortBy: event.target.value as SortBy })}
            className={`${selectClass} rounded-r-none`}
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange({ sortOrder: query.sortOrder === "asc" ? "desc" : "asc" })}
            aria-label={`Sort direction: ${query.sortOrder === "asc" ? "ascending" : "descending"}. Toggle direction`}
            className="-ml-px inline-flex h-10 items-center gap-1 rounded-r-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            {query.sortOrder === "asc" ? (
              <ArrowUpNarrowWide aria-hidden="true" className="size-4" />
            ) : (
              <ArrowDownWideNarrow aria-hidden="true" className="size-4" />
            )}
            <span aria-hidden="true">{query.sortOrder === "asc" ? "Asc" : "Desc"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="page-size" className="text-xs font-medium text-slate-600">
          Rows per page
        </label>
        <select
          id="page-size"
          value={query.limit}
          onChange={(event) => onChange({ limit: Number(event.target.value) })}
          className={selectClass}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!hasActiveFilters}
        className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FilterX aria-hidden="true" className="size-4" />
        Reset
      </button>
    </div>
  </div>
);

export default OrderFilters;
