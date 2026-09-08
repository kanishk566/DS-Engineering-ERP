import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import cors from "cors";

import authRoutes from "./auth.routes.js";
import customerRoutes from "./customer.routes.js";
import productRoutes from "./product.routes.js";
import vendorRoutes from "./vendor.routes.js";
import projectRoutes from "./project.routes.js";

import purchaseOrderRoutes from "./purchaseOrder.routes.js";
import purchaseOrderItemRoutes from "./purchaseOrderItem.routes.js";

import quotationRoutes from "./quotation.routes.js";
import quotationItemRoutes from "./quotationItem.routes.js";

import invoiceRoutes from "./invoice.routes.js";
import invoiceItemRoutes from "./invoiceItem.routes.js";

import paymentRoutes from "./payment.routes.js";

import salesOrderRoutes from "./salesOrder.routes.js";
import salesOrderItemRoutes from "./salesOrderItem.routes.js";

import machineRoutes from "./machine.routes.js";

import drawingRoutes from "./drawing.routes.js";


import employeeRoutes from "./employee.routes.js";
const app = express();

const PORT = Number(process.env.PORT) || 5000;


/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());


/* =========================
   ROOT
========================= */

app.get("/", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "DS Engineering ERP Backend is running",
  });
});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Backend API is healthy",
  });
});


/* =========================
   AUTH ROUTES
========================= */

app.use("/api/auth", authRoutes);


/* =========================
   CUSTOMER ROUTES
========================= */

app.use("/api/customers", customerRoutes);


/* =========================
   PRODUCT ROUTES
========================= */

app.use("/api/products", productRoutes);


/* =========================
   VENDOR ROUTES
========================= */

app.use("/api/vendors", vendorRoutes);


/* =========================
   PROJECT ROUTES
========================= */

app.use("/api/projects", projectRoutes);


/* =========================
   PURCHASE ORDER ROUTES
========================= */

app.use("/api/purchase-orders", purchaseOrderRoutes);


/* =========================
   PURCHASE ORDER ITEM ROUTES
========================= */

app.use(
  "/api/purchase-order-items",
  purchaseOrderItemRoutes
);


/* =========================
   QUOTATION ROUTES
========================= */

app.use("/api/quotations", quotationRoutes);


/* =========================
   QUOTATION ITEM ROUTES
========================= */

app.use(
  "/api/quotation-items",
  quotationItemRoutes
);


/* =========================
   INVOICE ROUTES
========================= */

app.use("/api/invoices", invoiceRoutes);


/* =========================
   INVOICE ITEM ROUTES
========================= */

app.use(
  "/api/invoice-items",
  invoiceItemRoutes
);


/* =========================
   PAYMENT ROUTES
========================= */

app.use(
  "/api/payments",
  paymentRoutes
);


/* =========================
   SALES ORDER ROUTES
========================= */

app.use("/api/sales-orders", salesOrderRoutes);


/* =========================
   SALES ORDER ITEM ROUTES
========================= */

app.use(
  "/api/sales-order-items",
  salesOrderItemRoutes
);


/* =========================
   MACHINE ROUTES
========================= */

app.use(
  "/api/machines",
  machineRoutes
);


app.use(
  "/api/drawings",
  drawingRoutes
);


app.use(
  "/api/employees",
  employeeRoutes,
);


/* =========================
   404 HANDLER
========================= */

app.use(
  (_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
);


/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Global Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `DS Engineering ERP Backend running on http://localhost:${PORT}`
  );
});