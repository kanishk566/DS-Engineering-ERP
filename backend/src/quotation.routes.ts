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

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Date must be a valid ISO date string");
  }

  return Temporal.Instant.from(value);
};

// ============================================================
// QUOTATION STATUS
// ============================================================

const validStatuses = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];

// ============================================================
// GET ALL QUOTATIONS
// GET /api/quotations
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const quotations = await db.orm.public.Quotation
      .orderBy((quotation) => quotation.createdAt.desc())
      .all();

    return res.json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    console.error("GET QUOTATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotations",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// GET QUOTATION BY ID
// GET /api/quotations/:id
// ============================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = await db.orm.public.Quotation
      .where({ id })
      .first();

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    console.error("GET QUOTATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// CREATE QUOTATION
// POST /api/quotations
// ============================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      quotationNumber,
      customerId,
      projectId,
      quotationDate,
      validUntil,
      status,
      subtotal,
      taxAmount,
      totalAmount,
      notes,
    } = req.body;

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (!quotationNumber) {
      return res.status(400).json({
        success: false,
        message: "quotationNumber is required",
      });
    }

    if (
      customerId === undefined ||
      customerId === null ||
      customerId === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    // --------------------------------------------------------
    // CUSTOMER ID
    // --------------------------------------------------------

    const numericCustomerId = Number(customerId);

    if (!Number.isInteger(numericCustomerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customerId",
      });
    }

    const customer = await db.orm.public.Customer
      .where({ id: numericCustomerId })
      .first();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // --------------------------------------------------------
    // DUPLICATE QUOTATION NUMBER
    // --------------------------------------------------------

    const existingQuotation =
      await db.orm.public.Quotation
        .where({ quotationNumber })
        .first();

    if (existingQuotation) {
      return res.status(409).json({
        success: false,
        message: "Quotation number already exists",
      });
    }

    // --------------------------------------------------------
    // PROJECT ID
    // --------------------------------------------------------

    let numericProjectId: number | undefined;

    if (
      projectId !== undefined &&
      projectId !== null &&
      projectId !== ""
    ) {
      numericProjectId = Number(projectId);

      if (!Number.isInteger(numericProjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid projectId",
        });
      }

      const project = await db.orm.public.Project
        .where({ id: numericProjectId })
        .first();

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    const quotationStatus =
      status === undefined ||
      status === null ||
      status === ""
        ? "draft"
        : String(status).toLowerCase();

    if (!validStatuses.includes(quotationStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid quotation status. Valid values: draft, sent, accepted, rejected, expired",
      });
    }

    // --------------------------------------------------------
    // DATES
    // --------------------------------------------------------

    let parsedQuotationDate:
      | Temporal.Instant
      | undefined;

    let parsedValidUntil:
      | Temporal.Instant
      | undefined;

    if (
      quotationDate !== undefined &&
      quotationDate !== null &&
      quotationDate !== ""
    ) {
      parsedQuotationDate = toInstant(quotationDate);
    }

    if (
      validUntil !== undefined &&
      validUntil !== null &&
      validUntil !== ""
    ) {
      parsedValidUntil = toInstant(validUntil);
    }

    // --------------------------------------------------------
    // AMOUNTS
    // --------------------------------------------------------

    const quotationSubtotal =
      subtotal === undefined ||
      subtotal === null ||
      subtotal === ""
        ? "0"
        : String(subtotal);

    const quotationTaxAmount =
      taxAmount === undefined ||
      taxAmount === null ||
      taxAmount === ""
        ? "0"
        : String(taxAmount);

    const quotationTotalAmount =
      totalAmount === undefined ||
      totalAmount === null ||
      totalAmount === ""
        ? "0"
        : String(totalAmount);

    // --------------------------------------------------------
    // CREATE DATA
    // --------------------------------------------------------

    const createData: Record<string, unknown> = {
      quotationNumber,
      customerId: numericCustomerId,
      projectId:
        numericProjectId !== undefined
          ? numericProjectId
          : null,
      status: quotationStatus,
      subtotal: quotationSubtotal,
      taxAmount: quotationTaxAmount,
      totalAmount: quotationTotalAmount,
      notes:
        notes !== undefined
          ? notes
          : null,
    };

    // DB default quotationDate use hoga
    // agar date explicitly nahi bheji gayi.

    if (parsedQuotationDate !== undefined) {
      createData.quotationDate =
        parsedQuotationDate;
    }

    if (parsedValidUntil !== undefined) {
      createData.validUntil =
        parsedValidUntil;
    }

    // --------------------------------------------------------
    // CREATE QUOTATION
    // --------------------------------------------------------

    const quotation =
      await db.orm.public.Quotation.create(
        createData as any,
      );

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("CREATE QUOTATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create quotation",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// UPDATE QUOTATION
// PUT /api/quotations/:id
// ============================================================

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const existingQuotation =
      await db.orm.public.Quotation
        .where({ id })
        .first();

    if (!existingQuotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const {
      quotationNumber,
      customerId,
      projectId,
      quotationDate,
      validUntil,
      status,
      subtotal,
      taxAmount,
      totalAmount,
      notes,
    } = req.body;

    // --------------------------------------------------------
    // DUPLICATE QUOTATION NUMBER
    // --------------------------------------------------------

    if (
      quotationNumber !== undefined &&
      quotationNumber !==
        existingQuotation.quotationNumber
    ) {
      const duplicateQuotation =
        await db.orm.public.Quotation
          .where({ quotationNumber })
          .first();

      if (
        duplicateQuotation &&
        duplicateQuotation.id !== id
      ) {
        return res.status(409).json({
          success: false,
          message: "Quotation number already exists",
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
      numericCustomerId = Number(customerId);

      if (!Number.isInteger(numericCustomerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customerId",
        });
      }

      const customer =
        await db.orm.public.Customer
          .where({ id: numericCustomerId })
          .first();

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
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
      if (
        projectId === null ||
        projectId === ""
      ) {
        numericProjectId = null;
      } else {
        numericProjectId = Number(projectId);

        if (!Number.isInteger(numericProjectId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid projectId",
          });
        }

        const project =
          await db.orm.public.Project
            .where({ id: numericProjectId })
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
    // STATUS
    // --------------------------------------------------------

    let quotationStatus:
      | string
      | undefined;

    if (status !== undefined) {
      quotationStatus =
        String(status).toLowerCase();

      if (!validStatuses.includes(quotationStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid quotation status. Valid values: draft, sent, accepted, rejected, expired",
        });
      }
    }

    // --------------------------------------------------------
    // UPDATE DATA
    // --------------------------------------------------------

    const updateData: Record<string, unknown> = {};

    if (quotationNumber !== undefined) {
      updateData.quotationNumber =
        quotationNumber;
    }

    if (customerId !== undefined) {
      updateData.customerId =
        numericCustomerId;
    }

    if (projectId !== undefined) {
      updateData.projectId =
        numericProjectId;
    }

    if (quotationDate !== undefined) {
      updateData.quotationDate =
        quotationDate === null ||
        quotationDate === ""
          ? null
          : toInstant(quotationDate);
    }

    if (validUntil !== undefined) {
      updateData.validUntil =
        validUntil === null ||
        validUntil === ""
          ? null
          : toInstant(validUntil);
    }

    if (quotationStatus !== undefined) {
      updateData.status =
        quotationStatus;
    }

    if (subtotal !== undefined) {
      updateData.subtotal =
        String(subtotal);
    }

    if (taxAmount !== undefined) {
      updateData.taxAmount =
        String(taxAmount);
    }

    if (totalAmount !== undefined) {
      updateData.totalAmount =
        String(totalAmount);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // --------------------------------------------------------
    // UPDATE QUOTATION
    // --------------------------------------------------------

    const updatedQuotation =
      await db.orm.public.Quotation
        .where({ id })
        .update(updateData as any);

    return res.json({
      success: true,
      message: "Quotation updated successfully",
      data: updatedQuotation,
    });
  } catch (error) {
    console.error("UPDATE QUOTATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// DELETE QUOTATION
// DELETE /api/quotations/:id
// ============================================================

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const existingQuotation =
      await db.orm.public.Quotation
        .where({ id })
        .first();

    if (!existingQuotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    await db.orm.public.Quotation
      .where({ id })
      .delete();

    return res.json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    console.error("DELETE QUOTATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete quotation",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// EXPORT
// ============================================================

export default router;