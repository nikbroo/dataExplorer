export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export const SORT_FIELDS = ["createdAt", "customerName", "totalAmount", "orderNumber"] as const;

export const SORT_ORDERS = ["asc", "desc"] as const;

export const PAGE_SIZES = [25, 50, 100] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type SortBy = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface OrdersQuery {
  q: string;
  status: OrderStatus | "";
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface OrdersResponse {
  data: Order[];
  pagination: Pagination;
}

export interface OrderResponse {
  data: Order;
}

export interface ApiError {
  status: number | "NETWORK_ERROR" | "ABORTED";
  code: string;
  message: string;
}
