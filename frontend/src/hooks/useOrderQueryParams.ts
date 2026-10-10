import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ORDER_STATUSES, PAGE_SIZES, SORT_FIELDS, SORT_ORDERS, type OrdersQuery } from "../types/order";

export const DEFAULT_QUERY: OrdersQuery = {
  q: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 25,
};

const isOneOf = <T extends string | number>(list: readonly T[], value: unknown): value is T =>
  list.some((item) => item === value);

const parsePositiveInt = (value: string | null): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 ? parsed : null;
};

export const parseOrdersQuery = (params: URLSearchParams): OrdersQuery => {
  const status = params.get("status");
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  const limit = parsePositiveInt(params.get("limit"));

  return {
    q: params.get("q") ?? DEFAULT_QUERY.q,
    status: isOneOf(ORDER_STATUSES, status) ? status : DEFAULT_QUERY.status,
    sortBy: isOneOf(SORT_FIELDS, sortBy) ? sortBy : DEFAULT_QUERY.sortBy,
    sortOrder: isOneOf(SORT_ORDERS, sortOrder) ? sortOrder : DEFAULT_QUERY.sortOrder,
    page: parsePositiveInt(params.get("page")) ?? DEFAULT_QUERY.page,
    limit: isOneOf(PAGE_SIZES, limit) ? limit : DEFAULT_QUERY.limit,
  };
};

export const serializeOrdersQuery = (query: OrdersQuery): URLSearchParams => {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.sortBy !== DEFAULT_QUERY.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder !== DEFAULT_QUERY.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.page !== DEFAULT_QUERY.page) params.set("page", String(query.page));
  if (query.limit !== DEFAULT_QUERY.limit) params.set("limit", String(query.limit));
  return params;
};

export const applyQueryPatch = (current: OrdersQuery, patch: Partial<OrdersQuery>): OrdersQuery => {
  const resetsPage = (["q", "status", "sortBy", "sortOrder", "limit"] as const).some(
    (key) => key in patch && patch[key] !== current[key],
  );
  return {
    ...current,
    ...patch,
    page: patch.page ?? (resetsPage ? 1 : current.page),
  };
};

export interface UpdateOptions {
  replace?: boolean;
}

export const useOrderQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();

  const query = useMemo(() => parseOrdersQuery(new URLSearchParams(search)), [search]);

  const update = useCallback(
    (patch: Partial<OrdersQuery>, options: UpdateOptions = {}) => {
      setSearchParams((prev) => serializeOrdersQuery(applyQueryPatch(parseOrdersQuery(prev), patch)), {
        replace: options.replace ?? false,
      });
    },
    [setSearchParams],
  );

  const reset = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  return { query, update, reset };
};
