import { Router } from "express";
import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";
import "temporal-polyfill/full/global";
import type { Temporal as TemporalTypes } from "temporal-polyfill";

const router = Router();

const Temporal = (globalThis as typeof globalThis & {
  Temporal: typeof TemporalTypes;
}).Temporal;

/* HELPER */
function toAttendanceInstant(dateString: string): TemporalTypes.Instant {
  return Temporal.Instant.from(
    `${dateString}T00:00:00Z`
  );
}

/* ============================================================
   GET ALL ATTENDANCE
   GET /api/attendance

   Optional:
   ?date=2026-09-12
   ?employeeId=1
============================================================ */

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { date, employeeId } = req.query;

    const filters: Record<string, unknown> = {};

    /* -------------------------
       EMPLOYEE FILTER
    ------------------------- */

    if (employeeId !== undefined) {
      const id = Number(employeeId);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      filters.employeeId = id;
    }

    /* -------------------------
       DATE FILTER
    ------------------------- */

    if (date !== undefined) {
      const dateString = String(date).trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date. Please use YYYY-MM-DD.",
        });
      }

      filters.date = toAttendanceInstant(dateString);
    }

    const attendance =
      await db.orm.public.Attendance
        .where(filters)
        .orderBy((record) => record.date.desc())
        .all();

    return res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error("GET ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/* ============================================================
   GET ATTENDANCE BY ID
   GET /api/attendance/:id
============================================================ */

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const attendance =
      await db.orm.public.Attendance
        .where({ id })
        .first();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("GET ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/* ============================================================
   CREATE / MARK ATTENDANCE
   POST /api/attendance

   Body:
   {
     "employeeId": 1,
     "date": "2026-09-14",
     "status": "present"
   }
============================================================ */

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
    } = req.body;

    /* -------------------------
       EMPLOYEE ID
    ------------------------- */

    const numericEmployeeId = Number(employeeId);

    if (
      !Number.isInteger(numericEmployeeId) ||
      numericEmployeeId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid employeeId is required",
      });
    }

    /* -------------------------
       CHECK EMPLOYEE
    ------------------------- */

    const employee =
      await db.orm.public.Employee
        .where({
          id: numericEmployeeId,
        })
        .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    /* -------------------------
       DATE
    ------------------------- */

    if (
      date === undefined ||
      date === null ||
      String(date).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    const dateString = String(date).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Please use YYYY-MM-DD.",
      });
    }

    const attendanceDate =
      toAttendanceInstant(dateString);

    /* -------------------------
       STATUS
    ------------------------- */

    const attendanceStatus =
      String(status ?? "").toLowerCase().trim();

    const validStatuses = [
      "present",
      "absent",
      "half_day",
      "leave",
    ];

    if (!validStatuses.includes(attendanceStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid attendance status. Valid values: present, absent, half_day, leave",
      });
    }

    /* -------------------------
       CHECK DUPLICATE
    ------------------------- */

    const existingAttendance =
      await db.orm.public.Attendance
        .where({
          employeeId: numericEmployeeId,
          date: attendanceDate,
        })
        .first();

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already marked for this employee on this date",
        data: existingAttendance,
      });
    }

    /* -------------------------
       CREATE ATTENDANCE
    ------------------------- */

    const attendance =
      await db.orm.public.Attendance.create({
        employeeId: numericEmployeeId,
        date: attendanceDate,
        status: attendanceStatus as any,
      } as any);

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("CREATE ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/* ============================================================
   UPDATE ATTENDANCE
   PUT /api/attendance/:id
============================================================ */

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const existingAttendance =
      await db.orm.public.Attendance
        .where({ id })
        .first();

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const {
      employeeId,
      date,
      status,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    /* -------------------------
       EMPLOYEE
    ------------------------- */

    if (employeeId !== undefined) {
      const numericEmployeeId = Number(employeeId);

      if (
        !Number.isInteger(numericEmployeeId) ||
        numericEmployeeId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid employeeId",
        });
      }

      const employee =
        await db.orm.public.Employee
          .where({
            id: numericEmployeeId,
          })
          .first();

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      updateData.employeeId = numericEmployeeId;
    }

    /* -------------------------
       DATE
    ------------------------- */

    if (date !== undefined) {
      const dateString = String(date).trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date. Please use YYYY-MM-DD.",
        });
      }

      updateData.date =
        toAttendanceInstant(dateString);
    }

    /* -------------------------
       STATUS
    ------------------------- */

    if (status !== undefined) {
      const attendanceStatus =
        String(status).toLowerCase().trim();

      const validStatuses = [
        "present",
        "absent",
        "half_day",
        "leave",
      ];

      if (!validStatuses.includes(attendanceStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance status",
        });
      }

      updateData.status = attendanceStatus;
    }

    /* -------------------------
       DUPLICATE CHECK
    ------------------------- */

    if (
      updateData.employeeId !== undefined ||
      updateData.date !== undefined
    ) {
      const finalEmployeeId: number =
        updateData.employeeId !== undefined
          ? Number(updateData.employeeId)
          : existingAttendance.employeeId;

      const finalDate =
        updateData.date !== undefined
          ? updateData.date
          : existingAttendance.date;

      const duplicate =
        await db.orm.public.Attendance
          .where({
            employeeId: finalEmployeeId,
            date: finalDate,
          })
          .first();

      if (
        duplicate &&
        duplicate.id !== id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Attendance already exists for this employee on this date",
        });
      }
    }

    /* -------------------------
       UPDATE
    ------------------------- */

    const updatedAttendance =
      await db.orm.public.Attendance
        .where({ id })
        .update(updateData);

    return res.json({
      success: true,
      message: "Attendance updated successfully",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update attendance",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/* ============================================================
   DELETE ATTENDANCE
   DELETE /api/attendance/:id
============================================================ */

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const existingAttendance =
      await db.orm.public.Attendance
        .where({ id })
        .first();

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const deletedAttendance =
      await db.orm.public.Attendance
        .where({ id })
        .delete();

    return res.json({
      success: true,
      message: "Attendance deleted successfully",
      data: deletedAttendance,
    });
  } catch (error) {
    console.error("DELETE ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete attendance",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

/* ============================================================
   MONTHLY ATTENDANCE REPORT
   GET /api/attendance/monthly/report?month=2026-09
============================================================ */

router.get(
  "/monthly/report",
  authenticateToken,
  async (req, res) => {
    try {
      const month =
        String(req.query.month ?? "").trim();

      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid month. Please use YYYY-MM.",
        });
      }

      const [year, monthNumber] =
        month.split("-").map(Number);

      /* -------------------------
         START DATE
      ------------------------- */

      const startDate =
        Temporal.Instant.from(
          `${month}-01T00:00:00Z`
        );

      /* -------------------------
         NEXT MONTH
      ------------------------- */

      const nextMonthDate =
        new Date(
          Date.UTC(
            year,
            monthNumber,
            1
          )
        );

      const nextMonth =
        Temporal.Instant.from(
          nextMonthDate.toISOString()
        );

      /* -------------------------
         EMPLOYEES
      ------------------------- */

      const employees =
        await db.orm.public.Employee
          .orderBy(
            (employee) =>
              employee.firstName.asc()
          )
          .all();

      /* -------------------------
         ATTENDANCE
      ------------------------- */

      const attendance =
        await db.orm.public.Attendance
          .where({
            date: {
              gte: startDate,
              lt: nextMonth,
            },
          } as any)
          .all();

      /* -------------------------
         REPORT
      ------------------------- */

      const report =
        employees.map((employee) => {
          const records =
            attendance.filter(
              (record) =>
                record.employeeId ===
                employee.id
            );

          const present =
            records.filter(
              (record) =>
                record.status === "present"
            ).length;

          const absent =
            records.filter(
              (record) =>
                record.status === "absent"
            ).length;

          const halfDay =
            records.filter(
              (record) =>
                record.status === "half_day"
            ).length;

          const leave =
            records.filter(
              (record) =>
                record.status === "leave"
            ).length;

          const totalMarkedDays =
            records.length;

          const attendancePercentage =
            totalMarkedDays > 0
              ? Number(
                  (
                    (present /
                      totalMarkedDays) *
                    100
                  ).toFixed(2)
                )
              : 0;

          return {
            employeeId: employee.id,
            employeeCode:
              employee.employeeCode,

            employeeName:
              `${employee.firstName}${
                employee.lastName
                  ? ` ${employee.lastName}`
                  : ""
              }`,

            present,
            absent,
            halfDay,
            leave,

            totalMarkedDays,
            attendancePercentage,
          };
        });

      return res.json({
        success: true,
        month,
        data: report,
      });
    } catch (error) {
      console.error(
        "MONTHLY ATTENDANCE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate monthly attendance report",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);

export default router;