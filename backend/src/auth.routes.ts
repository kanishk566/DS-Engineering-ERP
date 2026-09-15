import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

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

const PASSWORD_RESET_SECRET =
  process.env.PASSWORD_RESET_SECRET || JWT_SECRET;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// ============================================================
// EMAIL CONFIG
// ============================================================

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM || SMTP_USER;

const mailer =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure:
          String(process.env.SMTP_SECURE).toLowerCase() ===
          "true",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    : null;

// ============================================================
// HELPERS
// ============================================================

function passwordFingerprint(passwordHash: string) {
  return crypto
    .createHash("sha256")
    .update(passwordHash)
    .digest("hex");
}

function createPasswordResetToken(
  userId: number,
  passwordHash: string,
) {
  return jwt.sign(
    {
      sub: String(userId),
      type: "password_reset",
      pwd: passwordFingerprint(passwordHash),
    },
    PASSWORD_RESET_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

function verifyPasswordResetToken(token: string) {
  const decoded = jwt.verify(
    token,
    PASSWORD_RESET_SECRET,
  );

  if (
    typeof decoded !== "object" ||
    decoded === null
  ) {
    throw new Error("Invalid reset token");
  }

  const payload = decoded as JwtPayload & {
    sub?: string;
    type?: string;
    pwd?: string;
  };

  if (
    payload.type !== "password_reset" ||
    !payload.sub ||
    !payload.pwd
  ) {
    throw new Error("Invalid reset token");
  }

  return {
    userId: Number(payload.sub),
    passwordFingerprint: payload.pwd,
  };
}

function isStrongEnoughPassword(password: unknown) {
  return (
    typeof password === "string" &&
    password.length >= 8
  );
}

async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  if (!mailer || !SMTP_FROM) {
    throw new Error(
      "SMTP email configuration is not configured",
    );
  }

  await mailer.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "DS Engineering ERP - Reset Password",
    text: [
      `Hello ${name || "User"},`,
      "",
      "We received a request to reset your DS Engineering ERP password.",
      "",
      `Reset your password using this link: ${resetUrl}`,
      "",
      "This link will expire in 15 minutes.",
      "",
      "If you did not request this, you can safely ignore this email.",
      "",
      "DS Engineering ERP System",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px;margin:auto;">
        <h2 style="margin-bottom:8px;">DS Engineering ERP</h2>
        <p>Hello ${name || "User"},</p>
        <p>We received a request to reset your ERP account password.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;"
          >
            Reset Password
          </a>
        </p>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p style="color:#64748b;font-size:13px;">
          If you did not request this, you can safely ignore this email.
        </p>
        <p>DS Engineering ERP System</p>
      </div>
    `,
  });
}

// ============================================================
// REGISTER USER
// POST /api/auth/register
// ============================================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const users = await db.orm.public.User.all();

    const existingUser = users.find(
      (user) =>
        user.email.toLowerCase() ===
        normalizedEmail,
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12,
    );

    const user = await db.orm.public.User.create({
      name: String(name).trim(),
      email: normalizedEmail,
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const users = await db.orm.public.User.all();

    const user = users.find(
      (item) =>
        item.email.toLowerCase() ===
        String(email).trim().toLowerCase(),
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    let passwordValid = false;

    if (user.passwordHash.startsWith("$2")) {
      passwordValid = await bcrypt.compare(
        password,
        user.passwordHash,
      );
    } else {
      // Compatibility with old test users.
      passwordValid =
        user.passwordHash === password;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

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
// CHANGE PASSWORD
// POST /api/auth/change-password
// ============================================================

router.post(
  "/change-password",
  authenticateToken,
  async (req, res) => {
    try {
      const user = res.locals.user;

      const userId = Number(user?.id);

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user not found",
        });
      }

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message: "All password fields are required",
        });
      }

      if (!isStrongEnoughPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirm password do not match",
        });
      }

      const dbUser =
        await db.orm.public.User
          .where({ id: userId })
          .first();

      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      let currentPasswordValid = false;

      if (dbUser.passwordHash.startsWith("$2")) {
        currentPasswordValid =
          await bcrypt.compare(
            currentPassword,
            dbUser.passwordHash,
          );
      } else {
        currentPasswordValid =
          dbUser.passwordHash === currentPassword;
      }

      if (!currentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }

      const newPasswordHash =
        await bcrypt.hash(newPassword, 12);

      await db.orm.public.User
        .where({ id: userId })
        .update({
          passwordHash: newPasswordHash,
        });

      return res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update password",
      });
    }
  },
);

// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================================

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const email = String(
        req.body?.email ?? "",
      )
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Always return the same success message so the
      // endpoint does not reveal whether an account exists.
      const genericResponse = {
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      };

      const users = await db.orm.public.User.all();

      const user = users.find(
        (item) =>
          item.email.toLowerCase() === email,
      );

      if (!user || !user.isActive) {
        return res.json(genericResponse);
      }

      const resetToken =
        createPasswordResetToken(
          user.id,
          user.passwordHash,
        );

      const resetUrl =
        `${FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;

      try {
        await sendPasswordResetEmail(
          user.email,
          user.name,
          resetUrl,
        );
      } catch (emailError) {
        console.error(
          "PASSWORD RESET EMAIL ERROR:",
          emailError,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send password reset email. Please contact the administrator.",
        });
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process password reset request",
      });
    }
  },
);

// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================================

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        token,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !token ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token and all password fields are required",
        });
      }

      if (!isStrongEnoughPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirm password do not match",
        });
      }

      let resetData;

      try {
        resetData =
          verifyPasswordResetToken(token);
      } catch {
        return res.status(400).json({
          success: false,
          message:
            "This password reset link is invalid or has expired",
        });
      }

      if (
        !Number.isInteger(resetData.userId) ||
        resetData.userId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This password reset link is invalid or has expired",
        });
      }

      const user =
        await db.orm.public.User
          .where({ id: resetData.userId })
          .first();

      if (!user || !user.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "This password reset link is invalid or has expired",
        });
      }

      // The token contains a fingerprint of the old password hash.
      // Once the password changes, the old reset token can no longer
      // be used, making the reset effectively one-time.
      if (
        passwordFingerprint(
          user.passwordHash,
        ) !== resetData.passwordFingerprint
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This password reset link is invalid or has already been used",
        });
      }

      const newPasswordHash =
        await bcrypt.hash(newPassword, 12);

      await db.orm.public.User
        .where({ id: user.id })
        .update({
          passwordHash: newPasswordHash,
        });

      return res.json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to reset password",
      });
    }
  },
);

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
      console.error(
        "GET CURRENT USER ERROR:",
        error,
      );

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
