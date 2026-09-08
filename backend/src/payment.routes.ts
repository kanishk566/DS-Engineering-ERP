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

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      "Date must be a valid ISO date string",
    );
  }

  const dateValue = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return Temporal.Instant.from(
      `${dateValue}T00:00:00Z`,
    );
  }

  return Temporal.Instant.from(dateValue);
};

// ============================================================
// PAYMENT METHODS
// ============================================================

const validPaymentMethods = [
  "cash",
  "bank_transfer",
  "cheque",
  "upi",
  "card",
  "other",
] as const;

type PaymentMethod =
  (typeof validPaymentMethods)[number];

// ============================================================
// HELPER — CALCULATE INVOICE PAID AMOUNT
// ============================================================

async function recalculateInvoice(
  invoiceId: number,
) {
  const invoice =
    await db.orm.public.Invoice
      .where({ id: invoiceId })
      .first();

  if (!invoice) {
    return null;
  }

  const payments =
    await db.orm.public.Payment
      .where({ invoiceId })
      .all();

  const paidAmount = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0,
  );

  const totalAmount =
    Number(invoice.totalAmount || 0);

  let status = invoice.status;

  if (paidAmount >= totalAmount && totalAmount > 0) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partial";
  }

  await db.orm.public.Invoice
    .where({ id: invoiceId })
    .update({
      paidAmount: paidAmount.toFixed(2),
      status,
    });

  return {
    paidAmount,
    totalAmount,
    status,
  };
}

// ============================================================
// GET ALL PAYMENTS
// GET /api/payments
// ============================================================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const payments =
        await db.orm.public.Payment
          .orderBy(
            (payment) =>
              payment.paymentDate.desc(),
          )
          .all();

      return res.json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      console.error(
        "GET PAYMENTS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// GET PAYMENT BY ID
// GET /api/payments/:id
// ============================================================

router.get(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      const payment =
        await db.orm.public.Payment
          .where({ id })
          .first();

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      return res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error(
        "GET PAYMENT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// GET PAYMENTS BY INVOICE
// GET /api/payments/invoice/:invoiceId
// ============================================================

router.get(
  "/invoice/:invoiceId",
  authenticateToken,
  async (req, res) => {
    try {
      const invoiceId = Number(
        req.params.invoiceId,
      );

      if (
        !Number.isInteger(invoiceId) ||
        invoiceId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      const invoice =
        await db.orm.public.Invoice
          .where({ id: invoiceId })
          .first();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const payments =
        await db.orm.public.Payment
          .where({ invoiceId })
          .orderBy(
            (payment) =>
              payment.paymentDate.desc(),
          )
          .all();

      return res.json({
        success: true,
        invoiceId,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      console.error(
        "GET INVOICE PAYMENTS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch invoice payments",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// CREATE PAYMENT
// POST /api/payments
// ============================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        paymentNumber,
        invoiceId,
        paymentDate,
        amount,
        paymentMethod,
        referenceNumber,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        !paymentNumber ||
        !invoiceId ||
        amount === undefined ||
        amount === null ||
        amount === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "paymentNumber, invoiceId and amount are required",
        });
      }

      const numericInvoiceId =
        Number(invoiceId);

      if (
        !Number.isInteger(numericInvoiceId) ||
        numericInvoiceId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount must be greater than 0",
        });
      }

      // --------------------------------------------------------
      // PAYMENT METHOD
      // --------------------------------------------------------

      const selectedMethod =
        paymentMethod || "bank_transfer";

      if (
        !validPaymentMethods.includes(
          selectedMethod as PaymentMethod,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment method",
          validMethods:
            validPaymentMethods,
        });
      }

      // --------------------------------------------------------
      // CHECK INVOICE
      // --------------------------------------------------------

      const invoice =
        await db.orm.public.Invoice
          .where({
            id: numericInvoiceId,
          })
          .first();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // --------------------------------------------------------
      // DUPLICATE PAYMENT NUMBER
      // --------------------------------------------------------

      const existingPayment =
        await db.orm.public.Payment
          .where({
            paymentNumber,
          })
          .first();

      if (existingPayment) {
        return res.status(409).json({
          success: false,
          message:
            "Payment number already exists",
        });
      }

      // --------------------------------------------------------
      // CHECK REMAINING BALANCE
      // --------------------------------------------------------

      const currentPaidAmount =
        Number(invoice.paidAmount || 0);

      const totalAmount =
        Number(invoice.totalAmount || 0);

      const remainingAmount =
        totalAmount - currentPaidAmount;

      if (
        totalAmount > 0 &&
        numericAmount > remainingAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount cannot exceed remaining invoice balance",
          totalAmount,
          paidAmount: currentPaidAmount,
          remainingAmount,
        });
      }

      // --------------------------------------------------------
      // PAYMENT DATE
      // --------------------------------------------------------

      let finalPaymentDate;

      if (paymentDate) {
        finalPaymentDate =
          toInstant(paymentDate);
      } else {
        finalPaymentDate =
          Temporal.Now.instant();
      }

      // --------------------------------------------------------
      // CREATE PAYMENT
      // --------------------------------------------------------

      const payment =
        await db.orm.public.Payment.create({
          paymentNumber:
            String(paymentNumber).trim(),

          invoiceId:
            numericInvoiceId,

          paymentDate:
            finalPaymentDate,

          amount:
            numericAmount.toFixed(2),

          paymentMethod:
            selectedMethod as PaymentMethod,

          referenceNumber:
            referenceNumber
              ? String(referenceNumber).trim()
              : undefined,

          notes:
            notes
              ? String(notes).trim()
              : undefined,
        });

      // --------------------------------------------------------
      // RECALCULATE INVOICE
      // --------------------------------------------------------

      const invoiceSummary =
        await recalculateInvoice(
          numericInvoiceId,
        );

      return res.status(201).json({
        success: true,
        message:
          "Payment created successfully",
        data: payment,
        invoiceSummary,
      });
    } catch (error) {
      console.error(
        "CREATE PAYMENT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create payment",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// UPDATE PAYMENT
// PUT /api/payments/:id
// ============================================================

router.put(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      const existingPayment =
        await db.orm.public.Payment
          .where({ id })
          .first();

      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const {
        paymentNumber,
        invoiceId,
        paymentDate,
        amount,
        paymentMethod,
        referenceNumber,
        notes,
      } = req.body;

      // --------------------------------------------------------
      // INVOICE
      // --------------------------------------------------------

      const finalInvoiceId =
        invoiceId !== undefined
          ? Number(invoiceId)
          : existingPayment.invoiceId;

      if (
        !Number.isInteger(finalInvoiceId) ||
        finalInvoiceId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      const invoice =
        await db.orm.public.Invoice
          .where({
            id: finalInvoiceId,
          })
          .first();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // --------------------------------------------------------
      // PAYMENT NUMBER
      // --------------------------------------------------------

      if (paymentNumber) {
        const duplicatePayment =
          await db.orm.public.Payment
            .where({
              paymentNumber:
                String(paymentNumber).trim(),
            })
            .first();

        if (
          duplicatePayment &&
          duplicatePayment.id !== id
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Payment number already exists",
          });
        }
      }

      // --------------------------------------------------------
      // AMOUNT
      // --------------------------------------------------------

      const finalAmount =
        amount !== undefined &&
        amount !== null &&
        amount !== ""
          ? Number(amount)
          : Number(existingPayment.amount);

      if (
        !Number.isFinite(finalAmount) ||
        finalAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount must be greater than 0",
        });
      }

      // --------------------------------------------------------
      // PAYMENT METHOD
      // --------------------------------------------------------

      const finalMethod =
        paymentMethod ||
        existingPayment.paymentMethod;

      if (
        !validPaymentMethods.includes(
          finalMethod as PaymentMethod,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment method",
        });
      }

      // --------------------------------------------------------
      // CHECK BALANCE
      // --------------------------------------------------------

      const existingInvoicePayments =
        await db.orm.public.Payment
          .where({
            invoiceId: finalInvoiceId,
          })
          .all();

      const paidWithoutCurrent =
        existingInvoicePayments.reduce(
          (sum, payment) => {
            if (payment.id === id) {
              return sum;
            }

            return (
              sum +
              Number(payment.amount || 0)
            );
          },
          0,
        );

      const totalAmount =
        Number(invoice.totalAmount || 0);

      const newPaidAmount =
        paidWithoutCurrent + finalAmount;

      if (
        totalAmount > 0 &&
        newPaidAmount > totalAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount cannot exceed invoice balance",
          totalAmount,
          paidAmount:
            paidWithoutCurrent,
          remainingAmount:
            totalAmount -
            paidWithoutCurrent,
        });
      }

      // --------------------------------------------------------
      // PAYMENT DATE
      // --------------------------------------------------------

      let finalPaymentDate;

      if (paymentDate) {
        finalPaymentDate =
          toInstant(paymentDate);
      }

      // --------------------------------------------------------
      // UPDATE DATA
      // --------------------------------------------------------

      const updateData: {
        paymentNumber?: string;
        invoiceId?: number;
        paymentDate?: Temporal.Instant;
        amount?: string;
        paymentMethod?: PaymentMethod;
        referenceNumber?: string;
        notes?: string;
      } = {};

      if (paymentNumber !== undefined) {
        updateData.paymentNumber =
          String(paymentNumber).trim();
      }

      if (
        invoiceId !== undefined
      ) {
        updateData.invoiceId =
          finalInvoiceId;
      }

      if (finalPaymentDate) {
        updateData.paymentDate =
          finalPaymentDate;
      }

      if (
        amount !== undefined &&
        amount !== null &&
        amount !== ""
      ) {
        updateData.amount =
          finalAmount.toFixed(2);
      }

      if (paymentMethod !== undefined) {
        updateData.paymentMethod =
          finalMethod as PaymentMethod;
      }

      if (
        referenceNumber !== undefined
      ) {
        updateData.referenceNumber =
          referenceNumber
            ? String(referenceNumber).trim()
            : "";
      }

      if (notes !== undefined) {
        updateData.notes =
          notes
            ? String(notes).trim()
            : "";
      }

      // --------------------------------------------------------
      // UPDATE PAYMENT
      // --------------------------------------------------------

      const updatedPayment =
        await db.orm.public.Payment
          .where({ id })
          .update(updateData);

      // --------------------------------------------------------
      // RECALCULATE NEW INVOICE
      // --------------------------------------------------------

      const newInvoiceSummary =
        await recalculateInvoice(
          finalInvoiceId,
        );

      // --------------------------------------------------------
      // RECALCULATE OLD INVOICE
      // IF PAYMENT WAS MOVED
      // --------------------------------------------------------

      let oldInvoiceSummary = null;

      if (
        existingPayment.invoiceId !==
        finalInvoiceId
      ) {
        oldInvoiceSummary =
          await recalculateInvoice(
            existingPayment.invoiceId,
          );
      }

      return res.json({
        success: true,
        message:
          "Payment updated successfully",
        data: updatedPayment,
        invoiceSummary:
          newInvoiceSummary,
        oldInvoiceSummary,
      });
    } catch (error) {
      console.error(
        "UPDATE PAYMENT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update payment",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

// ============================================================
// DELETE PAYMENT
// DELETE /api/payments/:id
// ============================================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      const existingPayment =
        await db.orm.public.Payment
          .where({ id })
          .first();

      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const invoiceId =
        existingPayment.invoiceId;

      // --------------------------------------------------------
      // DELETE PAYMENT
      // --------------------------------------------------------

      await db.orm.public.Payment
        .where({ id })
        .delete();

      // --------------------------------------------------------
      // RECALCULATE INVOICE
      // --------------------------------------------------------

      const invoiceSummary =
        await recalculateInvoice(
          invoiceId,
        );

      return res.json({
        success: true,
        message:
          "Payment deleted successfully",
        invoiceSummary,
      });
    } catch (error) {
      console.error(
        "DELETE PAYMENT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete payment",
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