import {
  Router,
  type Request,
  type Response,
} from "express";

import { db } from "./prisma/db.js";
import { authenticateToken } from "./auth.middleware.js";

const router = Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticateToken);

// ============================================================
// GET ALL MACHINES
// GET /api/machines
// ============================================================

router.get(
  "/",
  async (_req: Request, res: Response) => {
    try {
      const machines =
        await db.orm.public.Machine.all();

      return res.json({
        success: true,
        data: machines,
      });
    } catch (error) {
      console.error("GET MACHINES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch machines",
      });
    }
  },
);

// ============================================================
// GET MACHINE BY ID
// GET /api/machines/:id
// ============================================================

router.get(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine ID",
        });
      }

      const machine =
        await db.orm.public.Machine
          .where({ id })
          .first();

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Machine not found",
        });
      }

      return res.json({
        success: true,
        data: machine,
      });
    } catch (error) {
      console.error("GET MACHINE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch machine",
      });
    }
  },
);

// ============================================================
// CREATE MACHINE
// POST /api/machines
// ============================================================

router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const {
        machineCode,
        machineName,
        modelNumber,
        serialNumber,
        description,
        projectId,
        isActive,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        !machineCode ||
        !String(machineCode).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Machine code is required",
        });
      }

      if (
        !machineName ||
        !String(machineName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Machine name is required",
        });
      }

      const cleanMachineCode =
        String(machineCode).trim();

      const cleanMachineName =
        String(machineName).trim();

      // --------------------------------------------------------
      // CHECK DUPLICATE MACHINE CODE
      // --------------------------------------------------------

      const existingMachine =
        await db.orm.public.Machine
          .where({
            machineCode: cleanMachineCode,
          })
          .first();

      if (existingMachine) {
        return res.status(409).json({
          success: false,
          message: "Machine code already exists",
        });
      }

      // --------------------------------------------------------
      // PROJECT VALIDATION
      // --------------------------------------------------------

      let parsedProjectId:
        | number
        | null = null;

      if (
        projectId !== undefined &&
        projectId !== null &&
        projectId !== ""
      ) {
        parsedProjectId = Number(projectId);

        if (
          !Number.isInteger(parsedProjectId) ||
          parsedProjectId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid project ID",
          });
        }

        const project =
          await db.orm.public.Project
            .where({
              id: parsedProjectId,
            })
            .first();

        if (!project) {
          return res.status(404).json({
            success: false,
            message: "Project not found",
          });
        }
      }

      // --------------------------------------------------------
      // CREATE MACHINE
      // --------------------------------------------------------

      const machine =
        await db.orm.public.Machine.create({
          machineCode: cleanMachineCode,

          machineName: cleanMachineName,

          modelNumber:
            modelNumber !== undefined &&
            modelNumber !== null &&
            String(modelNumber).trim() !== ""
              ? String(modelNumber).trim()
              : null,

          serialNumber:
            serialNumber !== undefined &&
            serialNumber !== null &&
            String(serialNumber).trim() !== ""
              ? String(serialNumber).trim()
              : null,

          description:
            description !== undefined &&
            description !== null &&
            String(description).trim() !== ""
              ? String(description).trim()
              : null,

          projectId: parsedProjectId,

          isActive:
            isActive === undefined
              ? true
              : Boolean(isActive),
        });

      return res.status(201).json({
        success: true,
        message: "Machine created successfully",
        data: machine,
      });
    } catch (error) {
      console.error("CREATE MACHINE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create machine",
      });
    }
  },
);

// ============================================================
// UPDATE MACHINE
// PUT /api/machines/:id
// ============================================================

router.put(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine ID",
        });
      }

      // --------------------------------------------------------
      // CHECK MACHINE
      // --------------------------------------------------------

      const existingMachine =
        await db.orm.public.Machine
          .where({ id })
          .first();

      if (!existingMachine) {
        return res.status(404).json({
          success: false,
          message: "Machine not found",
        });
      }

      const {
        machineCode,
        machineName,
        modelNumber,
        serialNumber,
        description,
        projectId,
        isActive,
      } = req.body;

      // --------------------------------------------------------
      // UPDATE DATA
      // --------------------------------------------------------

      const updateData: {
        machineCode?: string;
        machineName?: string;
        modelNumber?: string | null;
        serialNumber?: string | null;
        description?: string | null;
        projectId?: number | null;
        isActive?: boolean;
      } = {};

      // --------------------------------------------------------
      // MACHINE CODE
      // --------------------------------------------------------

      if (
        machineCode !== undefined &&
        machineCode !== null
      ) {
        const cleanMachineCode =
          String(machineCode).trim();

        if (!cleanMachineCode) {
          return res.status(400).json({
            success: false,
            message:
              "Machine code cannot be empty",
          });
        }

        if (
          cleanMachineCode !==
          existingMachine.machineCode
        ) {
          const duplicateMachine =
            await db.orm.public.Machine
              .where({
                machineCode: cleanMachineCode,
              })
              .first();

          if (
            duplicateMachine &&
            duplicateMachine.id !== id
          ) {
            return res.status(409).json({
              success: false,
              message:
                "Machine code already exists",
            });
          }
        }

        updateData.machineCode =
          cleanMachineCode;
      }

      // --------------------------------------------------------
      // MACHINE NAME
      // --------------------------------------------------------

      if (
        machineName !== undefined &&
        machineName !== null
      ) {
        const cleanMachineName =
          String(machineName).trim();

        if (!cleanMachineName) {
          return res.status(400).json({
            success: false,
            message:
              "Machine name cannot be empty",
          });
        }

        updateData.machineName =
          cleanMachineName;
      }

      // --------------------------------------------------------
      // MODEL NUMBER
      // --------------------------------------------------------

      if (modelNumber !== undefined) {
        updateData.modelNumber =
          modelNumber === null ||
          String(modelNumber).trim() === ""
            ? null
            : String(modelNumber).trim();
      }

      // --------------------------------------------------------
      // SERIAL NUMBER
      // --------------------------------------------------------

      if (serialNumber !== undefined) {
        updateData.serialNumber =
          serialNumber === null ||
          String(serialNumber).trim() === ""
            ? null
            : String(serialNumber).trim();
      }

      // --------------------------------------------------------
      // DESCRIPTION
      // --------------------------------------------------------

      if (description !== undefined) {
        updateData.description =
          description === null ||
          String(description).trim() === ""
            ? null
            : String(description).trim();
      }

      // --------------------------------------------------------
      // PROJECT
      // --------------------------------------------------------

      if (projectId !== undefined) {
        if (
          projectId === null ||
          projectId === ""
        ) {
          updateData.projectId = null;
        } else {
          const parsedProjectId =
            Number(projectId);

          if (
            !Number.isInteger(parsedProjectId) ||
            parsedProjectId <= 0
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid project ID",
            });
          }

          const project =
            await db.orm.public.Project
              .where({
                id: parsedProjectId,
              })
              .first();

          if (!project) {
            return res.status(404).json({
              success: false,
              message: "Project not found",
            });
          }

          updateData.projectId =
            parsedProjectId;
        }
      }

      // --------------------------------------------------------
      // ACTIVE STATUS
      // --------------------------------------------------------

      if (isActive !== undefined) {
        updateData.isActive =
          Boolean(isActive);
      }

      // --------------------------------------------------------
      // UPDATE MACHINE
      // --------------------------------------------------------

      const machine =
        await db.orm.public.Machine
          .where({ id })
          .update(updateData);

      return res.json({
        success: true,
        message: "Machine updated successfully",
        data: machine,
      });
    } catch (error) {
      console.error(
        "UPDATE MACHINE ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update machine",
      });
    }
  },
);

// ============================================================
// DELETE MACHINE
// DELETE /api/machines/:id
// ============================================================

router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine ID",
        });
      }

      // --------------------------------------------------------
      // CHECK MACHINE
      // --------------------------------------------------------

      const existingMachine =
        await db.orm.public.Machine
          .where({ id })
          .first();

      if (!existingMachine) {
        return res.status(404).json({
          success: false,
          message: "Machine not found",
        });
      }

      // --------------------------------------------------------
      // CHECK LINKED DRAWINGS
      // --------------------------------------------------------

      const drawings =
        await db.orm.public.Drawing
          .where({
            machineId: id,
          })
          .all();

      if (drawings.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete machine because drawings are linked to it. Remove or reassign the drawings first.",
        });
      }

      // --------------------------------------------------------
      // DELETE MACHINE
      // --------------------------------------------------------

      await db.orm.public.Machine
        .where({ id })
        .delete();

      return res.json({
        success: true,
        message:
          "Machine deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE MACHINE ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete machine",
      });
    }
  },
);

// ============================================================
// EXPORT
// ============================================================

export default router;