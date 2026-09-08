import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// GET ALL CUSTOMERS
// GET /api/customers
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const customers = await db.orm.public.Customer
      .orderBy((customer) => customer.createdAt.desc())
      .all();

    return res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("GET /api/customers ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

// ============================================================
// GET CUSTOMER BY ID
// GET /api/customers/:id
// ============================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await db.orm.public.Customer
      .where({ id })
      .first();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("GET CUSTOMER BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
});

// ============================================================
// CREATE CUSTOMER
// POST /api/customers
// ============================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      customerCode,
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!customerCode || !name) {
      return res.status(400).json({
        success: false,
        message: "customerCode and name are required",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE CUSTOMER CODE
    // --------------------------------------------------------

    const existingCustomer = await db.orm.public.Customer
      .where({ customerCode })
      .first();

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer code already exists",
      });
    }

    // --------------------------------------------------------
    // CREATE CUSTOMER
    // --------------------------------------------------------

    const customer = await db.orm.public.Customer.create({
      customerCode,
      name,
      contactPerson: contactPerson ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      gstNumber: gstNumber ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
});

// ============================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// ============================================================

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // --------------------------------------------------------
    // CHECK CUSTOMER EXISTS
    // --------------------------------------------------------

    const existingCustomer = await db.orm.public.Customer
      .where({ id })
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      customerCode,
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
    } = req.body;

    // --------------------------------------------------------
    // CHECK DUPLICATE CUSTOMER CODE
    // --------------------------------------------------------

    if (
      customerCode !== undefined &&
      customerCode !== existingCustomer.customerCode
    ) {
      const duplicateCustomer =
        await db.orm.public.Customer
          .where({ customerCode })
          .first();

      if (duplicateCustomer) {
        return res.status(409).json({
          success: false,
          message: "Customer code already exists",
        });
      }
    }

    // --------------------------------------------------------
    // UPDATE ONLY SUPPLIED FIELDS
    // --------------------------------------------------------

    const updateData = {
      ...(customerCode !== undefined && { customerCode }),
      ...(name !== undefined && { name }),
      ...(contactPerson !== undefined && { contactPerson }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(gstNumber !== undefined && { gstNumber }),
    };

    const updatedCustomer = await db.orm.public.Customer
      .where({ id })
      .update(updateData);

    return res.json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
});

// ============================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// ============================================================

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // --------------------------------------------------------
    // CHECK CUSTOMER EXISTS
    // --------------------------------------------------------

    const existingCustomer = await db.orm.public.Customer
      .where({ id })
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // --------------------------------------------------------
    // DELETE CUSTOMER
    // --------------------------------------------------------

    const deletedCustomer = await db.orm.public.Customer
      .where({ id })
      .delete();

    return res.json({
      success: true,
      message: "Customer deleted successfully",
      data: deletedCustomer,
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
});

// ============================================================
// EXPORT ROUTER
// ============================================================

export default router;