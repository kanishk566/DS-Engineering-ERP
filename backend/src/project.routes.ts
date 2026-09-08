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

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error("Date must be a valid ISO date string");
  }

  const dateValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return Temporal.Instant.from(
      `${dateValue}T00:00:00Z`,
    );
  }

  return Temporal.Instant.from(dateValue);
};


// ============================================================
// PROJECT STATUS
// ============================================================

const validStatuses = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];


// ============================================================
// GET ALL PROJECTS
// GET /api/projects
// ============================================================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const projects =
        await db.orm.public.Project
          .orderBy(
            (project) =>
              project.createdAt.desc(),
          )
          .all();

      return res.json({
        success: true,
        count: projects.length,
        data: projects,
      });
    } catch (error) {
      console.error(
        "GET PROJECTS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);


// ============================================================
// GET PROJECT BY ID
// GET /api/projects/:id
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
          message: "Invalid project ID",
        });
      }

      const project =
        await db.orm.public.Project
          .where({ id })
          .first();

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      return res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error(
        "GET PROJECT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch project",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);


// ============================================================
// CREATE PROJECT
// POST /api/projects
// ============================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        projectCode,
        name,
        description,
        customerId,
        startDate,
        expectedEndDate,
        actualEndDate,
        status,
      } = req.body;


      // REQUIRED FIELDS

      if (
        !projectCode ||
        !name
      ) {
        return res.status(400).json({
          success: false,
          message:
            "projectCode and name are required",
        });
      }


      // DUPLICATE PROJECT CODE

      const existingProject =
        await db.orm.public.Project
          .where({
            projectCode,
          })
          .first();

      if (existingProject) {
        return res.status(409).json({
          success: false,
          message:
            "Project code already exists",
        });
      }


      // CUSTOMER ID

      let numericCustomerId:
        | number
        | undefined;

      if (
        customerId !== undefined &&
        customerId !== null &&
        customerId !== ""
      ) {
        numericCustomerId =
          Number(customerId);

        if (
          !Number.isInteger(
            numericCustomerId,
          ) ||
          numericCustomerId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid customerId",
          });
        }

        const customer =
          await db.orm.public.Customer
            .where({
              id: numericCustomerId,
            })
            .first();

        if (!customer) {
          return res.status(404).json({
            success: false,
            message:
              "Customer not found",
          });
        }
      }


      // STATUS

      const projectStatus =
        status === undefined ||
        status === null ||
        status === ""
          ? "planning"
          : String(status).toLowerCase();

      if (
        !validStatuses.includes(
          projectStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project status. Valid values: planning, in_progress, on_hold, completed, cancelled",
        });
      }


      // DATES

      let parsedStartDate:
        | Temporal.Instant
        | undefined;

      let parsedExpectedEndDate:
        | Temporal.Instant
        | undefined;

      let parsedActualEndDate:
        | Temporal.Instant
        | undefined;

      try {
        if (
          startDate !== undefined &&
          startDate !== null &&
          startDate !== ""
        ) {
          parsedStartDate =
            toInstant(startDate);
        }

        if (
          expectedEndDate !== undefined &&
          expectedEndDate !== null &&
          expectedEndDate !== ""
        ) {
          parsedExpectedEndDate =
            toInstant(expectedEndDate);
        }

        if (
          actualEndDate !== undefined &&
          actualEndDate !== null &&
          actualEndDate !== ""
        ) {
          parsedActualEndDate =
            toInstant(actualEndDate);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Please use YYYY-MM-DD.",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }


      // DATE ORDER VALIDATION

      if (
        parsedStartDate &&
        parsedExpectedEndDate
      ) {
        if (
          parsedExpectedEndDate.epochMilliseconds <
          parsedStartDate.epochMilliseconds
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Expected end date cannot be before start date",
          });
        }
      }


      // CREATE

      const project =
        await db.orm.public.Project.create({
          projectCode:
            String(projectCode).trim(),

          name:
            String(name).trim(),

          description:
            description !== undefined
              ? description
              : null,

          customerId:
            numericCustomerId !== undefined
              ? numericCustomerId
              : null,

          startDate:
            parsedStartDate,

          expectedEndDate:
            parsedExpectedEndDate,

          actualEndDate:
            parsedActualEndDate,

          status:
            projectStatus as any,
        });


      return res.status(201).json({
        success: true,
        message:
          "Project created successfully",
        data: project,
      });

    } catch (error) {
      console.error(
        "CREATE PROJECT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create project",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);


// ============================================================
// UPDATE PROJECT
// PUT /api/projects/:id
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
          message:
            "Invalid project ID",
        });
      }


      // CHECK PROJECT

      const existingProject =
        await db.orm.public.Project
          .where({ id })
          .first();

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      const {
        projectCode,
        name,
        description,
        customerId,
        startDate,
        expectedEndDate,
        actualEndDate,
        status,
      } = req.body;


      // DUPLICATE CODE

      if (
        projectCode !== undefined &&
        projectCode !==
          existingProject.projectCode
      ) {
        const duplicateProject =
          await db.orm.public.Project
            .where({
              projectCode,
            })
            .first();

        if (
          duplicateProject &&
          duplicateProject.id !== id
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Project code already exists",
          });
        }
      }


      // CUSTOMER

      let numericCustomerId:
        | number
        | null
        | undefined;

      if (
        customerId !== undefined
      ) {
        if (
          customerId === null ||
          customerId === ""
        ) {
          numericCustomerId = null;
        } else {
          numericCustomerId =
            Number(customerId);

          if (
            !Number.isInteger(
              numericCustomerId,
            ) ||
            numericCustomerId <= 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid customerId",
            });
          }

          const customer =
            await db.orm.public.Customer
              .where({
                id: numericCustomerId,
              })
              .first();

          if (!customer) {
            return res.status(404).json({
              success: false,
              message:
                "Customer not found",
            });
          }
        }
      }


      // STATUS

      let projectStatus:
        | string
        | undefined;

      if (
        status !== undefined
      ) {
        projectStatus =
          String(status).toLowerCase();

        if (
          !validStatuses.includes(
            projectStatus,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid project status. Valid values: planning, in_progress, on_hold, completed, cancelled",
          });
        }
      }


      // UPDATE DATA

      const updateData:
        Record<string, unknown> = {};


      if (
        projectCode !== undefined
      ) {
        updateData.projectCode =
          String(projectCode).trim();
      }


      if (name !== undefined) {
        updateData.name =
          String(name).trim();
      }


      if (
        description !== undefined
      ) {
        updateData.description =
          description === ""
            ? null
            : description;
      }


      if (
        customerId !== undefined
      ) {
        updateData.customerId =
          numericCustomerId;
      }


      // START DATE

      if (
        startDate !== undefined
      ) {
        try {
          updateData.startDate =
            startDate === null ||
            startDate === ""
              ? null
              : toInstant(startDate);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid startDate. Please use YYYY-MM-DD.",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }
      }


      // EXPECTED END DATE

      if (
        expectedEndDate !== undefined
      ) {
        try {
          updateData.expectedEndDate =
            expectedEndDate === null ||
            expectedEndDate === ""
              ? null
              : toInstant(
                  expectedEndDate,
                );
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid expectedEndDate. Please use YYYY-MM-DD.",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }
      }


      // ACTUAL END DATE

      if (
        actualEndDate !== undefined
      ) {
        try {
          updateData.actualEndDate =
            actualEndDate === null ||
            actualEndDate === ""
              ? null
              : toInstant(
                  actualEndDate,
                );
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid actualEndDate. Please use YYYY-MM-DD.",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }
      }


      if (
        projectStatus !== undefined
      ) {
        updateData.status =
          projectStatus;
      }


      // DATE ORDER VALIDATION

      const finalStartDate =
        updateData.startDate !== undefined
          ? updateData.startDate
          : existingProject.startDate;

      const finalExpectedEndDate =
        updateData.expectedEndDate !== undefined
          ? updateData.expectedEndDate
          : existingProject.expectedEndDate;

      if (
        finalStartDate &&
        finalExpectedEndDate
      ) {
        const start =
          finalStartDate instanceof Temporal.Instant
            ? finalStartDate.epochMilliseconds
            : new Date(
                String(finalStartDate),
              ).getTime();

        const end =
          finalExpectedEndDate instanceof Temporal.Instant
            ? finalExpectedEndDate.epochMilliseconds
            : new Date(
                String(finalExpectedEndDate),
              ).getTime();

        if (end < start) {
          return res.status(400).json({
            success: false,
            message:
              "Expected end date cannot be before start date",
          });
        }
      }


      // UPDATE

      const updatedProject =
        await db.orm.public.Project
          .where({ id })
          .update(
            updateData as any,
          );


      return res.json({
        success: true,
        message:
          "Project updated successfully",
        data: updatedProject,
      });

    } catch (error) {
      console.error(
        "UPDATE PROJECT ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update project",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);


// ============================================================
// DELETE PROJECT
// DELETE /api/projects/:id
// ============================================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {

      const id = Number(req.params.id);


      // VALIDATE ID

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID",
        });
      }


      // FIND PROJECT

      const existingProject =
        await db.orm.public.Project
          .where({ id })
          .first();


      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      console.log(
        `DELETE PROJECT REQUEST: ID=${id}, CODE=${existingProject.projectCode}`,
      );


      // DELETE PROJECT

      const deletedProject =
        await db.orm.public.Project
          .where({ id })
          .delete();


      console.log(
        "PROJECT DELETED SUCCESSFULLY:",
        deletedProject,
      );


      return res.json({
        success: true,
        message:
          "Project deleted successfully",
        data: deletedProject,
      });

    } catch (error) {

      console.error(
        "========================================",
      );

      console.error(
        "DELETE PROJECT ERROR:",
      );

      console.error(
        error,
      );

      console.error(
        "========================================",
      );


      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);


      // DATABASE FOREIGN KEY ERROR

      if (
        errorMessage.toLowerCase().includes(
          "foreign key",
        ) ||
        errorMessage.toLowerCase().includes(
          "constraint",
        ) ||
        errorMessage.toLowerCase().includes(
          "violates",
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Project cannot be deleted because it is linked with other records.",
          error: errorMessage,
        });
      }


      return res.status(500).json({
        success: false,
        message:
          "Failed to delete project",
        error:
          errorMessage,
      });
    }
  },
);


// ============================================================
// EXPORT
// ============================================================

export default router;