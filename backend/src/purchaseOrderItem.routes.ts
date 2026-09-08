import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// GET ALL PURCHASE ORDER ITEMS
// GET /api/purchase-order-items
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const items =
      await db.orm.public.PurchaseOrderItem
        .all();

    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error(
      "GET PURCHASE ORDER ITEMS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order items",
    });
  }
});

// ============================================================
// GET ITEMS BY PURCHASE ORDER ID
// GET /api/purchase-order-items/purchase-order/:purchaseOrderId
// ============================================================

router.get(
  "/purchase-order/:purchaseOrderId",
  authenticateToken,
  async (req, res) => {
    try {
      const purchaseOrderId = Number(
        req.params.purchaseOrderId,
      );

      if (!Number.isInteger(purchaseOrderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase order ID",
        });
      }

      // --------------------------------------------------------
      // CHECK PURCHASE ORDER EXISTS
      // --------------------------------------------------------

      const purchaseOrder =
        await db.orm.public.PurchaseOrder
          .where({ id: purchaseOrderId })
          .first();

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      // --------------------------------------------------------
      // GET ITEMS
      // --------------------------------------------------------

      const items =
        await db.orm.public.PurchaseOrderItem
          .where({ purchaseOrderId })
          .all();

      return res.json({
        success: true,
        purchaseOrderId,
        count: items.length,
        data: items,
      });
    } catch (error) {
      console.error(
        "GET PURCHASE ORDER ITEMS BY PO ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch purchase order items",
      });
    }
  },
);

// ============================================================
// GET PURCHASE ORDER ITEM BY ID
// GET /api/purchase-order-items/:id
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
          message: "Invalid purchase order item ID",
        });
      }

      const item =
        await db.orm.public.PurchaseOrderItem
          .where({ id })
          .first();

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Purchase order item not found",
        });
      }

      return res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error(
        "GET PURCHASE ORDER ITEM ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch purchase order item",
      });
    }
  },
);

// ============================================================
// CREATE PURCHASE ORDER ITEM
// POST /api/purchase-order-items
// ============================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        purchaseOrderId,
        itemName,
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        purchaseOrderId === undefined ||
        purchaseOrderId === null
      ) {
        return res.status(400).json({
          success: false,
          message: "purchaseOrderId is required",
        });
      }

      if (!itemName || typeof itemName !== "string") {
        return res.status(400).json({
          success: false,
          message: "itemName is required",
        });
      }

      // --------------------------------------------------------
      // PURCHASE ORDER ID
      // --------------------------------------------------------

      const numericPurchaseOrderId =
        Number(purchaseOrderId);

      if (!Number.isInteger(numericPurchaseOrderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchaseOrderId",
        });
      }

      // --------------------------------------------------------
      // CHECK PURCHASE ORDER
      // --------------------------------------------------------

      const purchaseOrder =
        await db.orm.public.PurchaseOrder
          .where({
            id: numericPurchaseOrderId,
          })
          .first();

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      // --------------------------------------------------------
      // QUANTITY
      // --------------------------------------------------------

      const numericQuantity =
        quantity === undefined ||
        quantity === null ||
        quantity === ""
          ? "1"
          : String(quantity);

      if (
        !Number.isFinite(Number(numericQuantity)) ||
        Number(numericQuantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      // --------------------------------------------------------
      // UNIT PRICE
      // --------------------------------------------------------

      const numericUnitPrice =
        unitPrice === undefined ||
        unitPrice === null ||
        unitPrice === ""
          ? "0"
          : String(unitPrice);

      if (
        !Number.isFinite(Number(numericUnitPrice)) ||
        Number(numericUnitPrice) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid unitPrice",
        });
      }

      // --------------------------------------------------------
      // TOTAL PRICE
      // --------------------------------------------------------

      const calculatedTotalPrice =
        Number(numericQuantity) *
        Number(numericUnitPrice);

      const finalTotalPrice =
        totalPrice === undefined ||
        totalPrice === null ||
        totalPrice === ""
          ? String(calculatedTotalPrice)
          : String(totalPrice);

      if (
        !Number.isFinite(Number(finalTotalPrice)) ||
        Number(finalTotalPrice) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid totalPrice",
        });
      }

      // --------------------------------------------------------
      // CREATE DATA
      // --------------------------------------------------------

      const createData = {
        purchaseOrderId:
          numericPurchaseOrderId,

        itemName: itemName.trim(),

        description:
          description === undefined ||
          description === null ||
          description === ""
            ? null
            : String(description),

        quantity: numericQuantity,

        unit:
          unit === undefined ||
          unit === null ||
          unit === ""
            ? null
            : String(unit),

        unitPrice: numericUnitPrice,

        totalPrice: finalTotalPrice,
      };

      console.log(
        "CREATE PURCHASE ORDER ITEM DATA:",
        createData,
      );

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const item =
        await db.orm.public.PurchaseOrderItem
          .create(createData);

      return res.status(201).json({
        success: true,
        message:
          "Purchase order item created successfully",
        data: item,
      });
    } catch (error) {
      console.error(
        "CREATE PURCHASE ORDER ITEM ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create purchase order item",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// UPDATE PURCHASE ORDER ITEM
// PUT /api/purchase-order-items/:id
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
          message: "Invalid purchase order item ID",
        });
      }

      // --------------------------------------------------------
      // CHECK ITEM EXISTS
      // --------------------------------------------------------

      const existingItem =
        await db.orm.public.PurchaseOrderItem
          .where({ id })
          .first();

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: "Purchase order item not found",
        });
      }

      const {
        purchaseOrderId,
        itemName,
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
      } = req.body;

      // --------------------------------------------------------
      // PURCHASE ORDER
      // --------------------------------------------------------

      let numericPurchaseOrderId:
        | number
        | undefined;

      if (purchaseOrderId !== undefined) {
        numericPurchaseOrderId =
          Number(purchaseOrderId);

        if (
          !Number.isInteger(
            numericPurchaseOrderId,
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid purchaseOrderId",
          });
        }

        const purchaseOrder =
          await db.orm.public.PurchaseOrder
            .where({
              id: numericPurchaseOrderId,
            })
            .first();

        if (!purchaseOrder) {
          return res.status(404).json({
            success: false,
            message: "Purchase order not found",
          });
        }
      }

      // --------------------------------------------------------
      // BUILD UPDATE DATA
      // --------------------------------------------------------

      const updateData: Record<string, unknown> = {};

      if (numericPurchaseOrderId !== undefined) {
        updateData.purchaseOrderId =
          numericPurchaseOrderId;
      }

      if (itemName !== undefined) {
        if (
          !itemName ||
          typeof itemName !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid itemName",
          });
        }

        updateData.itemName =
          itemName.trim();
      }

      if (description !== undefined) {
        updateData.description =
          description === null ||
          description === ""
            ? null
            : String(description);
      }

      if (quantity !== undefined) {
        const numericQuantity =
          String(quantity);

        if (
          !Number.isFinite(
            Number(numericQuantity),
          ) ||
          Number(numericQuantity) <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Quantity must be greater than 0",
          });
        }

        updateData.quantity =
          numericQuantity;
      }

      if (unit !== undefined) {
        updateData.unit =
          unit === null ||
          unit === ""
            ? null
            : String(unit);
      }

      if (unitPrice !== undefined) {
        const numericUnitPrice =
          String(unitPrice);

        if (
          !Number.isFinite(
            Number(numericUnitPrice),
          ) ||
          Number(numericUnitPrice) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid unitPrice",
          });
        }

        updateData.unitPrice =
          numericUnitPrice;
      }

      if (totalPrice !== undefined) {
        const numericTotalPrice =
          String(totalPrice);

        if (
          !Number.isFinite(
            Number(numericTotalPrice),
          ) ||
          Number(numericTotalPrice) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid totalPrice",
          });
        }

        updateData.totalPrice =
          numericTotalPrice;
      }

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      const updatedItem =
        await db.orm.public.PurchaseOrderItem
          .where({ id })
          .update(updateData);

      return res.json({
        success: true,
        message:
          "Purchase order item updated successfully",
        data: updatedItem,
      });
    } catch (error) {
      console.error(
        "UPDATE PURCHASE ORDER ITEM ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update purchase order item",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// DELETE PURCHASE ORDER ITEM
// DELETE /api/purchase-order-items/:id
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
          message:
            "Invalid purchase order item ID",
        });
      }

      // --------------------------------------------------------
      // CHECK EXISTS
      // --------------------------------------------------------

      const existingItem =
        await db.orm.public.PurchaseOrderItem
          .where({ id })
          .first();

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message:
            "Purchase order item not found",
        });
      }

      // --------------------------------------------------------
      // DELETE
      // --------------------------------------------------------

      const deletedItem =
        await db.orm.public.PurchaseOrderItem
          .where({ id })
          .delete();

      return res.json({
        success: true,
        message:
          "Purchase order item deleted successfully",
        data: deletedItem,
      });
    } catch (error) {
      console.error(
        "DELETE PURCHASE ORDER ITEM ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete purchase order item",
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