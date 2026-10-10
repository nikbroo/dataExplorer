import { useEffect, useMemo, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { List, useListRef, type RowComponentProps } from "react-window";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { Order, SortBy, SortOrder } from "../types/order";
import { formatCurrency, formatDate } from "../utils/format";

interface OrdersTableProps {
  orders: Order[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSort: (sortBy: SortBy) => void;
  selectedId?: string;
  search: string;
  rowOffset: number;
  totalRecords: number;
  resetKey: string;
}

interface RowData {
  orders: Order[];
  selectedId?: string;
  search: string;
  rowOffset: number;
  onOpen: (id: string) => void;
}

interface Column {
  key: string;
  label: string;
  sortKey?: SortBy;
  align?: "right";
}

export const ROW_HEIGHT = 56;

const GRID_COLUMNS = "grid grid-cols-[130px_minmax(200px,2fr)_minmax(120px,1fr)_120px_110px_170px]";

const COLUMNS: Column[] = [
  { key: "orderNumber", label: "Order #", sortKey: "orderNumber" },
  { key: "customer", label: "Customer", sortKey: "customerName" },
  { key: "product", label: "Product" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total", sortKey: "totalAmount", align: "right" },
  { key: "createdAt", label: "Created", sortKey: "createdAt" },
];

const OrderRow = ({
  index,
  style,
  orders,
  selectedId,
  search,
  rowOffset,
  onOpen,
}: RowComponentProps<RowData>) => {
  const order = orders[index];
  const isSelected = order.id === selectedId;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) return;
    onOpen(order.id);
  };

  return (
    <div
      role="row"
      aria-rowindex={rowOffset + index + 2}
      aria-selected={isSelected || undefined}
      style={style}
      onClick={handleClick}
      className={`${GRID_COLUMNS} cursor-pointer items-center border-b border-slate-100 px-4 text-sm ${
        isSelected ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
      }`}
    >
      <div role="cell" className="truncate">
        <Link
          to={{ pathname: `/orders/${order.id}`, search }}
          data-order-link={order.id}
          className="rounded font-medium text-indigo-700 hover:underline"
        >
          {order.orderNumber}
        </Link>
      </div>
      <div role="cell" className="min-w-0 pr-4">
        <div className="truncate font-medium text-slate-900">{order.customerName}</div>
        <div className="truncate text-xs text-slate-500">{order.customerEmail}</div>
      </div>
      <div role="cell" className="truncate pr-4 text-slate-700">
        {order.productName}
      </div>
      <div role="cell">
        <StatusBadge status={order.status} />
      </div>
      <div role="cell" className="pr-6 text-right font-medium text-slate-900 tabular-nums">
        {formatCurrency(order.totalAmount)}
      </div>
      <div role="cell" className="text-slate-600 tabular-nums">
        {formatDate(order.createdAt)}
      </div>
    </div>
  );
};

const OrdersTable = ({
  orders,
  sortBy,
  sortOrder,
  onSort,
  selectedId,
  search,
  rowOffset,
  totalRecords,
  resetKey,
}: OrdersTableProps) => {
  const navigate = useNavigate();
  const listRef = useListRef(null);

  useEffect(() => {
    listRef.current?.scrollToRow({ index: 0, align: "start" });
  }, [resetKey, listRef]);

  const rowProps = useMemo<RowData>(
    () => ({
      orders,
      selectedId,
      search,
      rowOffset,
      onOpen: (id: string) => navigate({ pathname: `/orders/${id}`, search }),
    }),
    [orders, selectedId, search, rowOffset, navigate],
  );

  return (
    <div className="h-full overflow-x-auto">
      <div
        role="table"
        aria-label="Orders"
        aria-rowcount={totalRecords + 1}
        className="flex h-full min-w-[880px] flex-col"
      >
        <div role="rowgroup">
          <div
            role="row"
            aria-rowindex={1}
            className={`${GRID_COLUMNS} h-11 items-center border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold tracking-wide text-slate-600 uppercase`}
          >
            {COLUMNS.map((column) => {
              const isActive = column.sortKey === sortBy;
              const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : undefined;
              const SortIcon = !isActive ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown;

              return (
                <div
                  key={column.key}
                  role="columnheader"
                  aria-sort={ariaSort}
                  className={column.align === "right" ? "pr-6 text-right" : undefined}
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => column.sortKey && onSort(column.sortKey)}
                      className={`inline-flex items-center gap-1 rounded uppercase hover:text-slate-900 ${
                        isActive ? "text-slate-900" : ""
                      }`}
                    >
                      {column.label}
                      <SortIcon
                        aria-hidden="true"
                        className={`size-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                      />
                    </button>
                  ) : (
                    column.label
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <List
          role="rowgroup"
          listRef={listRef}
          rowComponent={OrderRow}
          rowCount={orders.length}
          rowHeight={ROW_HEIGHT}
          rowProps={rowProps}
          overscanCount={6}
          defaultHeight={600}
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  );
};

export default OrdersTable;
