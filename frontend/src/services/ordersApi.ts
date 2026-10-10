import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";
import type { Order, OrderResponse, OrdersQuery, OrdersResponse } from "../types/order";

export const toRequestParams = (query: OrdersQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    limit: query.limit,
  };
  const q = query.q.trim();
  if (q) params.q = q;
  if (query.status) params.status = query.status;
  return params;
};

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getOrders: builder.query<OrdersResponse, OrdersQuery>({
      query: (query) => ({ url: "/orders", params: toRequestParams(query) }),
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => ({ url: `/orders/${encodeURIComponent(id)}` }),
      transformResponse: (response: OrderResponse) => response.data,
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderByIdQuery } = ordersApi;
