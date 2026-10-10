import "dotenv/config";
import express from "express";
import cors from "cors";
import ordersRouter from "./routes/order.route.js";

const port = Number(process.env.PORT) || 3000;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);

app.use(express.json());

const simulateLatency = process.env.SIMULATE_LATENCY !== "false";
const simulateFailures = process.env.SIMULATE_FAILURES !== "false";

app.use("/api", (_req, res, next) => {
  if (!simulateLatency && !simulateFailures) return next();

  const delay = simulateLatency ? 200 + Math.floor(Math.random() * 2800) : 0;

  setTimeout(() => {
    if (res.headersSent || res.req.destroyed) return;

    if (simulateFailures && Math.random() < 0.1) {
      res.status(500).json({
        error: {
          code: "RANDOM_FAILURE",
          message: "Simulated server failure. Please try again.",
        },
      });
      return;
    }

    next();
  }, delay);
});

app.get("/", (_req, res) => {
  res.json("Hello World!");
});
app.use("/api/orders", ordersRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
