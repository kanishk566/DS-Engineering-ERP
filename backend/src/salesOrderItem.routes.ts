import { Router, type Request, type Response } from "express";
import { db } from "./prisma/db.js";


const router = Router();

/*
  GET ALL SALES ORDER ITEMS
  GET /api/sales-order-items
*/
router.get("/", async (_req: Request, res: Response) => {
  try {
    const items = await db.orm.public.SalesOrderItem
      .orderBy((item) => item.id.desc())
      .all();

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Sales Order Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales order items",
    });
  }
});


/*
  GET SINGLE SALES ORDER ITEM
  GET /api/sales-order-items/:id
*/
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order item ID",
      });
    }

    const item = await db.orm.public.SalesOrderItem.first({
      id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sales order item not found",
      });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get Sales Order Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales order item",
    });
  }
});


/*
  GET ITEMS BY SALES ORDER
  GET /api/sales-order-items/sales-order/:salesOrderId
*/
router.get(
  "/sales-order/:salesOrderId",
  async (req: Request, res: Response) => {
    try {
      const salesOrderId = Number(req.params.salesOrderId);

      if (!Number.isInteger(salesOrderId) || salesOrderId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID",
        });
      }

      const items = await db.orm.public.SalesOrderItem
        .where({
          salesOrderId,
        })
        .orderBy((item) => item.id.asc())
        .all();

      return res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error("Get Sales Order Items By Order Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales order items",
      });
    }
  }
);


/*
  CREATE SALES ORDER ITEM
  POST /api/sales-order-items
*/
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      salesOrderId,
      itemName,
      description,
      quantity,
      unit,
      unitPrice,
      totalPrice,
    } = req.body;

    if (!salesOrderId) {
      return res.status(400).json({
        success: false,
        message: "Sales order ID is required",
      });
    }

    if (!itemName || String(itemName).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    const salesOrderIdNumber = Number(salesOrderId);

    if (
      !Number.isInteger(salesOrderIdNumber) ||
      salesOrderIdNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID",
      });
    }

    const item = await db.orm.public.SalesOrderItem.create({
      salesOrderId: salesOrderIdNumber,
      itemName: String(itemName).trim(),

      description:
        description !== undefined && description !== null
          ? String(description)
          : null,

      quantity:
        quantity !== undefined && quantity !== null
          ? String(quantity)
          : "1",

      unit:
        unit !== undefined && unit !== null
          ? String(unit)
          : null,

      unitPrice:
        unitPrice !== undefined && unitPrice !== null
          ? String(unitPrice)
          : "0",

      totalPrice:
        totalPrice !== undefined && totalPrice !== null
          ? String(totalPrice)
          : "0",
    });

    return res.status(201).json({
      success: true,
      message: "Sales order item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create Sales Order Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create sales order item",
    });
  }
});


/*
  UPDATE SALES ORDER ITEM
  PUT /api/sales-order-items/:id
*/
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order item ID",
      });
    }

    const existingItem =
      await db.orm.public.SalesOrderItem.first({
        id,
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Sales order item not found",
      });
    }

    const {
      salesOrderId,
      itemName,
      description,
      quantity,
      unit,
      unitPrice,
      totalPrice,
    } = req.body;

    const data: {
      salesOrderId?: number;
      itemName?: string;
      description?: string | null;
      quantity?: string;
      unit?: string | null;
      unitPrice?: string;
      totalPrice?: string;
    } = {};

    if (salesOrderId !== undefined) {
      const salesOrderIdNumber = Number(salesOrderId);

      if (
        !Number.isInteger(salesOrderIdNumber) ||
        salesOrderIdNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID",
        });
      }

      data.salesOrderId = salesOrderIdNumber;
    }

    if (itemName !== undefined) {
      if (String(itemName).trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Item name cannot be empty",
        });
      }

      data.itemName = String(itemName).trim();
    }

    if (description !== undefined) {
      data.description =
        description === null ? null : String(description);
    }

    if (quantity !== undefined) {
      data.quantity = String(quantity);
    }

    if (unit !== undefined) {
      data.unit = unit === null ? null : String(unit);
    }

    if (unitPrice !== undefined) {
      data.unitPrice = String(unitPrice);
    }

    if (totalPrice !== undefined) {
      data.totalPrice = String(totalPrice);
    }

    const item =
      await db.orm.public.SalesOrderItem
        .where({ id })
        .update(data);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sales order item not found",
      });
    }

    return res.json({
      success: true,
      message: "Sales order item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update Sales Order Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update sales order item",
    });
  }
});


/*
  DELETE SALES ORDER ITEM
  DELETE /api/sales-order-items/:id
*/
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order item ID",
      });
    }

    const existingItem =
      await db.orm.public.SalesOrderItem.first({
        id,
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Sales order item not found",
      });
    }

    const deletedItem =
      await db.orm.public.SalesOrderItem
        .where({ id })
        .delete();

    return res.json({
      success: true,
      message: "Sales order item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    console.error("Delete Sales Order Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete sales order item",
    });
  }
});


export default router;