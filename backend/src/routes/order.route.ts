import { Router } from "express";
import { orders } from "../data/orders.js";
import { z } from "zod";

const router = Router();

const querySchema = z.object({
  q: z.string().optional().default(""),
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  sortBy: z
    .enum(["createdAt", "customerName", "totalAmount", "orderNumber"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

router.get("/", (req, res) => {
  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid search or pagination parameters.",
        details: parsed.error.flatten(),
      },
    });
  }

  const { q, status, sortBy, sortOrder, page, limit } = parsed.data;
  const search = q.trim().toLowerCase();

  let result = orders.filter((order) => {
    const matchesSearch =
      !search ||
      [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.productName,
      ].some((value) => value.toLowerCase().includes(search));

    const matchesStatus = !status || order.status === status;

    return matchesSearch && matchesStatus;
  });

  result.sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];

    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalRecords = result.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const start = (page - 1) * limit;

  return res.json({
    data: result.slice(start, start + limit),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
  });
});

router.get("/:id", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);

  if (!order) {
    return res.status(404).json({
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found.",
      },
    });
  }

  return res.json({ data: order });
});

export default router;
