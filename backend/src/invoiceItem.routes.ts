import { Router, type Request, type Response } from "express";
import { db } from "./prisma/db.js";

const router = Router();


// ============================================================
// GET ALL INVOICE ITEMS
// GET /api/invoice-items
// ============================================================

router.get(
  "/",
  async (_req: Request, res: Response) => {
    try {
      const items =
        await db.orm.public.InvoiceItem
          .orderBy((item) => item.id.desc())
          .all();

      return res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error(
        "Get Invoice Items Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice items.",
      });
    }
  }
);


// ============================================================
// GET SINGLE INVOICE ITEM
// GET /api/invoice-items/:id
// ============================================================

router.get(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice item ID.",
        });
      }

      const item =
        await db.orm.public.InvoiceItem.first({
          id,
        });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Invoice item not found.",
        });
      }

      return res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error(
        "Get Invoice Item Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice item.",
      });
    }
  }
);


// ============================================================
// GET ITEMS BY INVOICE
// GET /api/invoice-items/invoice/:invoiceId
// ============================================================

router.get(
  "/invoice/:invoiceId",
  async (req: Request, res: Response) => {
    try {
      const invoiceId =
        Number(req.params.invoiceId);

      if (
        !Number.isInteger(invoiceId) ||
        invoiceId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID.",
        });
      }

      const items =
        await db.orm.public.InvoiceItem
          .where({
            invoiceId,
          })
          .orderBy((item) => item.id.asc())
          .all();

      return res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error(
        "Get Invoice Items By Invoice Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch invoice items.",
      });
    }
  }
);


// ============================================================
// CREATE INVOICE ITEM
// POST /api/invoice-items
// ============================================================

router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const {
        invoiceId,
        itemName,
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
      } = req.body;


      // --------------------------------------------------------
      // REQUIRED VALIDATION
      // --------------------------------------------------------

      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: "Invoice ID is required.",
        });
      }

      const invoiceIdNumber =
        Number(invoiceId);

      if (
        !Number.isInteger(invoiceIdNumber) ||
        invoiceIdNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID.",
        });
      }


      if (
        !itemName ||
        String(itemName).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Item name is required.",
        });
      }


      // --------------------------------------------------------
      // CHECK INVOICE EXISTS
      // --------------------------------------------------------

      const invoice =
        await db.orm.public.Invoice.first({
          id: invoiceIdNumber,
        });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found.",
        });
      }


      // --------------------------------------------------------
      // QUANTITY
      // --------------------------------------------------------

      const quantityValue =
        quantity !== undefined &&
        quantity !== null &&
        quantity !== ""
          ? Number(quantity)
          : 1;

      if (
        Number.isNaN(quantityValue) ||
        quantityValue <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity.",
        });
      }


      // --------------------------------------------------------
      // UNIT PRICE
      // --------------------------------------------------------

      const unitPriceValue =
        unitPrice !== undefined &&
        unitPrice !== null &&
        unitPrice !== ""
          ? Number(unitPrice)
          : 0;

      if (
        Number.isNaN(unitPriceValue) ||
        unitPriceValue < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid unit price.",
        });
      }


      // --------------------------------------------------------
      // TOTAL PRICE
      // --------------------------------------------------------

      const calculatedTotal =
        quantityValue * unitPriceValue;

      const totalPriceValue =
        totalPrice !== undefined &&
        totalPrice !== null &&
        totalPrice !== ""
          ? Number(totalPrice)
          : calculatedTotal;

      if (
        Number.isNaN(totalPriceValue) ||
        totalPriceValue < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid total price.",
        });
      }


      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const item =
        await db.orm.public.InvoiceItem.create({
          invoiceId:
            invoiceIdNumber,

          itemName:
            String(itemName).trim(),

          description:
            description !== undefined &&
            description !== null &&
            String(description).trim() !== ""
              ? String(description).trim()
              : null,

          quantity:
            String(quantityValue),

          unit:
            unit !== undefined &&
            unit !== null &&
            String(unit).trim() !== ""
              ? String(unit).trim()
              : null,

          unitPrice:
            String(unitPriceValue),

          totalPrice:
            String(totalPriceValue),
        });


      return res.status(201).json({
        success: true,
        message:
          "Invoice item created successfully.",
        data: item,
      });

    } catch (error) {
      console.error(
        "Create Invoice Item Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create invoice item.",
      });
    }
  }
);


// ============================================================
// UPDATE INVOICE ITEM
// PUT /api/invoice-items/:id
// ============================================================

router.put(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice item ID.",
        });
      }


      // --------------------------------------------------------
      // CHECK EXISTING ITEM
      // --------------------------------------------------------

      const existingItem =
        await db.orm.public.InvoiceItem.first({
          id,
        });

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: "Invoice item not found.",
        });
      }


      const {
        invoiceId,
        itemName,
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
      } = req.body;


      // --------------------------------------------------------
      // BUILD UPDATE DATA
      // --------------------------------------------------------

      const data: {
        invoiceId?: number;
        itemName?: string;
        description?: string | null;
        quantity?: string;
        unit?: string | null;
        unitPrice?: string;
        totalPrice?: string;
      } = {};


      // --------------------------------------------------------
      // INVOICE
      // --------------------------------------------------------

      if (
        invoiceId !== undefined
      ) {
        const invoiceIdNumber =
          Number(invoiceId);

        if (
          !Number.isInteger(
            invoiceIdNumber
          ) ||
          invoiceIdNumber <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid invoice ID.",
          });
        }


        const invoice =
          await db.orm.public.Invoice.first({
            id: invoiceIdNumber,
          });

        if (!invoice) {
          return res.status(404).json({
            success: false,
            message:
              "Invoice not found.",
          });
        }

        data.invoiceId =
          invoiceIdNumber;
      }


      // --------------------------------------------------------
      // ITEM NAME
      // --------------------------------------------------------

      if (
        itemName !== undefined
      ) {
        const value =
          String(itemName).trim();

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Item name cannot be empty.",
          });
        }

        data.itemName = value;
      }


      // --------------------------------------------------------
      // DESCRIPTION
      // --------------------------------------------------------

      if (
        description !== undefined
      ) {
        data.description =
          description === null ||
          String(description).trim() === ""
            ? null
            : String(description).trim();
      }


      // --------------------------------------------------------
      // QUANTITY
      // --------------------------------------------------------

      if (
        quantity !== undefined
      ) {
        const value =
          Number(quantity);

        if (
          Number.isNaN(value) ||
          value <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid quantity.",
          });
        }

        data.quantity =
          String(value);
      }


      // --------------------------------------------------------
      // UNIT
      // --------------------------------------------------------

      if (
        unit !== undefined
      ) {
        data.unit =
          unit === null ||
          String(unit).trim() === ""
            ? null
            : String(unit).trim();
      }


      // --------------------------------------------------------
      // UNIT PRICE
      // --------------------------------------------------------

      if (
        unitPrice !== undefined
      ) {
        const value =
          Number(unitPrice);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid unit price.",
          });
        }

        data.unitPrice =
          String(value);
      }


      // --------------------------------------------------------
      // TOTAL PRICE
      // --------------------------------------------------------

      if (
        totalPrice !== undefined
      ) {
        const value =
          Number(totalPrice);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid total price.",
          });
        }

        data.totalPrice =
          String(value);
      }


      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      const item =
        await db.orm.public.InvoiceItem
          .where({ id })
          .update(data);


      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            "Invoice item not found.",
        });
      }


      return res.json({
        success: true,
        message:
          "Invoice item updated successfully.",
        data: item,
      });

    } catch (error) {
      console.error(
        "Update Invoice Item Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update invoice item.",
      });
    }
  }
);


// ============================================================
// DELETE INVOICE ITEM
// DELETE /api/invoice-items/:id
// ============================================================

router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice item ID.",
        });
      }


      const existingItem =
        await db.orm.public.InvoiceItem.first({
          id,
        });

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message:
            "Invoice item not found.",
        });
      }


      const deletedItem =
        await db.orm.public.InvoiceItem
          .where({ id })
          .delete();


      return res.json({
        success: true,
        message:
          "Invoice item deleted successfully.",
        data: deletedItem,
      });

    } catch (error) {
      console.error(
        "Delete Invoice Item Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete invoice item.",
      });
    }
  }
);


export default router;