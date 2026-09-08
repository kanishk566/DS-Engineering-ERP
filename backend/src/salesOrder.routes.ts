import "temporal-polyfill/full/global";
import { Temporal } from "temporal-polyfill/full";

import { Router } from "express";

import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// TEMPORAL DATE HELPER
// ============================================================

const toInstant = (value: unknown): Temporal.Instant => {
  if (value instanceof Temporal.Instant) {
    return value;
  }

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      "Date must be a valid ISO date string",
    );
  }

  const dateValue = value.trim();

  // DATE ONLY
  // Example: 2026-09-05
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return Temporal.Instant.from(
      `${dateValue}T00:00:00Z`,
    );
  }

  // FULL ISO
  return Temporal.Instant.from(dateValue);
};

// ============================================================
// SALES ORDER STATUS
// ============================================================

const validStatuses = [
  "draft",
  "confirmed",
  "processing",
  "pending",
  "delivered",
  "cancelled",
];

// ============================================================
// GET ALL SALES ORDERS
// GET /api/sales-orders
// ============================================================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const salesOrders =
        await db.orm.public.SalesOrder
          .orderBy(
            (salesOrder) =>
              salesOrder.createdAt.desc(),
          )
          .all();

      return res.json({
        success: true,
        count: salesOrders.length,
        data: salesOrders,
      });
    } catch (error) {
      console.error(
        "GET SALES ORDERS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales orders",
      });
    }
  },
);

// ============================================================
// GET SALES ORDER BY ID
// GET /api/sales-orders/:id
// ============================================================

router.get(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID",
        });
      }

      const salesOrder =
        await db.orm.public.SalesOrder
          .where({ id })
          .first();

      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: "Sales order not found",
        });
      }

      return res.json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      console.error(
        "GET SALES ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales order",
      });
    }
  },
);

// ============================================================
// CREATE SALES ORDER
// POST /api/sales-orders
// ============================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        salesOrderNumber,
        salesOrderCode,
        customerId,
        quotationId,
        projectId,
        orderDate,
        deliveryDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        !salesOrderNumber ||
        customerId === undefined ||
        customerId === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "salesOrderNumber and customerId are required",
        });
      }

      // --------------------------------------------------------
      // CUSTOMER ID
      // --------------------------------------------------------

      const numericCustomerId =
        Number(customerId);

      if (
        !Number.isInteger(numericCustomerId) ||
        numericCustomerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid customerId",
        });
      }

      // --------------------------------------------------------
      // CHECK DUPLICATE SALES ORDER NUMBER
      // --------------------------------------------------------

      const existingSalesOrder =
        await db.orm.public.SalesOrder
          .where({
            salesOrderNumber,
          })
          .first();

      if (existingSalesOrder) {
        return res.status(409).json({
          success: false,
          message:
            "Sales order number already exists",
        });
      }

      // --------------------------------------------------------
      // CHECK CUSTOMER EXISTS
      // --------------------------------------------------------

      const customer =
        await db.orm.public.Customer
          .where({
            id: numericCustomerId,
          })
          .first();

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      // --------------------------------------------------------
      // OPTIONAL QUOTATION
      // --------------------------------------------------------

      let numericQuotationId:
        | number
        | null = null;

      if (
        quotationId !== undefined &&
        quotationId !== null &&
        quotationId !== ""
      ) {
        numericQuotationId =
          Number(quotationId);

        if (
          !Number.isInteger(
            numericQuotationId,
          ) ||
          numericQuotationId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid quotationId",
          });
        }

        const quotation =
          await db.orm.public.Quotation
            .where({
              id: numericQuotationId,
            })
            .first();

        if (!quotation) {
          return res.status(404).json({
            success: false,
            message: "Quotation not found",
          });
        }
      }

      // --------------------------------------------------------
      // OPTIONAL PROJECT
      // --------------------------------------------------------

      let numericProjectId:
        | number
        | null = null;

      if (
        projectId !== undefined &&
        projectId !== null &&
        projectId !== ""
      ) {
        numericProjectId =
          Number(projectId);

        if (
          !Number.isInteger(
            numericProjectId,
          ) ||
          numericProjectId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid projectId",
          });
        }

        const project =
          await db.orm.public.Project
            .where({
              id: numericProjectId,
            })
            .first();

        if (!project) {
          return res.status(404).json({
            success: false,
            message: "Project not found",
          });
        }
      }

      // --------------------------------------------------------
      // STATUS VALIDATION
      // --------------------------------------------------------

      const finalStatus =
        status ?? "draft";

      if (
        !validStatuses.includes(
          finalStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sales order status",
          validStatuses,
        });
      }

      // --------------------------------------------------------
      // DATE VALIDATION
      // --------------------------------------------------------

      let parsedOrderDate:
        | Temporal.Instant
        | undefined;

      let parsedDeliveryDate:
        | Temporal.Instant
        | undefined;

      try {
        if (
          orderDate !== undefined &&
          orderDate !== null &&
          orderDate !== ""
        ) {
          parsedOrderDate =
            toInstant(orderDate);
        }

        if (
          deliveryDate !== undefined &&
          deliveryDate !== null &&
          deliveryDate !== ""
        ) {
          parsedDeliveryDate =
            toInstant(deliveryDate);
        }
      } catch (dateError) {
        console.error(
          "CREATE SALES ORDER DATE ERROR:",
          dateError,
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Use YYYY-MM-DD or ISO format like 2026-09-05T00:00:00Z",
        });
      }

      // --------------------------------------------------------
      // CREATE SALES ORDER
      // --------------------------------------------------------

      const salesOrder =
        await db.orm.public.SalesOrder.create({
          salesOrderNumber,
          salesOrderCode:
            salesOrderCode ?? null,

          customerId:
            numericCustomerId,

          quotationId:
            numericQuotationId,

          projectId:
            numericProjectId,

          ...(parsedOrderDate !==
            undefined && {
            orderDate:
              parsedOrderDate,
          }),

          ...(parsedDeliveryDate !==
            undefined && {
            deliveryDate:
              parsedDeliveryDate,
          }),

          status: finalStatus,

          subtotal:
            subtotal ?? "0",

          taxAmount:
            taxAmount ?? "0",

          totalAmount:
            totalAmount ?? "0",

          notes:
            notes ?? null,
        });

      return res.status(201).json({
        success: true,
        message:
          "Sales order created successfully",
        data: salesOrder,
      });
    } catch (error) {
      console.error(
        "CREATE SALES ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create sales order",
      });
    }
  },
);

// ============================================================
// UPDATE SALES ORDER
// PUT /api/sales-orders/:id
// ============================================================

router.put(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID",
        });
      }

      // --------------------------------------------------------
      // CHECK SALES ORDER EXISTS
      // --------------------------------------------------------

      const existingSalesOrder =
        await db.orm.public.SalesOrder
          .where({ id })
          .first();

      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message: "Sales order not found",
        });
      }

      const {
        salesOrderNumber,
        salesOrderCode,
        customerId,
        quotationId,
        projectId,
        orderDate,
        deliveryDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // DUPLICATE SALES ORDER NUMBER
      // --------------------------------------------------------

      if (
        salesOrderNumber !==
          undefined &&
        salesOrderNumber !==
          existingSalesOrder.salesOrderNumber
      ) {
        const duplicateSalesOrder =
          await db.orm.public.SalesOrder
            .where({
              salesOrderNumber,
            })
            .first();

        if (duplicateSalesOrder) {
          return res.status(409).json({
            success: false,
            message:
              "Sales order number already exists",
          });
        }
      }

      // --------------------------------------------------------
      // CUSTOMER
      // --------------------------------------------------------

      let numericCustomerId:
        | number
        | undefined;

      if (customerId !== undefined) {
        numericCustomerId =
          Number(customerId);

        if (
          !Number.isInteger(
            numericCustomerId,
          ) ||
          numericCustomerId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid customerId",
          });
        }

        const customer =
          await db.orm.public.Customer
            .where({
              id: numericCustomerId,
            })
            .first();

        if (!customer) {
          return res.status(404).json({
            success: false,
            message: "Customer not found",
          });
        }
      }

      // --------------------------------------------------------
      // QUOTATION
      // --------------------------------------------------------

      let numericQuotationId:
        | number
        | null
        | undefined;

      if (quotationId !== undefined) {
        if (
          quotationId === null ||
          quotationId === ""
        ) {
          numericQuotationId = null;
        } else {
          numericQuotationId =
            Number(quotationId);

          if (
            !Number.isInteger(
              numericQuotationId,
            ) ||
            numericQuotationId <= 0
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid quotationId",
            });
          }

          const quotation =
            await db.orm.public.Quotation
              .where({
                id: numericQuotationId,
              })
              .first();

          if (!quotation) {
            return res.status(404).json({
              success: false,
              message:
                "Quotation not found",
            });
          }
        }
      }

      // --------------------------------------------------------
      // PROJECT
      // --------------------------------------------------------

      let numericProjectId:
        | number
        | null
        | undefined;

      if (projectId !== undefined) {
        if (
          projectId === null ||
          projectId === ""
        ) {
          numericProjectId = null;
        } else {
          numericProjectId =
            Number(projectId);

          if (
            !Number.isInteger(
              numericProjectId,
            ) ||
            numericProjectId <= 0
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid projectId",
            });
          }

          const project =
            await db.orm.public.Project
              .where({
                id: numericProjectId,
              })
              .first();

          if (!project) {
            return res.status(404).json({
              success: false,
              message:
                "Project not found",
            });
          }
        }
      }

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      if (
        status !== undefined &&
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sales order status",
          validStatuses,
        });
      }

      // --------------------------------------------------------
      // DATES
      // --------------------------------------------------------

      let parsedOrderDate:
        | Temporal.Instant
        | undefined;

      let parsedDeliveryDate:
        | Temporal.Instant
        | null
        | undefined;

      try {
        if (orderDate !== undefined) {
          if (
            orderDate === null ||
            orderDate === ""
          ) {
            return res.status(400).json({
              success: false,
              message:
                "orderDate cannot be null",
            });
          }

          parsedOrderDate =
            toInstant(orderDate);
        }

        if (
          deliveryDate !== undefined
        ) {
          if (
            deliveryDate === null ||
            deliveryDate === ""
          ) {
            parsedDeliveryDate = null;
          } else {
            parsedDeliveryDate =
              toInstant(deliveryDate);
          }
        }
      } catch (dateError) {
        console.error(
          "UPDATE SALES ORDER DATE ERROR:",
          dateError,
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Use YYYY-MM-DD or ISO format like 2026-09-05T00:00:00Z",
        });
      }

      // --------------------------------------------------------
      // BUILD UPDATE DATA
      // --------------------------------------------------------

      const updateData = {
        ...(salesOrderNumber !==
          undefined && {
          salesOrderNumber,
        }),

        ...(salesOrderCode !==
          undefined && {
          salesOrderCode,
        }),

        ...(numericCustomerId !==
          undefined && {
          customerId:
            numericCustomerId,
        }),

        ...(numericQuotationId !==
          undefined && {
          quotationId:
            numericQuotationId,
        }),

        ...(numericProjectId !==
          undefined && {
          projectId:
            numericProjectId,
        }),

        ...(parsedOrderDate !==
          undefined && {
          orderDate:
            parsedOrderDate,
        }),

        ...(parsedDeliveryDate !==
          undefined && {
          deliveryDate:
            parsedDeliveryDate,
        }),

        ...(status !== undefined && {
          status,
        }),

        ...(subtotal !== undefined && {
          subtotal,
        }),

        ...(taxAmount !== undefined && {
          taxAmount,
        }),

        ...(totalAmount !== undefined && {
          totalAmount,
        }),

        ...(notes !== undefined && {
          notes,
        }),
      };

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      const updatedSalesOrder =
        await db.orm.public.SalesOrder
          .where({ id })
          .update(updateData);

      return res.json({
        success: true,
        message:
          "Sales order updated successfully",
        data: updatedSalesOrder,
      });
    } catch (error) {
      console.error(
        "UPDATE SALES ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update sales order",
      });
    }
  },
);

// ============================================================
// DELETE SALES ORDER
// DELETE /api/sales-orders/:id
// ============================================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID",
        });
      }

      // --------------------------------------------------------
      // CHECK EXISTS
      // --------------------------------------------------------

      const existingSalesOrder =
        await db.orm.public.SalesOrder
          .where({ id })
          .first();

      if (!existingSalesOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Sales order not found",
        });
      }

      // --------------------------------------------------------
      // DELETE
      // --------------------------------------------------------

      const deletedSalesOrder =
        await db.orm.public.SalesOrder
          .where({ id })
          .delete();

      return res.json({
        success: true,
        message:
          "Sales order deleted successfully",
        data: deletedSalesOrder,
      });
    } catch (error) {
      console.error(
        "DELETE SALES ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete sales order",
      });
    }
  },
);

export default router;