import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// JWT CONFIG
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in .env");
}

// ============================================================
// REGISTER USER
// POST /api/auth/register
// ============================================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Get existing users
    const users = await db.orm.public.User.all();

    // Check existing email
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // ========================================================
    // HASH PASSWORD
    // ========================================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // ========================================================
    // CREATE USER
    // ========================================================

    const user = await db.orm.public.User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: role || "employee",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("REGISTER USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
});

// ============================================================
// LOGIN USER
// POST /api/auth/login
// ============================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Get all users
    const users = await db.orm.public.User.all();

    // Find user by email
    const user = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // ========================================================
    // VERIFY PASSWORD
    // ========================================================

    let passwordValid = false;

    // Bcrypt password
    if (user.passwordHash.startsWith("$2")) {
      passwordValid = await bcrypt.compare(
        password,
        user.passwordHash,
      );
    } else {
      // Compatibility with old test user
      passwordValid = user.passwordHash === password;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ========================================================
    // CREATE JWT TOKEN
    // ========================================================

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // ========================================================
    // LOGIN SUCCESS
    // ========================================================

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("LOGIN USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
});

// ============================================================
// GET ALL USERS
// GET /api/auth/users
// ============================================================

router.get("/users", async (_req, res) => {
  try {
    const users = await db.orm.public.User.all();

    return res.json({
      success: true,
      count: users.length,
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      })),
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// ============================================================
// GET CURRENT LOGGED-IN USER
// GET /api/auth/me
// ============================================================

router.get(
  "/me",
  authenticateToken,
  async (_req, res) => {
    try {
      const user = res.locals.user;

      return res.json({
        success: true,
        message: "Authenticated user",
        data: user,
      });
    } catch (error) {
      console.error("GET CURRENT USER ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to get current user",
      });
    }
  },
);

// ============================================================
// EXPORT ROUTER
// ============================================================

export default router;