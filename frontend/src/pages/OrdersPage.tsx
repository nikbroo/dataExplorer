import { useCallback } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { Loader2 } from "lucide-react";
import OrderFilters from "../components/OrderFilters";
import OrdersTable, { ROW_HEIGHT } from "../components/OrdersTable";
import Pagination from "../components/Pagination";
import StatusMessage from "../components/StatusMessage";
import { DEFAULT_QUERY, useOrderQueryParams } from "../hooks/useOrderQueryParams";
import { useGetOrdersQuery } from "../services/ordersApi";
import type { SortBy } from "../types/order";
import { formatNumber } from "../utils/format";

const TableSkeleton = () => (
  <div aria-hidden="true" className="animate-pulse">
    {Array.from({ length: 10 }, (_, index) => (
      <div
        key={index}
        style={{ height: ROW_HEIGHT }}
        className="flex items-center gap-6 border-b border-slate-100 px-4"
      >
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-3 flex-1 rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-3 w-28 rounded bg-slate-200" />
      </div>
    ))}
  </div>
);

const OrdersPage = () => {
  const { query, update, reset } = useOrderQueryParams();
  const location = useLocation();
  const detailMatch = useMatch("/orders/:id");
  const selectedId = detailMatch?.params.id;

  const { currentData, data, isFetching, isError, error, refetch } = useGetOrdersQuery(query);

  const staleData = !currentData && isFetching ? data : undefined;
  const visibleData = currentData ?? staleData;
  const isStale = Boolean(staleData);
  const isInitialLoading = !visibleData && !isError;
  const pagination = visibleData?.pagination;

  const hasActiveFilters =
    query.q !== DEFAULT_QUERY.q ||
    query.status !== DEFAULT_QUERY.status ||
    query.sortBy !== DEFAULT_QUERY.sortBy ||
    query.sortOrder !== DEFAULT_QUERY.sortOrder ||
    query.limit !== DEFAULT_QUERY.limit;

  const handleSort = useCallback(
    (sortBy: SortBy) => {
      if (sortBy === query.sortBy) {
        update({ sortOrder: query.sortOrder === "asc" ? "desc" : "asc" });
      } else {
        update({ sortBy, sortOrder: sortBy === "createdAt" || sortBy === "totalAmount" ? "desc" : "asc" });
      }
    },
    [query.sortBy, query.sortOrder, update],
  );

  const resetKey = `${query.q}|${query.status}|${query.sortBy}|${query.sortOrder}|${query.page}|${query.limit}`;

  let politeMessage = "";
  if (isError) politeMessage = "";
  else if (isInitialLoading || isStale) politeMessage = "Loading orders…";
  else if (currentData) {
    const { totalRecords, totalPages } = currentData.pagination;
    politeMessage =
      totalRecords === 0
        ? "No orders match your filters."
        : `${formatNumber(totalRecords)} orders found. Page ${query.page} of ${formatNumber(totalPages)}.`;
  }

  const renderBody = () => {
    if (isError) {
      return (
        <StatusMessage
          variant="error"
          title="Couldn't load orders"
          description={error?.message ?? "Something went wrong while loading orders."}
          actionLabel={isFetching ? "Retrying…" : "Retry"}
          onAction={isFetching ? undefined : () => void refetch()}
        />
      );
    }

    if (!visibleData) return <TableSkeleton />;

    const { totalRecords, totalPages } = visibleData.pagination;

    if (!isStale && totalRecords > 0 && query.page > totalPages) {
      return (
        <StatusMessage
          variant="empty"
          title="This page doesn't exist"
          description={`There are only ${formatNumber(totalPages)} pages for the current filters.`}
          actionLabel="Go to last page"
          onAction={() => update({ page: totalPages })}
        />
      );
    }

    if (!isStale && totalRecords === 0) {
      return (
        <StatusMessage
          variant="empty"
          title="No orders found"
          description={
            query.q
              ? `Nothing matches “${query.q}” with the current filters.`
              : "No orders match the current filters."
          }
          actionLabel={hasActiveFilters ? "Clear filters" : undefined}
          onAction={hasActiveFilters ? reset : undefined}
        />
      );
    }

    return (
      <div inert={isStale} className={`h-full transition-opacity ${isStale ? "opacity-40" : "opacity-100"}`}>
        <OrdersTable
          orders={visibleData.data}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          selectedId={selectedId}
          search={location.search}
          rowOffset={(visibleData.pagination.page - 1) * visibleData.pagination.limit}
          totalRecords={totalRecords}
          resetKey={resetKey}
        />
      </div>
    );
  };

  return (
    <>
      <div inert={Boolean(selectedId)} className="flex h-dvh flex-col bg-slate-100">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
              <p className="text-sm text-slate-500">Search, filter and sort across all orders.</p>
            </div>
            {isFetching && !isError && (
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                {isStale ? "Updating results…" : "Loading…"}
              </span>
            )}
          </div>
        </header>

        <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
          <OrderFilters query={query} onChange={update} onReset={reset} hasActiveFilters={hasActiveFilters} />

          <section
            aria-label="Order results"
            aria-busy={isFetching}
            className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            {isStale && (
              <p className="absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow">
                Showing previous results — updating…
              </p>
            )}
            {renderBody()}
          </section>

          <Pagination
            page={query.page}
            limit={query.limit}
            totalPages={pagination?.totalPages ?? 0}
            totalRecords={isError ? null : (pagination?.totalRecords ?? null)}
            loading={isInitialLoading}
            disabled={isInitialLoading || isError}
            onPageChange={(page) => update({ page })}
          />
        </main>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {politeMessage}
        </div>
        <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
          {isError ? `Error: ${error?.message ?? "Couldn't load orders."}` : ""}
        </div>
      </div>

      <Outlet />
    </>
  );
};

export default OrdersPage;
