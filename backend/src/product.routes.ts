import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// GET ALL PRODUCTS
// GET /api/products
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const products = await db.orm.public.Product
      .orderBy((product) => product.createdAt.desc())
      .all();

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// ============================================================
// GET PRODUCT BY ID
// GET /api/products/:id
// ============================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await db.orm.public.Product
      .where({ id })
      .first();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// ============================================================
// CREATE PRODUCT
// POST /api/products
// ============================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      productCode,
      name,
      description,
      unit,
      unitPrice,
      isActive,
    } = req.body;

    // Required fields
    if (!productCode || !name) {
      return res.status(400).json({
        success: false,
        message: "productCode and name are required",
      });
    }

    // Check duplicate product code
    const existingProduct = await db.orm.public.Product
      .where({ productCode })
      .first();

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    // Create product
    const product = await db.orm.public.Product.create({
      productCode,
      name,
      description: description ?? null,
      unit: unit ?? null,
      unitPrice: unitPrice ?? "0",
      isActive: isActive ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
});

// ============================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ============================================================

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check product exists
    const existingProduct = await db.orm.public.Product
      .where({ id })
      .first();

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      productCode,
      name,
      description,
      unit,
      unitPrice,
      isActive,
    } = req.body;

    // Check duplicate product code
    if (
      productCode !== undefined &&
      productCode !== existingProduct.productCode
    ) {
      const duplicateProduct = await db.orm.public.Product
        .where({ productCode })
        .first();

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message: "Product code already exists",
        });
      }
    }

    // Update only supplied fields
    const updateData = {
      ...(productCode !== undefined && { productCode }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(unit !== undefined && { unit }),
      ...(unitPrice !== undefined && { unitPrice }),
      ...(isActive !== undefined && { isActive }),
    };

    const updatedProduct = await db.orm.public.Product
      .where({ id })
      .update(updateData);

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
});

// ============================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ============================================================

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check product exists
    const existingProduct = await db.orm.public.Product
      .where({ id })
      .first();

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete product
    const deletedProduct = await db.orm.public.Product
      .where({ id })
      .delete();

    return res.json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
});

// ============================================================
// EXPORT ROUTER
// ============================================================

export default router;