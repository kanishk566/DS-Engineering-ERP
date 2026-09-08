import { Router, type Request, type Response } from "express";
import { Temporal } from "temporal-polyfill";
import { db } from "./prisma/db.js";

const router = Router();

// ============================================================
// DATE HELPER
// ============================================================

function parseDate(value: unknown) {
  if (!value) {
    return null;
  }

  try {
    const dateString = String(value);

    if (dateString.includes("T")) {
      return Temporal.Instant.from(dateString);
    }

    return Temporal.Instant.from(
      `${dateString}T00:00:00Z`
    );
  } catch {
    return null;
  }
}

// ============================================================
// GET ALL INVOICES
// GET /api/invoices
// ============================================================

router.get(
  "/",
  async (_req: Request, res: Response) => {
    try {
      const invoices =
        await db.orm.public.Invoice
          .orderBy((invoice) => invoice.id.desc())
          .all();

      return res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      console.error(
        "Get Invoices Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoices.",
      });
    }
  }
);

// ============================================================
// GET SINGLE INVOICE
// GET /api/invoices/:id
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
          message: "Invalid invoice ID.",
        });
      }

      const invoice =
        await db.orm.public.Invoice.first({
          id,
        });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found.",
        });
      }

      return res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      console.error(
        "Get Invoice Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice.",
      });
    }
  }
);

// ============================================================
// CREATE INVOICE
// POST /api/invoices
// ============================================================

router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const {
        invoiceNumber,
        customerId,
        projectId,
        invoiceDate,
        dueDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED VALIDATION
      // --------------------------------------------------------

      if (
        !invoiceNumber ||
        String(invoiceNumber).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Invoice Number is required.",
        });
      }

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required.",
        });
      }

      const customerIdNumber =
        Number(customerId);

      if (
        !Number.isInteger(
          customerIdNumber
        ) ||
        customerIdNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID.",
        });
      }

      // --------------------------------------------------------
      // OPTIONAL PROJECT
      // --------------------------------------------------------

      let projectIdNumber:
        | number
        | null = null;

      if (
        projectId !== undefined &&
        projectId !== null &&
        projectId !== ""
      ) {
        projectIdNumber =
          Number(projectId);

        if (
          !Number.isInteger(
            projectIdNumber
          ) ||
          projectIdNumber <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid project ID.",
          });
        }
      }

      // --------------------------------------------------------
      // DATE VALIDATION
      // --------------------------------------------------------

      const parsedInvoiceDate =
        parseDate(invoiceDate);

      if (!parsedInvoiceDate) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Invoice Date is required.",
        });
      }

      const parsedDueDate =
        parseDate(dueDate);

      if (
        dueDate &&
        !parsedDueDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Due Date.",
        });
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const invoice =
        await db.orm.public.Invoice.create({
          invoiceNumber:
            String(invoiceNumber).trim(),

          customerId:
            customerIdNumber,

          projectId:
            projectIdNumber,

          invoiceDate:
            parsedInvoiceDate,

          dueDate:
            parsedDueDate,

          status:
            status || "draft",

          subtotal:
            subtotal !== undefined &&
            subtotal !== null &&
            subtotal !== ""
              ? String(subtotal)
              : "0",

          taxAmount:
            taxAmount !== undefined &&
            taxAmount !== null &&
            taxAmount !== ""
              ? String(taxAmount)
              : "0",

          totalAmount:
            totalAmount !== undefined &&
            totalAmount !== null &&
            totalAmount !== ""
              ? String(totalAmount)
              : "0",

          paidAmount:
            paidAmount !== undefined &&
            paidAmount !== null &&
            paidAmount !== ""
              ? String(paidAmount)
              : "0",

          notes:
            notes !== undefined &&
            notes !== null &&
            String(notes).trim() !== ""
              ? String(notes).trim()
              : null,
        });

      return res.status(201).json({
        success: true,
        message:
          "Invoice created successfully.",
        data: invoice,
      });
    } catch (error) {
      console.error(
        "Create Invoice Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create invoice.",
      });
    }
  }
);

// ============================================================
// UPDATE INVOICE
// PUT /api/invoices/:id
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
          message: "Invalid invoice ID.",
        });
      }

      // --------------------------------------------------------
      // CHECK EXISTING INVOICE
      // --------------------------------------------------------

      const existingInvoice =
        await db.orm.public.Invoice.first({
          id,
        });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found.",
        });
      }

      const {
        invoiceNumber,
        customerId,
        projectId,
        invoiceDate,
        dueDate,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // BUILD UPDATE DATA
      // --------------------------------------------------------

      const data: {
        invoiceNumber?: string;
        customerId?: number;
        projectId?: number | null;
        invoiceDate?: Temporal.Instant;
        dueDate?: Temporal.Instant | null;

        status?:
          | "draft"
          | "sent"
          | "partial"
          | "paid"
          | "overdue"
          | "cancelled";

        subtotal?: string;
        taxAmount?: string;
        totalAmount?: string;
        paidAmount?: string;

        notes?: string | null;
      } = {};

      // --------------------------------------------------------
      // INVOICE NUMBER
      // --------------------------------------------------------

      if (
        invoiceNumber !== undefined
      ) {
        const value =
          String(invoiceNumber).trim();

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Invoice Number cannot be empty.",
          });
        }

        data.invoiceNumber =
          value;
      }

      // --------------------------------------------------------
      // CUSTOMER
      // --------------------------------------------------------

      if (
        customerId !== undefined
      ) {
        const customerIdNumber =
          Number(customerId);

        if (
          !Number.isInteger(
            customerIdNumber
          ) ||
          customerIdNumber <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid customer ID.",
          });
        }

        data.customerId =
          customerIdNumber;
      }

      // --------------------------------------------------------
      // PROJECT
      // --------------------------------------------------------

      if (
        projectId !== undefined
      ) {
        if (
          projectId === null ||
          projectId === ""
        ) {
          data.projectId = null;
        } else {
          const projectIdNumber =
            Number(projectId);

          if (
            !Number.isInteger(
              projectIdNumber
            ) ||
            projectIdNumber <= 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid project ID.",
            });
          }

          data.projectId =
            projectIdNumber;
        }
      }

      // --------------------------------------------------------
      // INVOICE DATE
      // --------------------------------------------------------

      if (
        invoiceDate !== undefined
      ) {
        const parsed =
          parseDate(invoiceDate);

        if (!parsed) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid Invoice Date.",
          });
        }

        data.invoiceDate =
          parsed;
      }

      // --------------------------------------------------------
      // DUE DATE
      // --------------------------------------------------------

      if (
        dueDate !== undefined
      ) {
        if (
          dueDate === null ||
          dueDate === ""
        ) {
          data.dueDate = null;
        } else {
          const parsed =
            parseDate(dueDate);

          if (!parsed) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid Due Date.",
            });
          }

          data.dueDate =
            parsed;
        }
      }

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      if (
        status !== undefined
      ) {
        const allowedStatuses = [
          "draft",
          "sent",
          "partial",
          "paid",
          "overdue",
          "cancelled",
        ];

        if (
          !allowedStatuses.includes(
            String(status)
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid invoice status.",
          });
        }

        data.status =
          String(status) as
            | "draft"
            | "sent"
            | "partial"
            | "paid"
            | "overdue"
            | "cancelled";
      }

      // --------------------------------------------------------
      // AMOUNTS
      // --------------------------------------------------------

      if (
        subtotal !== undefined
      ) {
        const value =
          Number(subtotal);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid subtotal.",
          });
        }

        data.subtotal =
          String(value);
      }

      if (
        taxAmount !== undefined
      ) {
        const value =
          Number(taxAmount);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid tax amount.",
          });
        }

        data.taxAmount =
          String(value);
      }

      if (
        totalAmount !== undefined
      ) {
        const value =
          Number(totalAmount);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid total amount.",
          });
        }

        data.totalAmount =
          String(value);
      }

      if (
        paidAmount !== undefined
      ) {
        const value =
          Number(paidAmount);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid paid amount.",
          });
        }

        data.paidAmount =
          String(value);
      }

      // --------------------------------------------------------
      // NOTES
      // --------------------------------------------------------

      if (
        notes !== undefined
      ) {
        data.notes =
          notes === null ||
          String(notes).trim() === ""
            ? null
            : String(notes).trim();
      }

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      const invoice =
        await db.orm.public.Invoice
          .where({ id })
          .update(data);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message:
            "Invoice not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Invoice updated successfully.",
        data: invoice,
      });
    } catch (error) {
      console.error(
        "Update Invoice Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update invoice.",
      });
    }
  }
);

// ============================================================
// DELETE INVOICE
// DELETE /api/invoices/:id
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
          message: "Invalid invoice ID.",
        });
      }

      // --------------------------------------------------------
      // CHECK EXISTING INVOICE
      // --------------------------------------------------------

      const existingInvoice =
        await db.orm.public.Invoice.first({
          id,
        });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found.",
        });
      }

      // --------------------------------------------------------
      // DELETE ALL LINKED PAYMENTS FIRST
      // --------------------------------------------------------
      // Payments have a foreign key to Invoice, so they must be
      // removed before the invoice itself.

      await db.orm.public.Payment
        .where({
          invoiceId: id,
        })
        .delete();

      // --------------------------------------------------------
      // DELETE ALL LINKED INVOICE ITEMS
      // --------------------------------------------------------
      // Invoice items also have a foreign key to Invoice.

      await db.orm.public.InvoiceItem
        .where({
          invoiceId: id,
        })
        .delete();

      // --------------------------------------------------------
      // DELETE INVOICE
      // --------------------------------------------------------

      const deletedInvoice =
        await db.orm.public.Invoice
          .where({ id })
          .delete();

      return res.json({
        success: true,
        message:
          "Invoice, linked payments and invoice items deleted successfully.",
        data: deletedInvoice,
      });
    } catch (error) {
      console.error(
        "Delete Invoice Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete invoice.",
      });
    }
  }
);

export default router;