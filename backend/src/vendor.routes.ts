import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// GET ALL VENDORS
// GET /api/vendors
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    console.log("GET /api/vendors - request received");

    const vendors = await db.orm.public.Vendor.all();

    console.log(
      "GET /api/vendors - vendors fetched:",
      vendors.length,
    );

    return res.json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    console.error("GET VENDORS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
    });
  }
});

// ============================================================
// GET VENDOR BY ID
// GET /api/vendors/:id
// ============================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const vendor = await db.orm.public.Vendor
      .where({ id })
      .first();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("GET VENDOR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
    });
  }
});

// ============================================================
// CREATE VENDOR
// POST /api/vendors
// ============================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      vendorCode,
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

    if (!vendorCode || !name) {
      return res.status(400).json({
        success: false,
        message: "vendorCode and name are required",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE VENDOR CODE
    // --------------------------------------------------------

    const existingVendors =
      await db.orm.public.Vendor.all();

    const existingVendor = existingVendors.find(
      (vendor) =>
        vendor.vendorCode.toLowerCase() ===
        String(vendorCode).toLowerCase(),
    );

    if (existingVendor) {
      return res.status(409).json({
        success: false,
        message: "Vendor with this vendorCode already exists",
      });
    }

    // --------------------------------------------------------
    // CREATE VENDOR
    // --------------------------------------------------------

    const vendor = await db.orm.public.Vendor.create({
      vendorCode: String(vendorCode).trim(),
      name: String(name).trim(),

      contactPerson: contactPerson
        ? String(contactPerson).trim()
        : null,

      email: email
        ? String(email).trim().toLowerCase()
        : null,

      phone: phone
        ? String(phone).trim()
        : null,

      address: address
        ? String(address).trim()
        : null,

      gstNumber: gstNumber
        ? String(gstNumber).trim()
        : null,
    });

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("CREATE VENDOR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create vendor",
    });
  }
});

// ============================================================
// UPDATE VENDOR
// PUT /api/vendors/:id
// ============================================================

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const {
      vendorCode,
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
    } = req.body;

    // --------------------------------------------------------
    // CHECK VENDOR EXISTS
    // --------------------------------------------------------

    const existingVendor = await db.orm.public.Vendor
      .where({ id })
      .first();

    if (!existingVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!vendorCode || !name) {
      return res.status(400).json({
        success: false,
        message: "vendorCode and name are required",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE VENDOR CODE
    // --------------------------------------------------------

    const vendors = await db.orm.public.Vendor.all();

    const duplicateVendor = vendors.find(
      (vendor) =>
        vendor.id !== id &&
        vendor.vendorCode.toLowerCase() ===
          String(vendorCode).toLowerCase(),
    );

    if (duplicateVendor) {
      return res.status(409).json({
        success: false,
        message:
          "Another vendor with this vendorCode already exists",
      });
    }

    // --------------------------------------------------------
    // UPDATE VENDOR
    // --------------------------------------------------------

    const vendor = await db.orm.public.Vendor
      .where({ id })
      .update({
        vendorCode: String(vendorCode).trim(),
        name: String(name).trim(),

        contactPerson: contactPerson
          ? String(contactPerson).trim()
          : null,

        email: email
          ? String(email).trim().toLowerCase()
          : null,

        phone: phone
          ? String(phone).trim()
          : null,

        address: address
          ? String(address).trim()
          : null,

        gstNumber: gstNumber
          ? String(gstNumber).trim()
          : null,
      });

    return res.json({
      success: true,
      message: "Vendor updated successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("UPDATE VENDOR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update vendor",
    });
  }
});

// ============================================================
// DELETE VENDOR
// DELETE /api/vendors/:id
// ============================================================

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    // --------------------------------------------------------
    // CHECK VENDOR EXISTS
    // --------------------------------------------------------

    const existingVendor = await db.orm.public.Vendor
      .where({ id })
      .first();

    if (!existingVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // --------------------------------------------------------
    // DELETE VENDOR
    // --------------------------------------------------------

    const vendor = await db.orm.public.Vendor
      .where({ id })
      .delete();

    return res.json({
      success: true,
      message: "Vendor deleted successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("DELETE VENDOR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete vendor",
    });
  }
});

// ============================================================
// EXPORT
// ============================================================

export default router;