import type { OrderStatus } from "../types/order";
import { capitalize } from "../utils/format";

interface StatusBadgeProps {
  status: OrderStatus;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  processing: "bg-sky-50 text-sky-800 ring-sky-600/20",
  shipped: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-600/20",
};

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
  >
    {capitalize(status)}
  </span>
);

export default StatusBadge;
