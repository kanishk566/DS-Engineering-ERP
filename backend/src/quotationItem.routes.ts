import { Router, type Request, type Response } from "express";
import "temporal-polyfill/full/global";
import { db } from "./prisma/db.js";

const router = Router();



/* ============================================================
   GET ALL QUOTATION ITEMS
   GET /api/quotation-items
   ============================================================ */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const items = await db.orm.public.QuotationItem
      .orderBy((item) => item.id.desc())
      .all();

    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get quotation items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation items",
    });
  }
});

/* ============================================================
   GET QUOTATION ITEMS BY QUOTATION ID
   GET /api/quotation-items/quotation/:quotationId
   ============================================================ */
router.get(
  "/quotation/:quotationId",
  async (req: Request, res: Response) => {
    try {
      const quotationId = Number(req.params.quotationId);

      if (!Number.isInteger(quotationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation ID",
        });
      }

      const items = await db.orm.public.QuotationItem
        .where({
          quotationId,
        })
        .orderBy((item) => item.id.asc())
        .all();

      return res.json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      console.error("Get quotation items by quotation error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch quotation items",
      });
    }
  }
);

/* ============================================================
   GET QUOTATION ITEM BY ID
   GET /api/quotation-items/:id
   ============================================================ */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation item ID",
      });
    }

    const item = await db.orm.public.QuotationItem
      .where({ id })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Quotation item not found",
      });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get quotation item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation item",
    });
  }
});

/* ============================================================
   CREATE QUOTATION ITEM
   POST /api/quotation-items
   ============================================================ */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      quotationId,
      itemName,
      description,
      quantity,
      unit,
      unitPrice,
      totalPrice,
    } = req.body;

    if (
      quotationId === undefined ||
      !itemName ||
      quantity === undefined ||
      unitPrice === undefined ||
      totalPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "quotationId, itemName, quantity, unitPrice and totalPrice are required",
      });
    }

    const quotationIdNumber = Number(quotationId);

    if (!Number.isInteger(quotationIdNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const item = await db.orm.public.QuotationItem.create({
      quotationId: quotationIdNumber,
      itemName: String(itemName),
      description:
        description !== undefined && description !== null
          ? String(description)
          : null,
      quantity: String(quantity),
      unit: unit !== undefined && unit !== null ? String(unit) : null,
      unitPrice: String(unitPrice),
      totalPrice: String(totalPrice),
    });

    return res.status(201).json({
      success: true,
      message: "Quotation item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create quotation item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create quotation item",
    });
  }
});

/* ============================================================
   UPDATE QUOTATION ITEM
   PUT /api/quotation-items/:id
   ============================================================ */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation item ID",
      });
    }

    const existingItem = await db.orm.public.QuotationItem
      .where({ id })
      .first();

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Quotation item not found",
      });
    }

    const {
      quotationId,
      itemName,
      description,
      quantity,
      unit,
      unitPrice,
      totalPrice,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (quotationId !== undefined) {
      const quotationIdNumber = Number(quotationId);

      if (!Number.isInteger(quotationIdNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation ID",
        });
      }

      updateData.quotationId = quotationIdNumber;
    }

    if (itemName !== undefined) {
      updateData.itemName = String(itemName);
    }

    if (description !== undefined) {
      updateData.description =
        description === null ? null : String(description);
    }

    if (quantity !== undefined) {
      updateData.quantity = String(quantity);
    }

    if (unit !== undefined) {
      updateData.unit = unit === null ? null : String(unit);
    }

    if (unitPrice !== undefined) {
      updateData.unitPrice = String(unitPrice);
    }

    if (totalPrice !== undefined) {
      updateData.totalPrice = String(totalPrice);
    }

    const updatedItem = await db.orm.public.QuotationItem
      .where({ id })
      .update(updateData);

    return res.json({
      success: true,
      message: "Quotation item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Update quotation item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation item",
    });
  }
});

/* ============================================================
   DELETE QUOTATION ITEM
   DELETE /api/quotation-items/:id
   ============================================================ */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation item ID",
      });
    }

    const existingItem = await db.orm.public.QuotationItem
      .where({ id })
      .first();

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Quotation item not found",
      });
    }

    await db.orm.public.QuotationItem
      .where({ id })
      .delete();

    return res.json({
      success: true,
      message: "Quotation item deleted successfully",
    });
  } catch (error) {
    console.error("Delete quotation item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete quotation item",
    });
  }
});

export default router;