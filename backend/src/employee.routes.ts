import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// GET ALL EMPLOYEES
// GET /api/employees
// ============================================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const employees =
      await db.orm.public.Employee
        .orderBy((employee) => employee.createdAt.desc())
        .all();

    return res.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// GET EMPLOYEE BY ID
// GET /api/employees/:id
// ============================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee =
      await db.orm.public.Employee
        .where({ id })
        .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("GET EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// CREATE EMPLOYEE
// POST /api/employees
// ============================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      phone,
      email,
      designation,
      department,
      joiningDate,
      status,
      userId,
    } = req.body;

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (
      !employeeCode ||
      String(employeeCode).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required",
      });
    }

    if (
      !firstName ||
      String(firstName).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "First name is required",
      });
    }

    // --------------------------------------------------------
    // DUPLICATE EMPLOYEE CODE
    // --------------------------------------------------------

    const existingEmployee =
      await db.orm.public.Employee
        .where({
          employeeCode: String(employeeCode).trim(),
        })
        .first();

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee code already exists",
      });
    }

    // --------------------------------------------------------
    // USER ID
    // --------------------------------------------------------

    let numericUserId:
      | number
      | null
      | undefined;

    if (
      userId !== undefined &&
      userId !== null &&
      userId !== ""
    ) {
      numericUserId = Number(userId);

      if (
        !Number.isInteger(numericUserId) ||
        numericUserId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId",
        });
      }

      const user =
        await db.orm.public.User
          .where({
            id: numericUserId,
          })
          .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const linkedEmployee =
        await db.orm.public.Employee
          .where({
            userId: numericUserId,
          })
          .first();

      if (linkedEmployee) {
        return res.status(409).json({
          success: false,
          message:
            "This user is already linked to another employee",
        });
      }
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    const employeeStatus =
      status === undefined ||
      status === null ||
      status === ""
        ? "active"
        : String(status).toLowerCase();

    const validStatuses = [
      "active",
      "inactive",
      "on_leave",
    ];

    if (!validStatuses.includes(employeeStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid employee status. Valid values: active, inactive, on_leave",
      });
    }

    // --------------------------------------------------------
    // JOINING DATE
    // --------------------------------------------------------

    let parsedJoiningDate = null;

    if (
      joiningDate !== undefined &&
      joiningDate !== null &&
      joiningDate !== ""
    ) {
      try {
        const dateString = String(joiningDate).trim();

        parsedJoiningDate =
          dateString.length === 10
            ? `${dateString}T00:00:00Z`
            : dateString;
      } catch {
        return res.status(400).json({
          success: false,
          message:
            "Invalid joiningDate. Please use YYYY-MM-DD.",
        });
      }
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const employee =
      await db.orm.public.Employee.create({
        employeeCode:
          String(employeeCode).trim(),

        firstName:
          String(firstName).trim(),

        lastName:
          lastName === undefined ||
          lastName === ""
            ? null
            : String(lastName).trim(),

        phone:
          phone === undefined ||
          phone === ""
            ? null
            : String(phone).trim(),

        email:
          email === undefined ||
          email === ""
            ? null
            : String(email).trim(),

        designation:
          designation === undefined ||
          designation === ""
            ? null
            : String(designation).trim(),

        department:
          department === undefined ||
          department === ""
            ? null
            : String(department).trim(),

        joiningDate:
          parsedJoiningDate,

        status:
          employeeStatus as any,

        userId:
          numericUserId !== undefined
            ? numericUserId
            : null,
      } as any);

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// UPDATE EMPLOYEE
// PUT /api/employees/:id
// ============================================================

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const existingEmployee =
      await db.orm.public.Employee
        .where({ id })
        .first();

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
      employeeCode,
      firstName,
      lastName,
      phone,
      email,
      designation,
      department,
      joiningDate,
      status,
      userId,
    } = req.body;

    // --------------------------------------------------------
    // EMPLOYEE CODE
    // --------------------------------------------------------

    if (employeeCode !== undefined) {
      const newCode =
        String(employeeCode).trim();

      if (!newCode) {
        return res.status(400).json({
          success: false,
          message: "Employee code cannot be empty",
        });
      }

      const duplicate =
        await db.orm.public.Employee
          .where({
            employeeCode: newCode,
          })
          .first();

      if (
        duplicate &&
        duplicate.id !== id
      ) {
        return res.status(409).json({
          success: false,
          message: "Employee code already exists",
        });
      }
    }

    // --------------------------------------------------------
    // USER ID
    // --------------------------------------------------------

    let numericUserId:
      | number
      | null
      | undefined;

    if (userId !== undefined) {
      if (
        userId === null ||
        userId === ""
      ) {
        numericUserId = null;
      } else {
        numericUserId = Number(userId);

        if (
          !Number.isInteger(numericUserId) ||
          numericUserId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid userId",
          });
        }

        const user =
          await db.orm.public.User
            .where({
              id: numericUserId,
            })
            .first();

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const linkedEmployee =
          await db.orm.public.Employee
            .where({
              userId: numericUserId,
            })
            .first();

        if (
          linkedEmployee &&
          linkedEmployee.id !== id
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This user is already linked to another employee",
          });
        }
      }
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    let employeeStatus;

    if (status !== undefined) {
      employeeStatus =
        String(status).toLowerCase();

      const validStatuses = [
        "active",
        "inactive",
        "on_leave",
      ];

      if (
        !validStatuses.includes(
          employeeStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid employee status",
        });
      }
    }

    // --------------------------------------------------------
    // JOINING DATE
    // --------------------------------------------------------

    let parsedJoiningDate;

    if (joiningDate !== undefined) {
      if (
        joiningDate === null ||
        joiningDate === ""
      ) {
        parsedJoiningDate = null;
      } else {
        const dateString =
          String(joiningDate).trim();

        parsedJoiningDate =
          dateString.length === 10
            ? `${dateString}T00:00:00Z`
            : dateString;
      }
    }

    // --------------------------------------------------------
    // UPDATE DATA
    // --------------------------------------------------------

    const updateData: Record<
      string,
      unknown
    > = {};

    if (employeeCode !== undefined) {
      updateData.employeeCode =
        String(employeeCode).trim();
    }

    if (firstName !== undefined) {
      if (
        String(firstName).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "First name cannot be empty",
        });
      }

      updateData.firstName =
        String(firstName).trim();
    }

    if (lastName !== undefined) {
      updateData.lastName =
        lastName === ""
          ? null
          : String(lastName).trim();
    }

    if (phone !== undefined) {
      updateData.phone =
        phone === ""
          ? null
          : String(phone).trim();
    }

    if (email !== undefined) {
      updateData.email =
        email === ""
          ? null
          : String(email).trim();
    }

    if (designation !== undefined) {
      updateData.designation =
        designation === ""
          ? null
          : String(designation).trim();
    }

    if (department !== undefined) {
      updateData.department =
        department === ""
          ? null
          : String(department).trim();
    }

    if (joiningDate !== undefined) {
      updateData.joiningDate =
        parsedJoiningDate;
    }

    if (employeeStatus !== undefined) {
      updateData.status =
        employeeStatus;
    }

    if (userId !== undefined) {
      updateData.userId =
        numericUserId;
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    const updatedEmployee =
      await db.orm.public.Employee
        .where({ id })
        .update(updateData);

    return res.json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ============================================================
// DELETE EMPLOYEE
// DELETE /api/employees/:id
// ============================================================

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const existingEmployee =
      await db.orm.public.Employee
        .where({ id })
        .first();

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // --------------------------------------------------------
    // CHECK DRAWINGS
    // --------------------------------------------------------

    const drawings =
      await db.orm.public.Drawing
        .where({
          uploadedById: id,
        })
        .all();

    if (drawings.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Employee cannot be deleted because drawings are linked to this employee",
      });
    }

    // --------------------------------------------------------
    // CHECK PROJECT MEMBERS
    // --------------------------------------------------------

    const projectMembers =
      await db.orm.public.ProjectMember
        .where({
          employeeId: id,
        })
        .all();

    if (projectMembers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Employee cannot be deleted because project memberships are linked to this employee",
      });
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const deletedEmployee =
      await db.orm.public.Employee
        .where({ id })
        .delete();

    return res.json({
      success: true,
      message: "Employee deleted successfully",
      data: deletedEmployee,
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

export default router;