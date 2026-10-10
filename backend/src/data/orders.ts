export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

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

const statuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const products = [
  "Laptop",
  "Mobile Phone",
  "Headphones",
  "Keyboard",
  "Monitor",
];

export const orders: Order[] = Array.from({ length: 10_000 }, (_, index) => {
  const id = (index + 1).toString();

  return {
    id,
    orderNumber: `ORD-${id.padStart(5, "0")}`,
    customerName: `Customer ${id}`,
    customerEmail: `customer${id}@example.com`,
    productName: products[Math.floor(Math.random() * products.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    totalAmount: Math.floor(Math.random() * 1000) + 100,
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    ).toISOString(),
  };
});
