import { config } from "dotenv";
// Load environment variables before importing modules that depend on them
config({ path: "./config/config.env" });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import { createTables } from "./utils/createTables.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRouter from "./routes/orderRoutes.js";

import database from "./database/db.js";

const app = express();

// Fail early if critical env vars are missing to avoid silent auth failures
if (!process.env.JWT_SECRET_KEY) {
  console.error("❌ Missing JWT_SECRET_KEY in environment. Set JWT_SECRET_KEY in config/config.env and restart the server.");
  process.exit(1);
}

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
)


app.post("/api/v1/payment/confirm", async (req, res) => {
  const { paymentReference, status } = req.body;

  if (!paymentReference || !["Paid", "Failed"].includes(status)) {
    return res.status(400).json({ success: false });
  }

  const result = await database.query(
    `
    UPDATE payments
    SET payment_status = $1
    WHERE payment_reference = $2
    RETURNING *
    `,
    [status, paymentReference]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false });
  }

  if (status === "Failed") {
    return res.json({ success: true, message: "Payment Failed" });
  }

  const orderId = result.rows[0].order_id;

  await database.query(
    `UPDATE orders SET paid_at = NOW() WHERE id = $1`,
    [orderId]
  );

  const { rows: items } = await database.query(
    `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  for (const item of items) {
    await database.query(
      `UPDATE products SET stock = stock - $1 WHERE id = $2`,
      [item.quantity, item.product_id]
    );
  }

  res.json({ success: true, message: "Payment Successful" });
});


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads"
  })
)

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/admin", adminRoutes) 
app.use("/api/v1/order", orderRouter);



createTables();

app.use(errorMiddleware)

 

export default app
