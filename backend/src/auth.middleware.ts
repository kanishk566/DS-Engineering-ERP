import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ============================================================
// JWT SECRET
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in .env");
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
//
// Checks:
// Authorization: Bearer <JWT_TOKEN>
//
// ============================================================

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Store authenticated user information
    res.locals.user = decoded;

    next();
  } catch (error) {
    console.error("AUTHENTICATION ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};