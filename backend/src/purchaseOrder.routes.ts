import "temporal-polyfill/full/global";
import { Temporal } from "temporal-polyfill/full";

import { Router } from "express";

import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// DATE HELPER
// ============================================================

const toInstant = (value: unknown): Temporal.Instant => {
  if (value instanceof Temporal.Instant) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error("Date must be a valid ISO date string");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Date must be a valid ISO date string");
  }

  return Temporal.Instant.from(trimmed);
};

// ============================================================
// GET ALL PURCHASE ORDERS
// GET /api/purchase-orders
// ============================================================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const purchaseOrders =
        await db.orm.public.PurchaseOrder
          .orderBy((po) => po.createdAt.desc())
          .all();

      return res.json({
        success: true,
        count: purchaseOrders.length,
        data: purchaseOrders,
      });
    } catch (error) {
      console.error(
        "GET PURCHASE ORDERS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch purchase orders",
      });
    }
  },
);

// ============================================================
// GET PURCHASE ORDER BY ID
// GET /api/purchase-orders/:id
// ============================================================

router.get(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase order ID",
        });
      }

      const purchaseOrder =
        await db.orm.public.PurchaseOrder
          .where({ id })
          .first();

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      return res.json({
        success: true,
        data: purchaseOrder,
      });
    } catch (error) {
      console.error(
        "GET PURCHASE ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch purchase order",
      });
    }
  },
);

// ============================================================
// CREATE PURCHASE ORDER
// POST /api/purchase-orders
// ============================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        poNumber,
        projectId,
        vendorId,
        orderDate,
        expectedDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        remarks,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (!poNumber) {
        return res.status(400).json({
          success: false,
          message: "poNumber is required",
        });
      }

      if (
        vendorId === undefined ||
        vendorId === null
      ) {
        return res.status(400).json({
          success: false,
          message: "vendorId is required",
        });
      }

      // --------------------------------------------------------
      // VENDOR ID
      // --------------------------------------------------------

      const numericVendorId = Number(vendorId);

      if (!Number.isInteger(numericVendorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendorId",
        });
      }

      // --------------------------------------------------------
      // DUPLICATE PO NUMBER
      // --------------------------------------------------------

      const existingPO =
        await db.orm.public.PurchaseOrder
          .where({ poNumber })
          .first();

      if (existingPO) {
        return res.status(409).json({
          success: false,
          message: "PO number already exists",
        });
      }

      // --------------------------------------------------------
      // CHECK VENDOR
      // --------------------------------------------------------

      const vendor =
        await db.orm.public.Vendor
          .where({
            id: numericVendorId,
          })
          .first();

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      // --------------------------------------------------------
      // OPTIONAL PROJECT
      // --------------------------------------------------------

      let numericProjectId: number | null = null;

      if (
        projectId !== undefined &&
        projectId !== null
      ) {
        numericProjectId = Number(projectId);

        if (!Number.isInteger(numericProjectId)) {
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
      // DATE VALIDATION
      //
      // IMPORTANT:
      // orderDate is NOT sent to ORM when omitted.
      // Database default(now()) handles it.
      // --------------------------------------------------------

      let parsedOrderDate:
        | Temporal.Instant
        | undefined;

      let parsedExpectedDate:
        | Temporal.Instant
        | null
        | undefined;

      try {
        // Only convert orderDate if explicitly supplied.
        if (
          orderDate !== undefined &&
          orderDate !== null
        ) {
          parsedOrderDate =
            toInstant(orderDate);
        }

        // expectedDate is optional.
        if (
          expectedDate !== undefined
        ) {
          if (expectedDate === null) {
            parsedExpectedDate = null;
          } else {
            parsedExpectedDate =
              toInstant(expectedDate);
          }
        }
      } catch (dateError) {
        console.error(
          "PURCHASE ORDER DATE ERROR:",
          dateError,
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Use ISO format like 2026-09-01T00:00:00Z",
        });
      }

      // --------------------------------------------------------
      // BUILD CREATE DATA
      // --------------------------------------------------------

      const createData = {
        poNumber,

        projectId: numericProjectId,

        vendorId: numericVendorId,

        // Only send orderDate if explicitly supplied.
        ...(parsedOrderDate !== undefined && {
          orderDate: parsedOrderDate,
        }),

        // Only send expectedDate if explicitly supplied.
        ...(parsedExpectedDate !== undefined && {
          expectedDate: parsedExpectedDate,
        }),

        ...(status !== undefined && {
          status,
        }),

        subtotal:
          subtotal !== undefined
            ? String(subtotal)
            : "0",

        taxAmount:
          taxAmount !== undefined
            ? String(taxAmount)
            : "0",

        totalAmount:
          totalAmount !== undefined
            ? String(totalAmount)
            : "0",

        remarks:
          remarks !== undefined
            ? remarks
            : null,
      };

      console.log(
        "CREATE PURCHASE ORDER DATA:",
        createData,
      );

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const purchaseOrder =
        await db.orm.public.PurchaseOrder.create(
          createData,
        );

      return res.status(201).json({
        success: true,
        message:
          "Purchase order created successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      console.error(
        "CREATE PURCHASE ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create purchase order",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// UPDATE PURCHASE ORDER
// PUT /api/purchase-orders/:id
// ============================================================

router.put(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase order ID",
        });
      }

      const existingPO =
        await db.orm.public.PurchaseOrder
          .where({ id })
          .first();

      if (!existingPO) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      const {
        poNumber,
        projectId,
        vendorId,
        orderDate,
        expectedDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        remarks,
      } = req.body;

      // --------------------------------------------------------
      // DUPLICATE PO NUMBER
      // --------------------------------------------------------

      if (
        poNumber !== undefined &&
        poNumber !== existingPO.poNumber
      ) {
        const duplicatePO =
          await db.orm.public.PurchaseOrder
            .where({ poNumber })
            .first();

        if (duplicatePO) {
          return res.status(409).json({
            success: false,
            message: "PO number already exists",
          });
        }
      }

      // --------------------------------------------------------
      // VENDOR
      // --------------------------------------------------------

      let numericVendorId:
        | number
        | undefined;

      if (vendorId !== undefined) {
        numericVendorId = Number(vendorId);

        if (!Number.isInteger(numericVendorId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid vendorId",
          });
        }

        const vendor =
          await db.orm.public.Vendor
            .where({
              id: numericVendorId,
            })
            .first();

        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: "Vendor not found",
          });
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
        if (projectId === null) {
          numericProjectId = null;
        } else {
          numericProjectId = Number(projectId);

          if (
            !Number.isInteger(
              numericProjectId,
            )
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
      }

      // --------------------------------------------------------
      // DATE PARSING
      // --------------------------------------------------------

      let parsedOrderDate:
        | Temporal.Instant
        | undefined;

      let parsedExpectedDate:
        | Temporal.Instant
        | null
        | undefined;

      try {
        if (orderDate !== undefined) {
          if (orderDate === null) {
            return res.status(400).json({
              success: false,
              message:
                "orderDate cannot be null",
            });
          }

          parsedOrderDate =
            toInstant(orderDate);
        }

        if (expectedDate !== undefined) {
          if (expectedDate === null) {
            parsedExpectedDate = null;
          } else {
            parsedExpectedDate =
              toInstant(expectedDate);
          }
        }
      } catch (dateError) {
        console.error(
          "UPDATE PURCHASE ORDER DATE ERROR:",
          dateError,
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Use ISO format like 2026-09-01T00:00:00Z",
        });
      }

      // --------------------------------------------------------
      // UPDATE DATA
      // --------------------------------------------------------

      const updateData = {
        ...(poNumber !== undefined && {
          poNumber,
        }),

        ...(numericProjectId !== undefined && {
          projectId: numericProjectId,
        }),

        ...(numericVendorId !== undefined && {
          vendorId: numericVendorId,
        }),

        ...(parsedOrderDate !== undefined && {
          orderDate: parsedOrderDate,
        }),

        ...(parsedExpectedDate !== undefined && {
          expectedDate: parsedExpectedDate,
        }),

        ...(status !== undefined && {
          status,
        }),

        ...(subtotal !== undefined && {
          subtotal: String(subtotal),
        }),

        ...(taxAmount !== undefined && {
          taxAmount: String(taxAmount),
        }),

        ...(totalAmount !== undefined && {
          totalAmount: String(totalAmount),
        }),

        ...(remarks !== undefined && {
          remarks,
        }),
      };

      console.log(
        "UPDATE PURCHASE ORDER DATA:",
        updateData,
      );

      const updatedPO =
        await db.orm.public.PurchaseOrder
          .where({ id })
          .update(updateData);

      return res.json({
        success: true,
        message:
          "Purchase order updated successfully",
        data: updatedPO,
      });
    } catch (error) {
      console.error(
        "UPDATE PURCHASE ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update purchase order",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// DELETE PURCHASE ORDER
// DELETE /api/purchase-orders/:id
// ============================================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase order ID",
        });
      }

      const existingPO =
        await db.orm.public.PurchaseOrder
          .where({ id })
          .first();

      if (!existingPO) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      const deletedPO =
        await db.orm.public.PurchaseOrder
          .where({ id })
          .delete();

      return res.json({
        success: true,
        message:
          "Purchase order deleted successfully",
        data: deletedPO,
      });
    } catch (error) {
      console.error(
        "DELETE PURCHASE ORDER ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete purchase order",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// EXPORT
// ============================================================

export default router;