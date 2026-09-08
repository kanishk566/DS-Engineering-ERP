import "temporal-polyfill/full/global";
import { Temporal } from "temporal-polyfill/full";

import { Router } from "express";

import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

/* ============================================================
   DATE HELPER
============================================================ */

const toInstant = (value: unknown): Temporal.Instant => {
  if (value instanceof Temporal.Instant) {
    return value;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Date must be a valid ISO date string");
  }

  const dateValue = value.trim();

  // Handle date-only format: YYYY-MM-DD
  // Convert it to UTC without relying on Temporal's string parser.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const milliseconds = Date.parse(`${dateValue}T00:00:00.000Z`);

    if (Number.isNaN(milliseconds)) {
      throw new Error(`Invalid date: ${dateValue}`);
    }

    return Temporal.Instant.fromEpochMilliseconds(milliseconds);
  }

  // Handle full ISO date-time format.
  return Temporal.Instant.from(dateValue);
};

const validFileTypes = [
  "pdf",
  "image",
  "dwg",
  "dxf",
  "other",
];

const validStatuses = [
  "draft",
  "under_review",
  "approved",
  "rejected",
  "superseded",
];

const validApprovalActions = [
  "submit_review",
  "approve",
  "reject",
];

/* ============================================================
   GET ALL DRAWINGS
   GET /api/drawings
============================================================ */

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const drawings =
        await db.orm.public.Drawing
          .orderBy(
            (drawing) =>
              drawing.createdAt.desc(),
          )
          .all();

      return res.json({
        success: true,
        count: drawings.length,
        data: drawings,
      });
    } catch (error) {
      console.error(
        "GET DRAWINGS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch drawings",
      });
    }
  },
);

/* ============================================================
   GET DRAWINGS BY MACHINE
   GET /api/drawings/machine/:machineId
============================================================ */

router.get(
  "/machine/:machineId",
  authenticateToken,
  async (req, res) => {
    try {
      const machineId = Number(
        req.params.machineId,
      );

      if (
        !Number.isInteger(machineId) ||
        machineId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine ID",
        });
      }

      const drawings =
        await db.orm.public.Drawing
          .where({
            machineId,
          })
          .all();

      return res.json({
        success: true,
        count: drawings.length,
        data: drawings,
      });
    } catch (error) {
      console.error(
        "GET MACHINE DRAWINGS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch machine drawings",
      });
    }
  },
);

/* ============================================================
   GET DRAWINGS BY PROJECT
   GET /api/drawings/project/:projectId
============================================================ */

router.get(
  "/project/:projectId",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = Number(
        req.params.projectId,
      );

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      const drawings =
        await db.orm.public.Drawing
          .where({
            projectId,
          })
          .all();

      return res.json({
        success: true,
        count: drawings.length,
        data: drawings,
      });
    } catch (error) {
      console.error(
        "GET PROJECT DRAWINGS ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch project drawings",
      });
    }
  },
);

/* ============================================================
   GET SINGLE DRAWING
   GET /api/drawings/:id
============================================================ */

router.get(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const drawing =
        await db.orm.public.Drawing
          .where({
            id,
          })
          .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      return res.json({
        success: true,
        data: drawing,
      });
    } catch (error) {
      console.error(
        "GET DRAWING ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch drawing",
      });
    }
  },
);

/* ============================================================
   CREATE DRAWING
   POST /api/drawings
============================================================ */

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        drawingNumber,
        title,
        projectId,
        machineId,
        uploadedById,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        drawingDate,
        description,
        remarks,
        isConfidential,
        status,
        revision,
      } = req.body;

      /* --------------------------------------------------------
         REQUIRED FIELDS
      -------------------------------------------------------- */

      if (
        !drawingNumber ||
        !title ||
        projectId === undefined ||
        projectId === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "drawingNumber, title and projectId are required",
        });
      }

      const numericProjectId =
        Number(projectId);

      if (
        !Number.isInteger(
          numericProjectId,
        ) ||
        numericProjectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid projectId",
        });
      }

      /* --------------------------------------------------------
         CHECK PROJECT
      -------------------------------------------------------- */

      const project =
        await db.orm.public.Project
          .where({
            id: numericProjectId,
          })
          .first();

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      /* --------------------------------------------------------
         MACHINE ID
      -------------------------------------------------------- */

      let numericMachineId:
        | number
        | undefined;

      if (
        machineId !== undefined &&
        machineId !== null &&
        machineId !== ""
      ) {
        numericMachineId =
          Number(machineId);

        if (
          !Number.isInteger(
            numericMachineId,
          ) ||
          numericMachineId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid machineId",
          });
        }

        const machine =
          await db.orm.public.Machine
            .where({
              id: numericMachineId,
            })
            .first();

        if (!machine) {
          return res.status(404).json({
            success: false,
            message: "Machine not found",
          });
        }
      }

      /* --------------------------------------------------------
         FILE TYPE VALIDATION
      -------------------------------------------------------- */

      const finalFileType =
        fileType
          ? String(fileType).toLowerCase()
          : "other";

      if (
        !validFileTypes.includes(
          finalFileType,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid fileType. Allowed: pdf, image, dwg, dxf, other",
        });
      }

      /* --------------------------------------------------------
         STATUS VALIDATION
      -------------------------------------------------------- */

      const finalStatus =
        status
          ? String(status).toLowerCase()
          : "draft";

      if (
        !validStatuses.includes(
          finalStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid drawing status",
        });
      }

      /* --------------------------------------------------------
         DRAWING DATA
      -------------------------------------------------------- */

      const drawingData = {
        drawingNumber:
          String(drawingNumber),

        title:
          String(title),

        revision:
          revision
            ? String(revision)
            : "A",

        projectId:
          numericProjectId,

        machineId:
          numericMachineId ?? null,

        uploadedById:
          uploadedById !== undefined &&
          uploadedById !== null &&
          uploadedById !== ""
            ? Number(uploadedById)
            : null,

        fileName:
          fileName
            ? String(fileName)
            : null,

        fileUrl:
          fileUrl
            ? String(fileUrl)
            : null,

        fileType:
          finalFileType as
            | "pdf"
            | "image"
            | "dwg"
            | "dxf"
            | "other",

        fileSize:
          fileSize !== undefined &&
          fileSize !== null &&
          fileSize !== ""
            ? Number(fileSize)
            : null,

        drawingDate:
          drawingDate
            ? toInstant(drawingDate)
            : null,

        description:
          description
            ? String(description)
            : null,

        remarks:
          remarks
            ? String(remarks)
            : null,

        isConfidential:
          Boolean(isConfidential),

        status:
          finalStatus as
            | "draft"
            | "under_review"
            | "approved"
            | "rejected"
            | "superseded",
      };

      /* --------------------------------------------------------
         CREATE
      -------------------------------------------------------- */

      const drawing =
  await db.orm.public.Drawing.create(
    drawingData as any,
  );

      return res.status(201).json({
        success: true,
        message:
          "Drawing created successfully",
        data: drawing,
      });
    } catch (error) {
      console.error(
        "CREATE DRAWING ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create drawing",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

/* ============================================================
   UPDATE DRAWING
   PUT /api/drawings/:id
============================================================ */

router.put(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const existingDrawing =
        await db.orm.public.Drawing
          .where({
            id,
          })
          .first();

      if (!existingDrawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      const {
        drawingNumber,
        title,
        projectId,
        machineId,
        uploadedById,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        drawingDate,
        description,
        remarks,
        isConfidential,
        status,
        revision,
      } = req.body;

      const updateData: Record<
        string,
        unknown
      > = {};

      /* --------------------------------------------------------
         BASIC FIELDS
      -------------------------------------------------------- */

      if (
        drawingNumber !== undefined
      ) {
        updateData.drawingNumber =
          String(drawingNumber);
      }

      if (title !== undefined) {
        updateData.title =
          String(title);
      }

      if (revision !== undefined) {
        updateData.revision =
          revision === ""
            ? "A"
            : String(revision);
      }

      /* --------------------------------------------------------
         PROJECT
      -------------------------------------------------------- */

      if (
        projectId !== undefined
      ) {
        const numericProjectId =
          Number(projectId);

        if (
          !Number.isInteger(
            numericProjectId,
          ) ||
          numericProjectId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid projectId",
          });
        }

        const project =
          await db.orm.public.Project
            .where({
              id: numericProjectId,
            })
            .first();

        if (!project) {
          return res.status(404).json({
            success: false,
            message:
              "Project not found",
          });
        }

        updateData.projectId =
          numericProjectId;
      }

      /* --------------------------------------------------------
         MACHINE
      -------------------------------------------------------- */

      if (
        machineId !== undefined
      ) {
        if (
          machineId === null ||
          machineId === ""
        ) {
          updateData.machineId =
            null;
        } else {
          const numericMachineId =
            Number(machineId);

          if (
            !Number.isInteger(
              numericMachineId,
            ) ||
            numericMachineId <= 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid machineId",
            });
          }

          const machine =
            await db.orm.public.Machine
              .where({
                id: numericMachineId,
              })
              .first();

          if (!machine) {
            return res.status(404).json({
              success: false,
              message:
                "Machine not found",
            });
          }

          updateData.machineId =
            numericMachineId;
        }
      }

      /* --------------------------------------------------------
         UPLOADED BY
      -------------------------------------------------------- */

      if (
        uploadedById !== undefined
      ) {
        updateData.uploadedById =
          uploadedById === null ||
          uploadedById === ""
            ? null
            : Number(uploadedById);
      }

      /* --------------------------------------------------------
         FILE INFORMATION
      -------------------------------------------------------- */

      if (
        fileName !== undefined
      ) {
        updateData.fileName =
          fileName === ""
            ? null
            : String(fileName);
      }

      if (
        fileUrl !== undefined
      ) {
        updateData.fileUrl =
          fileUrl === ""
            ? null
            : String(fileUrl);
      }

      if (
        fileType !== undefined
      ) {
        const finalFileType =
          String(fileType)
            .toLowerCase();

        if (
          !validFileTypes.includes(
            finalFileType,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid fileType",
          });
        }

        updateData.fileType =
          finalFileType;
      }

      if (
        fileSize !== undefined
      ) {
        updateData.fileSize =
          fileSize === null ||
          fileSize === ""
            ? null
            : Number(fileSize);
      }

      /* --------------------------------------------------------
         DRAWING DATE
      -------------------------------------------------------- */

      if (
        drawingDate !== undefined
      ) {
        updateData.drawingDate =
          drawingDate === null ||
          drawingDate === ""
            ? null
            : toInstant(
                drawingDate,
              );
      }

      /* --------------------------------------------------------
         DESCRIPTION / REMARKS
      -------------------------------------------------------- */

      if (
        description !== undefined
      ) {
        updateData.description =
          description === ""
            ? null
            : String(description);
      }

      if (
        remarks !== undefined
      ) {
        updateData.remarks =
          remarks === ""
            ? null
            : String(remarks);
      }

      /* --------------------------------------------------------
         SECURITY
      -------------------------------------------------------- */

      if (
        isConfidential !== undefined
      ) {
        updateData.isConfidential =
          Boolean(isConfidential);
      }

      /* --------------------------------------------------------
         STATUS
      -------------------------------------------------------- */

      if (
        status !== undefined
      ) {
        const finalStatus =
          String(status)
            .toLowerCase();

        if (
          !validStatuses.includes(
            finalStatus,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid drawing status",
          });
        }

        updateData.status =
          finalStatus;
      }

      /* --------------------------------------------------------
         UPDATE
      -------------------------------------------------------- */

      const updatedDrawing =
        await db.orm.public.Drawing
          .where({
            id,
          })
          .update(
            updateData as any,
          );

      return res.json({
        success: true,
        message:
          "Drawing updated successfully",
        data: updatedDrawing,
      });
    } catch (error) {
      console.error(
        "UPDATE DRAWING ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update drawing",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

/* ============================================================
   DRAWING APPROVAL WORKFLOW APIs
   ============================================================ */

/*
   Workflow:
   DRAFT -> UNDER REVIEW -> APPROVED
                        \-> REJECTED

   Endpoint:
   PATCH /api/drawings/:id/approval

   Body:
   {
     "action": "submit_review" | "approve" | "reject",
     "employeeId": 1,
     "remarks": "optional remarks"
   }
*/

router.patch(
  "/:id/approval",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const {
        action,
        employeeId,
        remarks,
      } = req.body;

      const finalAction = String(
        action ?? "",
      )
        .trim()
        .toLowerCase();

      if (!validApprovalActions.includes(finalAction)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid approval action. Allowed: submit_review, approve, reject",
        });
      }

      const numericEmployeeId = Number(employeeId);

      if (
        !Number.isInteger(numericEmployeeId) ||
        numericEmployeeId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid employeeId is required",
        });
      }

      const drawing =
        await db.orm.public.Drawing
          .where({ id })
          .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      const employee =
        await db.orm.public.Employee
          .where({ id: numericEmployeeId })
          .first();

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const currentStatus = String(
        drawing.status,
      ).toLowerCase();

      const approvalRemarks =
        remarks === undefined ||
        remarks === null ||
        String(remarks).trim() === ""
          ? null
          : String(remarks).trim();

      const now = Temporal.Now.instant();

      let updateData: Record<string, unknown>;

      if (finalAction === "submit_review") {
        if (
          currentStatus !== "draft" &&
          currentStatus !== "rejected"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Only DRAFT or REJECTED drawings can be submitted for review",
          });
        }

        updateData = {
          status: "under_review",
          reviewedById: numericEmployeeId,
          reviewedAt: now,
          approvalRemarks,
          approvedById: null,
          approvedAt: null,
        };
      } else if (finalAction === "approve") {
        if (currentStatus !== "under_review") {
          return res.status(400).json({
            success: false,
            message:
              "Only UNDER REVIEW drawings can be approved",
          });
        }

        updateData = {
          status: "approved",
          approvedById: numericEmployeeId,
          approvedAt: now,
          approvalRemarks,
        };
      } else {
        if (currentStatus !== "under_review") {
          return res.status(400).json({
            success: false,
            message:
              "Only UNDER REVIEW drawings can be rejected",
          });
        }

        updateData = {
          status: "rejected",
          reviewedById: numericEmployeeId,
          reviewedAt: now,
          approvalRemarks,
          approvedById: null,
          approvedAt: null,
        };
      }

      const updatedDrawing =
        await db.orm.public.Drawing
          .where({ id })
          .update(updateData as any);

      return res.json({
        success: true,
        message:
          finalAction === "submit_review"
            ? "Drawing submitted for review successfully"
            : finalAction === "approve"
              ? "Drawing approved successfully"
              : "Drawing rejected successfully",
        data: updatedDrawing,
      });
    } catch (error) {
      console.error(
        "DRAWING APPROVAL WORKFLOW ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update drawing approval workflow",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

/*
   GET /api/drawings/:id/approval

   Returns the current approval/review metadata.
*/
router.get(
  "/:id/approval",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const drawing =
        await db.orm.public.Drawing
          .where({ id })
          .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      return res.json({
        success: true,
        data: {
          drawingId: drawing.id,
          drawingNumber: drawing.drawingNumber,
          status: drawing.status,
          reviewedById: drawing.reviewedById,
          reviewedAt: drawing.reviewedAt,
          approvedById: drawing.approvedById,
          approvedAt: drawing.approvedAt,
          approvalRemarks: drawing.approvalRemarks,
        },
      });
    } catch (error) {
      console.error(
        "GET DRAWING APPROVAL ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch drawing approval details",
      });
    }
  },
);

/* ============================================================
   DRAWING REVISION APIs
   ============================================================ */

/* ============================================================
   GET REVISIONS
   GET /api/drawings/:drawingId/revisions
   ============================================================ */

router.get(
  "/:drawingId/revisions",
  authenticateToken,
  async (req, res) => {
    try {
      const drawingId = Number(req.params.drawingId);

      if (!Number.isInteger(drawingId) || drawingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const drawing = await db.orm.public.Drawing
        .where({ id: drawingId })
        .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      const revisions = await db.orm.public.DrawingRevision
        .where({ drawingId })
        .all();

      return res.json({
        success: true,
        count: revisions.length,
        data: revisions,
      });
    } catch (error) {
      console.error("GET DRAWING REVISIONS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch drawing revisions",
      });
    }
  },
);

/* ============================================================
   GET SINGLE REVISION
   GET /api/drawings/:drawingId/revisions/:revisionId
   ============================================================ */

router.get(
  "/:drawingId/revisions/:revisionId",
  authenticateToken,
  async (req, res) => {
    try {
      const drawingId = Number(req.params.drawingId);
      const revisionId = Number(req.params.revisionId);

      if (
        !Number.isInteger(drawingId) ||
        drawingId <= 0 ||
        !Number.isInteger(revisionId) ||
        revisionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing or revision ID",
        });
      }

      const revision = await db.orm.public.DrawingRevision
        .where({
          id: revisionId,
          drawingId,
        })
        .first();

      if (!revision) {
        return res.status(404).json({
          success: false,
          message: "Drawing revision not found",
        });
      }

      return res.json({
        success: true,
        data: revision,
      });
    } catch (error) {
      console.error("GET DRAWING REVISION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch drawing revision",
      });
    }
  },
);

/* ============================================================
   CREATE REVISION
   POST /api/drawings/:drawingId/revisions
   ============================================================ */

router.post(
  "/:drawingId/revisions",
  authenticateToken,
  async (req, res) => {
    try {
      const drawingId = Number(req.params.drawingId);

      if (!Number.isInteger(drawingId) || drawingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const {
        revision,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        changeDescription,
        uploadedById,
      } = req.body;

      if (!revision || String(revision).trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Revision is required",
        });
      }

      const drawing = await db.orm.public.Drawing
        .where({ id: drawingId })
        .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      const finalFileType = fileType
        ? String(fileType).toLowerCase()
        : null;

      if (
        finalFileType &&
        !validFileTypes.includes(finalFileType)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid fileType. Allowed: pdf, image, dwg, dxf, other",
        });
      }

      const revisionData = {
        drawingId,
        revision: String(revision).trim(),
        fileName: fileName ? String(fileName) : null,
        fileUrl: fileUrl ? String(fileUrl) : null,
        fileType: finalFileType as
          | "pdf"
          | "image"
          | "dwg"
          | "dxf"
          | "other"
          | null,
        fileSize:
          fileSize !== undefined &&
          fileSize !== null &&
          fileSize !== ""
            ? Number(fileSize)
            : null,
        changeDescription: changeDescription
          ? String(changeDescription)
          : null,
        uploadedById:
          uploadedById !== undefined &&
          uploadedById !== null &&
          uploadedById !== ""
            ? Number(uploadedById)
            : null,
      };

      const createdRevision =
        await db.orm.public.DrawingRevision.create(
          revisionData as any,
        );

      // The latest uploaded revision becomes the current drawing revision.
      await db.orm.public.Drawing
        .where({ id: drawingId })
        .update({
          revision: String(revision).trim(),
        });

      return res.status(201).json({
        success: true,
        message: "Drawing revision created successfully",
        data: createdRevision,
      });
    } catch (error) {
      console.error(
        "CREATE DRAWING REVISION ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to create drawing revision",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

/* ============================================================
   DELETE REVISION
   DELETE /api/drawings/:drawingId/revisions/:revisionId
   ============================================================ */

router.delete(
  "/:drawingId/revisions/:revisionId",
  authenticateToken,
  async (req, res) => {
    try {
      const drawingId = Number(req.params.drawingId);
      const revisionId = Number(req.params.revisionId);

      if (
        !Number.isInteger(drawingId) ||
        drawingId <= 0 ||
        !Number.isInteger(revisionId) ||
        revisionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing or revision ID",
        });
      }

      const revision = await db.orm.public.DrawingRevision
        .where({
          id: revisionId,
          drawingId,
        })
        .first();

      if (!revision) {
        return res.status(404).json({
          success: false,
          message: "Drawing revision not found",
        });
      }

      await db.orm.public.DrawingRevision
        .where({ id: revisionId })
        .delete();

      return res.json({
        success: true,
        message: "Drawing revision deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE DRAWING REVISION ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete drawing revision",
      });
    }
  },
);

/* ============================================================
   DELETE DRAWING
   DELETE /api/drawings/:id
============================================================ */

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid drawing ID",
        });
      }

      const drawing =
        await db.orm.public.Drawing
          .where({
            id,
          })
          .first();

      if (!drawing) {
        return res.status(404).json({
          success: false,
          message: "Drawing not found",
        });
      }

      /* --------------------------------------------------------
         DELETE REVISION HISTORY FIRST
      -------------------------------------------------------- */

      const revisions =
        await db.orm.public.DrawingRevision
          .where({
            drawingId: id,
          })
          .all();

      for (const revision of revisions) {
        await db.orm.public.DrawingRevision
          .where({
            id: revision.id,
          })
          .delete();
      }

      /* --------------------------------------------------------
         DELETE DRAWING
      -------------------------------------------------------- */

      await db.orm.public.Drawing
        .where({
          id,
        })
        .delete();

      return res.json({
        success: true,
        message:
          "Drawing deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE DRAWING ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete drawing",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  },
);

/* ============================================================
   EXPORT
============================================================ */

export default router;