import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import StatusMessage from "../components/StatusMessage";
import { useGetOrderByIdQuery } from "../services/ordersApi";
import { formatCurrency, formatDate, formatRelative } from "../utils/format";

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

const DetailRow = ({ label, children }: DetailRowProps) => (
  <div className="grid grid-cols-3 gap-4 py-3">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="col-span-2 text-sm break-words text-slate-900">{children}</dd>
  </div>
);

const OrderDetailPanel = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const {
    currentData: order,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetOrderByIdQuery(id, {
    skip: !id,
  });

  const close = useCallback(() => {
    navigate({ pathname: "/orders", search: location.search });
  }, [navigate, location.search]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    headingRef.current?.focus();

    return () => {
      requestAnimationFrame(() => {
        const link = document.querySelector<HTMLElement>(`[data-order-link="${CSS.escape(id)}"]`);
        if (link) link.focus();
        else if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected)
          previouslyFocused.focus();
      });
    };
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  const isNotFound = isError && error !== undefined && "status" in error && error.status === 404;

  const renderContent = () => {
    if (isNotFound) {
      return (
        <StatusMessage
          variant="empty"
          title="Order not found"
          description={`No order exists with id “${id}”.`}
          actionLabel="Back to orders"
          onAction={close}
        />
      );
    }

    if (isError) {
      return (
        <StatusMessage
          variant="error"
          title="Couldn't load this order"
          description={error?.message}
          actionLabel={isFetching ? "Retrying…" : "Retry"}
          onAction={isFetching ? undefined : () => void refetch()}
        />
      );
    }

    if (!order) {
      return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading order…
        </div>
      );
    }

    return (
      <div className="px-6 py-4">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-4">
          <div>
            <p className="text-xs tracking-wide text-slate-500 uppercase">Total</p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <dl className="divide-y divide-slate-100">
          <DetailRow label="Order number">{order.orderNumber}</DetailRow>
          <DetailRow label="Order ID">{order.id}</DetailRow>
          <DetailRow label="Customer">{order.customerName}</DetailRow>
          <DetailRow label="Email">
            <a href={`mailto:${order.customerEmail}`} className="rounded text-indigo-700 hover:underline">
              {order.customerEmail}
            </a>
          </DetailRow>
          <DetailRow label="Product">{order.productName}</DetailRow>
          <DetailRow label="Created">
            <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
            <span className="block text-xs text-slate-500">{formatRelative(order.createdAt)}</span>
          </DetailRow>
        </dl>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/30" onClick={close} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        aria-busy={isFetching}
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="order-detail-title"
            ref={headingRef}
            tabIndex={-1}
            className="rounded text-lg font-semibold text-slate-900"
          >
            {order ? `Order ${order.orderNumber}` : "Order details"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close order details"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{renderContent()}</div>
        <div className="sr-only" role="status" aria-live="polite">
          {isError
            ? `Error: ${error?.message ?? "Couldn't load order."}`
            : order
              ? `Loaded order ${order.orderNumber}`
              : ""}
        </div>
      </aside>
    </div>
  );
};

export default OrderDetailPanel;
