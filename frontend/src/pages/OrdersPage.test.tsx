import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "../app/store";
import { apiClient } from "../services/axiosBaseQuery";
import type { Order, OrdersResponse } from "../types/order";
import OrdersPage from "./OrdersPage";

interface PendingRequest {
  config: AxiosRequestConfig;
  resolve: (body: OrdersResponse) => void;
  reject: (status: number) => void;
}

const makeOrder = (id: string, customerName: string): Order => ({
  id,
  orderNumber: `ORD-${id.padStart(5, "0")}`,
  customerName,
  customerEmail: `${id}@example.com`,
  productName: "Laptop",
  status: "shipped",
  totalAmount: 100,
  createdAt: "2026-10-01T10:00:00.000Z",
});

const responseFor = (orders: Order[]): OrdersResponse => ({
  data: orders,
  pagination: { page: 1, limit: 25, totalRecords: orders.length, totalPages: 1 },
});

let pending: PendingRequest[] = [];

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
};

const renderPage = (initialUrl = "/orders") =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );

const requestFor = (q: string | undefined) =>
  pending.find((request) => (request.config.params as Record<string, unknown>)?.q === q);

beforeEach(() => {
  pending = [];
  vi.spyOn(apiClient, "request").mockImplementation(
    (config: AxiosRequestConfig) =>
      new Promise<AxiosResponse>((resolve, reject) => {
        pending.push({
          config,
          resolve: (body) => resolve({ data: body } as AxiosResponse),
          reject: (status) =>
            reject(
              Object.assign(new Error("fail"), {
                isAxiosError: true,
                response: {
                  status,
                  data: { error: { code: "RANDOM_FAILURE", message: "Simulated server failure." } },
                },
              }),
            ),
        });
      }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OrdersPage", () => {
  it("never lets a slow, superseded search response overwrite a newer one", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(requestFor(undefined)).toBeDefined());
    await act(async () => requestFor(undefined)!.resolve(responseFor([makeOrder("1", "Initial Customer")])));
    expect(await screen.findByText("Initial Customer")).toBeInTheDocument();

    const input = screen.getByLabelText("Search orders");
    await user.type(input, "a");
    await waitFor(() => expect(requestFor("a")).toBeDefined());

    await user.type(input, "l");
    await waitFor(() => expect(requestFor("al")).toBeDefined());
    expect(screen.getByTestId("location")).toHaveTextContent("?q=al");

    await act(async () => requestFor("al")!.resolve(responseFor([makeOrder("2", "Newest Result")])));
    expect(await screen.findByText("Newest Result")).toBeInTheDocument();

    await act(async () => requestFor("a")!.resolve(responseFor([makeOrder("3", "Stale Result")])));

    expect(screen.getByText("Newest Result")).toBeInTheDocument();
    expect(screen.queryByText("Stale Result")).not.toBeInTheDocument();
  });

  it("restores the view from the URL and sends matching query params", async () => {
    renderPage("/orders?q=alex&status=shipped&sortBy=totalAmount&sortOrder=asc&page=2&limit=50");

    await waitFor(() => expect(pending).toHaveLength(1));
    expect(pending[0].config.params).toEqual({
      q: "alex",
      status: "shipped",
      sortBy: "totalAmount",
      sortOrder: "asc",
      page: 2,
      limit: 50,
    });
    expect(screen.getByLabelText("Search orders")).toHaveValue("alex");
    expect(screen.getByLabelText("Status")).toHaveValue("shipped");
  });

  it("hides old rows on failure and recovers via retry", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => pending[0].resolve(responseFor([makeOrder("1", "Page One Customer")])));
    expect(await screen.findByText("Page One Customer")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Status"), "pending");
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => pending[1].reject(500));

    expect(await screen.findByText("Couldn't load orders")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Simulated server failure.");
    expect(screen.queryByText("Page One Customer")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(pending).toHaveLength(3));
    await act(async () => pending[2].resolve(responseFor([makeOrder("9", "Pending Customer")])));

    expect(await screen.findByText("Pending Customer")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load orders")).not.toBeInTheDocument();
  });
});
