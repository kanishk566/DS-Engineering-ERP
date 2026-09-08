import { useEffect, useMemo, useState } from "react";

import {
  apiRequest,
  getCurrentUser,
  getDrawings,
  getDrawingsByMachine,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  getDrawingRevisions,
  createDrawingRevision,
  deleteDrawingRevision,
  getProjects,
  getMachines,
} from "../../services/api";

/*
  DS Engineering ERP
  Drawing Management + Revision History + Approval Workflow

  Workflow:
  DRAFT -> UNDER REVIEW -> APPROVED
                       \-> REJECTED

  Approval API:
  PATCH /api/drawings/:id/approval
  body:
  {
    action: "submit_review" | "approve" | "reject",
    employeeId: number,
    remarks: string
  }
*/

const emptyForm = {
  drawingNumber: "",
  title: "",
  revision: "A",
  projectId: "",
  machineId: "",
  uploadedById: "",
  fileName: "",
  fileUrl: "",
  fileType: "pdf",
  fileSize: "",
  drawingDate: "",
  description: "",
  remarks: "",
  isConfidential: false,
  status: "draft",
};

const emptyRevisionForm = {
  revision: "",
  fileName: "",
  fileUrl: "",
  fileType: "pdf",
  fileSize: "",
  changeDescription: "",
};

const emptyApprovalForm = {
  action: "",
  employeeId: "",
  remarks: "",
};

const statusLabel = {
  draft: "DRAFT",
  under_review: "UNDER REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  superseded: "SUPERSEDED",
};

const statusClass = {
  draft: "draft",
  under_review: "under-review",
  approved: "approved",
  rejected: "rejected",
  superseded: "superseded",
};

function getStatus(value) {
  return String(value || "draft").toLowerCase();
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function getPersonName(person) {
  if (!person) return "-";

  const firstName =
    person.firstName ||
    person.first_name ||
    "";

  const lastName =
    person.lastName ||
    person.last_name ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    person.name ||
    person.email ||
    "-"
  );
}

function extractEmployeeId(result) {
  const candidates = [
    result?.data?.employee?.id,
    result?.data?.user?.employee?.id,
    result?.employee?.id,
    result?.user?.employee?.id,
    result?.data?.employeeId,
    result?.employeeId,
  ];

  for (const value of candidates) {
    const number = Number(value);
    if (Number.isInteger(number) && number > 0) {
      return number;
    }
  }

  const localCandidates = [
    localStorage.getItem("erp_employee_id"),
    localStorage.getItem("employeeId"),
    localStorage.getItem("currentEmployeeId"),
  ];

  for (const value of localCandidates) {
    const number = Number(value);
    if (Number.isInteger(number) && number > 0) {
      return number;
    }
  }

  return "";
}

function getProjectName(projects, projectId) {
  const project = projects.find(
    (item) => Number(item.id) === Number(projectId),
  );

  if (!project) return projectId ? `Project #${projectId}` : "-";

  return `${project.projectCode || ""}${
    project.projectCode ? " - " : ""
  }${project.name || ""}`;
}

function getMachineName(machines, machineId) {
  const machine = machines.find(
    (item) => Number(item.id) === Number(machineId),
  );

  if (!machine) return machineId ? `Machine #${machineId}` : "-";

  return `${machine.machineName || ""}${
    machine.machineCode
      ? ` (${machine.machineCode})`
      : ""
  }`;
}

function Drawing() {
  const [drawings, setDrawings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [machines, setMachines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectedDrawing, setSelectedDrawing] = useState(null);

  const [showRevisionModal, setShowRevisionModal] =
    useState(false);
  const [revisions, setRevisions] = useState([]);
  const [revisionForm, setRevisionForm] =
    useState(emptyRevisionForm);
  const [revisionLoading, setRevisionLoading] =
    useState(false);
  const [revisionSaving, setRevisionSaving] =
    useState(false);

  const [showApprovalModal, setShowApprovalModal] =
    useState(false);
  const [approvalDrawing, setApprovalDrawing] =
    useState(null);
  const [approvalForm, setApprovalForm] =
    useState(emptyApprovalForm);
  const [approvalSaving, setApprovalSaving] =
    useState(false);

  const [showApprovalDetailsModal, setShowApprovalDetailsModal] =
    useState(false);
  const [approvalDetails, setApprovalDetails] =
    useState(null);
  const [approvalDetailsLoading, setApprovalDetailsLoading] =
    useState(false);

  const [currentEmployeeId, setCurrentEmployeeId] =
    useState("");

  const machineIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const value = Number(
      params.get("machineId"),
    );

    return Number.isInteger(value) && value > 0
      ? value
      : null;
  }, []);

  useEffect(() => {
    loadPage();
    loadCurrentEmployee();
  }, [machineIdFromUrl]);

  async function loadCurrentEmployee() {
    try {
      const result = await getCurrentUser();
      const employeeId = extractEmployeeId(result);

      if (employeeId) {
        setCurrentEmployeeId(employeeId);
      }
    } catch (err) {
      console.warn(
        "Could not resolve current employee:",
        err,
      );
    }
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const [
        drawingResult,
        projectResult,
        machineResult,
      ] = await Promise.all([
        machineIdFromUrl
          ? getDrawingsByMachine(machineIdFromUrl)
          : getDrawings(),
        getProjects(),
        getMachines(),
      ]);

      if (drawingResult?.success) {
        setDrawings(drawingResult.data || []);
      } else {
        setDrawings([]);
        setError(
          drawingResult?.message ||
            "Failed to load drawings",
        );
      }

      if (projectResult?.success) {
        setProjects(projectResult.data || []);
      }

      if (machineResult?.success) {
        setMachines(machineResult.data || []);
      }
    } catch (err) {
      console.error(
        "Failed to load drawings page:",
        err,
      );

      setError(
        err.message ||
          "Failed to load drawings",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredDrawings = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return drawings.filter((drawing) => {
      const status = getStatus(
        drawing.status,
      );

      if (
        statusFilter !== "all" &&
        status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        drawing.drawingNumber,
        drawing.title,
        drawing.revision,
        drawing.fileName,
        getProjectName(
          projects,
          drawing.projectId,
        ),
        getMachineName(
          machines,
          drawing.machineId,
        ),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    drawings,
    projects,
    machines,
    search,
    statusFilter,
  ]);

  function handleNewDrawing() {
    setEditingDrawing(null);
    setForm({
      ...emptyForm,
      machineId:
        machineIdFromUrl
          ? String(machineIdFromUrl)
          : "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleEditDrawing(drawing) {
    setEditingDrawing(drawing);

    setForm({
      drawingNumber:
        drawing.drawingNumber || "",
      title:
        drawing.title || "",
      revision:
        drawing.revision || "A",
      projectId:
        drawing.projectId
          ? String(drawing.projectId)
          : "",
      machineId:
        drawing.machineId
          ? String(drawing.machineId)
          : "",
      uploadedById:
        drawing.uploadedById
          ? String(drawing.uploadedById)
          : "",
      fileName:
        drawing.fileName || "",
      fileUrl:
        drawing.fileUrl || "",
      fileType:
        drawing.fileType || "pdf",
      fileSize:
        drawing.fileSize ?? "",
      drawingDate:
        drawing.drawingDate
          ? String(
              drawing.drawingDate,
            ).slice(0, 10)
          : "",
      description:
        drawing.description || "",
      remarks:
        drawing.remarks || "",
      isConfidential:
        Boolean(drawing.isConfidential),
      status:
        drawing.status || "draft",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleFormChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.drawingNumber.trim()) {
      setError(
        "Drawing number is required.",
      );
      return;
    }

    if (!form.title.trim()) {
      setError("Drawing title is required.");
      return;
    }

    if (!form.projectId) {
      setError("Please select a project.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        drawingNumber:
          form.drawingNumber.trim(),
        title: form.title.trim(),
        revision:
          form.revision.trim() || "A",
        projectId: Number(
          form.projectId,
        ),
        machineId:
          form.machineId
            ? Number(form.machineId)
            : null,
        uploadedById:
          form.uploadedById
            ? Number(form.uploadedById)
            : null,
        fileName:
          form.fileName.trim() || null,
        fileUrl:
          form.fileUrl.trim() || null,
        fileType:
          form.fileType || "other",
        fileSize:
          form.fileSize !== ""
            ? Number(form.fileSize)
            : null,
        drawingDate:
          form.drawingDate || null,
        description:
          form.description.trim() || null,
        remarks:
          form.remarks.trim() || null,
        isConfidential:
          Boolean(form.isConfidential),
        status:
          form.status || "draft",
      };

      if (editingDrawing) {
        await updateDrawing(
          editingDrawing.id,
          payload,
        );

        setSuccess(
          "Drawing updated successfully.",
        );
      } else {
        await createDrawing(payload);

        setSuccess(
          "Drawing created successfully.",
        );
      }

      setShowForm(false);
      setEditingDrawing(null);
      setForm(emptyForm);

      await loadPage();
    } catch (err) {
      console.error(
        "Save drawing error:",
        err,
      );

      setError(
        err.message ||
          "Failed to save drawing.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(drawing) {
    const confirmed =
      window.confirm(
        `Delete drawing ${drawing.drawingNumber}? This will also remove its revision history.`,
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteDrawing(
        drawing.id,
      );

      setSuccess(
        "Drawing deleted successfully.",
      );

      await loadPage();
    } catch (err) {
      console.error(
        "Delete drawing error:",
        err,
      );

      setError(
        err.message ||
          "Failed to delete drawing.",
      );
    }
  }

  async function handleOpenRevisions(
    drawing,
  ) {
    setSelectedDrawing(drawing);
    setShowRevisionModal(true);
    setRevisionForm(
      emptyRevisionForm,
    );
    setRevisions([]);
    setRevisionLoading(true);
    setError("");
    setSuccess("");

    try {
      const result =
        await getDrawingRevisions(
          drawing.id,
        );

      if (result?.success) {
        setRevisions(
          result.data || [],
        );
      } else {
        setError(
          result?.message ||
            "Failed to load revisions.",
        );
      }
    } catch (err) {
      console.error(
        "Load revisions error:",
        err,
      );

      setError(
        err.message ||
          "Failed to load revisions.",
      );
    } finally {
      setRevisionLoading(false);
    }
  }

  function handleRevisionChange(
    event,
  ) {
    const { name, value } =
      event.target;

    setRevisionForm(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );
  }

  async function handleCreateRevision(
    event,
  ) {
    event.preventDefault();

    if (!selectedDrawing) return;

    if (!revisionForm.revision.trim()) {
      setError(
        "Revision is required.",
      );
      return;
    }

    try {
      setRevisionSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        revision:
          revisionForm.revision.trim(),
        fileName:
          revisionForm.fileName.trim() ||
          null,
        fileUrl:
          revisionForm.fileUrl.trim() ||
          null,
        fileType:
          revisionForm.fileType || "other",
        fileSize:
          revisionForm.fileSize !== ""
            ? Number(
                revisionForm.fileSize,
              )
            : null,
        changeDescription:
          revisionForm.changeDescription.trim() ||
          null,
        uploadedById:
          currentEmployeeId
            ? Number(
                currentEmployeeId,
              )
            : null,
      };

      await createDrawingRevision(
        selectedDrawing.id,
        payload,
      );

      setSuccess(
        `Revision ${payload.revision} added successfully.`,
      );

      setRevisionForm(
        emptyRevisionForm,
      );

      await handleOpenRevisions(
        selectedDrawing,
      );

      await loadPage();
    } catch (err) {
      console.error(
        "Create revision error:",
        err,
      );

      setError(
        err.message ||
          "Failed to create revision.",
      );
    } finally {
      setRevisionSaving(false);
    }
  }

  async function handleDeleteRevision(
    revision,
  ) {
    if (!selectedDrawing) return;

    const confirmed =
      window.confirm(
        `Delete revision ${revision.revision}?`,
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteDrawingRevision(
        selectedDrawing.id,
        revision.id,
      );

      setSuccess(
        `Revision ${revision.revision} deleted successfully.`,
      );

      await handleOpenRevisions(
        selectedDrawing,
      );

      await loadPage();
    } catch (err) {
      console.error(
        "Delete revision error:",
        err,
      );

      setError(
        err.message ||
          "Failed to delete revision.",
      );
    }
  }

  function openApproval(
    drawing,
    action,
  ) {
    const employeeId =
      currentEmployeeId ||
      drawing.reviewedById ||
      drawing.approvedById ||
      "";

    setApprovalDrawing(
      drawing,
    );

    setApprovalForm({
      action,
      employeeId:
        employeeId
          ? String(employeeId)
          : "",
      remarks:
        drawing.approvalRemarks ||
        "",
    });

    setShowApprovalModal(
      true,
    );

    setError("");
    setSuccess("");
  }

  function closeApproval() {
    if (approvalSaving) return;

    setShowApprovalModal(
      false,
    );
    setApprovalDrawing(
      null,
    );
    setApprovalForm(
      emptyApprovalForm,
    );
  }

  function handleApprovalChange(
    event,
  ) {
    const { name, value } =
      event.target;

    setApprovalForm(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );
  }

  async function handleApprovalSubmit(
    event,
  ) {
    event.preventDefault();

    if (!approvalDrawing) return;

    const employeeId = Number(
      approvalForm.employeeId,
    );

    if (
      !Number.isInteger(
        employeeId,
      ) ||
      employeeId <= 0
    ) {
      setError(
        "Valid Employee ID is required for this workflow action.",
      );
      return;
    }

    if (
      approvalForm.action ===
        "reject" &&
      !approvalForm.remarks.trim()
    ) {
      setError(
        "Please enter a rejection remark.",
      );
      return;
    }

    try {
      setApprovalSaving(
        true,
      );
      setError("");
      setSuccess("");

      const result =
        await apiRequest(
          `/drawings/${approvalDrawing.id}/approval`,
          {
            method: "PATCH",
            body: JSON.stringify({
              action:
                approvalForm.action,
              employeeId,
              remarks:
                approvalForm.remarks.trim() ||
                null,
            }),
          },
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Approval action failed.",
        );
      }

      const messages = {
        submit_review:
          "Drawing submitted for review successfully.",
        approve:
          "Drawing approved successfully.",
        reject:
          "Drawing rejected successfully.",
      };

      setSuccess(
        messages[
          approvalForm.action
        ] ||
          "Workflow updated successfully.",
      );

      closeApproval();
      await loadPage();
    } catch (err) {
      console.error(
        "Approval workflow error:",
        err,
      );

      setError(
        err.message ||
          "Failed to update drawing workflow.",
      );
    } finally {
      setApprovalSaving(
        false,
      );
    }
  }

  async function handleOpenApprovalDetails(drawing) {
    try {
      setError("");
      setSuccess("");
      setApprovalDetailsLoading(true);
      setApprovalDetails(null);
      setShowApprovalDetailsModal(true);

      const result = await apiRequest(
        `/drawings/${drawing.id}/approval`,
      );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to fetch drawing approval details.",
        );
      }

      const details = result.data || {};

      const employeeIds = [
        details.reviewedById,
        details.approvedById,
      ]
        .map((value) => Number(value))
        .filter(
          (value, index, array) =>
            Number.isInteger(value) &&
            value > 0 &&
            array.indexOf(value) === index,
        );

      const employeeResults = await Promise.all(
        employeeIds.map(async (employeeId) => {
          try {
            const employeeResult = await apiRequest(
              `/employees/${employeeId}`,
            );

            if (!employeeResult?.success) {
              return [employeeId, null];
            }

            return [
              employeeId,
              employeeResult.data?.employee ||
                employeeResult.data ||
                employeeResult.employee ||
                null,
            ];
          } catch {
            return [employeeId, null];
          }
        }),
      );

      const employeeMap = Object.fromEntries(
        employeeResults,
      );

      setApprovalDetails({
        ...details,
        drawingTitle: drawing.title,
        revision: drawing.revision,
        employeeMap,
      });
    } catch (err) {
      console.error(
        "Approval details error:",
        err,
      );

      setApprovalDetails(null);
      setError(
        err.message ||
          "Failed to load approval details.",
      );
    } finally {
      setApprovalDetailsLoading(false);
    }
  }

  function closeApprovalDetails() {
    if (approvalDetailsLoading) return;

    setShowApprovalDetailsModal(false);
    setApprovalDetails(null);
  }

  function getApprovalEmployeeLabel(
    employeeId,
  ) {
    if (!employeeId) return "-";

    const employee =
      approvalDetails?.employeeMap?.[
        Number(employeeId)
      ];

    if (!employee) {
      return `Employee #${employeeId}`;
    }

    const name = getPersonName(employee);
    const code = employee.employeeCode
      ? ` (${employee.employeeCode})`
      : "";

    return `${name}${code}`;
  }

  function renderApprovalActions(
    drawing,
  ) {
    const status = getStatus(
      drawing.status,
    );

    return (
      <div
        className="drawing-approval-actions"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        {(status === "draft" ||
          status === "rejected") && (
          <button
            type="button"
            className="machine-action-button drawing"
            onClick={() =>
              openApproval(
                drawing,
                "submit_review",
              )
            }
          >
            📤 Submit Review
          </button>
        )}

        {status === "under_review" && (
          <>
            <button
              type="button"
              className="machine-action-button"
              onClick={() =>
                openApproval(
                  drawing,
                  "approve",
                )
              }
              style={{
                borderColor:
                  "#198754",
                color: "#198754",
              }}
            >
              ✅ Approve
            </button>

            <button
              type="button"
              className="machine-action-button"
              onClick={() =>
                openApproval(
                  drawing,
                  "reject",
                )
              }
              style={{
                borderColor:
                  "#dc3545",
                color: "#dc3545",
              }}
            >
              ❌ Reject
            </button>
          </>
        )}

        <button
          type="button"
          className="machine-action-button drawing"
          onClick={() =>
            handleOpenApprovalDetails(drawing)
          }
        >
          🔎 Approval Details
        </button>
      </div>
    );
  }

  return (
    <div className="customers-page drawing-page">
      <style>
        {`
          .drawing-page .drawing-status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .35px;
            white-space: nowrap;
          }

          .drawing-page .drawing-status-badge.draft {
            background: #fff3cd;
            color: #856404;
          }

          .drawing-page .drawing-status-badge.under-review {
            background: #cfe2ff;
            color: #084298;
          }

          .drawing-page .drawing-status-badge.approved {
            background: #d1e7dd;
            color: #0f5132;
          }

          .drawing-page .drawing-status-badge.rejected {
            background: #f8d7da;
            color: #842029;
          }

          .drawing-page .drawing-status-badge.superseded {
            background: #e2e3e5;
            color: #41464b;
          }

          .drawing-page .drawing-alert {
            margin: 12px 0;
            padding: 11px 14px;
            border-radius: 10px;
            font-size: 14px;
          }

          .drawing-page .drawing-alert.error {
            background: #f8d7da;
            color: #842029;
            border: 1px solid #f1aeb5;
          }

          .drawing-page .drawing-alert.success {
            background: #d1e7dd;
            color: #0f5132;
            border: 1px solid #a3cfbb;
          }

          .drawing-page .drawing-workflow-box {
            margin-top: 12px;
            padding: 14px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
          }

          .drawing-page .drawing-workflow-steps {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 7px;
            margin-top: 8px;
          }

          .drawing-page .workflow-step {
            padding: 7px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            background: #eef2f7;
            color: #475569;
          }

          .drawing-page .workflow-arrow {
            color: #94a3b8;
            font-weight: 800;
          }

          .drawing-page .drawing-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(15, 23, 42, .58);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .drawing-page .drawing-modal {
            width: min(900px, 100%);
            max-height: 92vh;
            overflow: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 24px 70px rgba(15,23,42,.25);
          }

          .drawing-page .drawing-modal-header {
            padding: 18px 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            gap: 15px;
            align-items: center;
          }

          .drawing-page .drawing-modal-header h3 {
            margin: 0;
          }

          .drawing-page .drawing-modal-body {
            padding: 20px;
          }

          .drawing-page .drawing-modal-footer {
            padding: 15px 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .drawing-page .drawing-close-button {
            border: 0;
            background: #f1f5f9;
            width: 34px;
            height: 34px;
            border-radius: 9px;
            cursor: pointer;
            font-size: 18px;
          }

          .drawing-page .drawing-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .drawing-page .drawing-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .drawing-page .drawing-field.full {
            grid-column: 1 / -1;
          }

          .drawing-page .drawing-field label {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
          }

          .drawing-page .drawing-field input,
          .drawing-page .drawing-field select,
          .drawing-page .drawing-field textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dbe2ea;
            border-radius: 9px;
            padding: 10px 11px;
            font: inherit;
            outline: none;
          }

          .drawing-page .drawing-field textarea {
            min-height: 90px;
            resize: vertical;
          }

          .drawing-page .drawing-check {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .drawing-page .revision-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
          }

          .drawing-page .revision-item {
            border: 1px solid #e5e7eb;
            border-radius: 11px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .drawing-page .revision-main {
            min-width: 0;
          }

          .drawing-page .revision-main strong {
            display: block;
            margin-bottom: 4px;
          }

          .drawing-page .revision-meta {
            font-size: 12px;
            color: #64748b;
          }

          .drawing-page .workflow-info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 15px;
          }

          .drawing-page .workflow-info-card {
            padding: 11px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
          }

          .drawing-page .workflow-info-card span {
            display: block;
            color: #64748b;
            font-size: 11px;
            margin-bottom: 3px;
          }

          .drawing-page .workflow-info-card strong {
            font-size: 13px;
          }

          @media (max-width: 760px) {
            .drawing-page .drawing-form-grid,
            .drawing-page .workflow-info-grid {
              grid-template-columns: 1fr;
            }

            .drawing-page .drawing-field.full {
              grid-column: auto;
            }

            .drawing-page .revision-item {
              flex-direction: column;
            }
          }
        `}
      </style>

      <div className="page-header">
        <div>
          <h2>Drawing Management</h2>
          <p>
            Manage engineering drawings,
            revisions and approval workflow.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleNewDrawing}
        >
          + Add Drawing
        </button>
      </div>

      <div className="drawing-workflow-box">
        <strong>
          Drawing Approval Workflow
        </strong>

        <div className="drawing-workflow-steps">
          <span className="workflow-step">
            DRAFT
          </span>

          <span className="workflow-arrow">
            →
          </span>

          <span className="workflow-step">
            UNDER REVIEW
          </span>

          <span className="workflow-arrow">
            →
          </span>

          <span className="workflow-step">
            APPROVED
          </span>

          <span className="workflow-arrow">
            /
          </span>

          <span className="workflow-step">
            REJECTED
          </span>
        </div>
      </div>

      {error && (
        <div className="drawing-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="drawing-alert success">
          {success}
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>
              {machineIdFromUrl
                ? "Machine Drawings"
                : "Drawing List"}
            </h3>

            <p>
              {filteredDrawings.length} of{" "}
              {drawings.length} drawings
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div className="search-box">
              <input
                type="text"
                placeholder="Search drawings..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              style={{
                border: "1px solid #dbe2ea",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <option value="all">
                All Status
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="under_review">
                Under Review
              </option>
              <option value="approved">
                Approved
              </option>
              <option value="rejected">
                Rejected
              </option>
              <option value="superseded">
                Superseded
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              ⏳
            </div>
            <h3>
              Loading drawings...
            </h3>
            <p>
              Please wait while drawing
              data is being loaded.
            </p>
          </div>
        ) : filteredDrawings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              📐
            </div>
            <h3>
              No drawings found
            </h3>
            <p>
              Add a drawing or change
              your search/filter.
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Drawing No.</th>
                  <th>Title</th>
                  <th>Revision</th>
                  <th>Project</th>
                  <th>Machine</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDrawings.map(
                  (drawing) => {
                    const status =
                      getStatus(
                        drawing.status,
                      );

                    return (
                      <tr
                        key={
                          drawing.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              drawing.drawingNumber
                            }
                          </strong>
                        </td>

                        <td>
                          {drawing.title}
                        </td>

                        <td>
                          <strong>
                            {drawing.revision ||
                              "A"}
                          </strong>
                        </td>

                        <td>
                          {getProjectName(
                            projects,
                            drawing.projectId,
                          )}
                        </td>

                        <td>
                          {getMachineName(
                            machines,
                            drawing.machineId,
                          )}
                        </td>

                        <td>
                          <span
                            className={`drawing-status-badge ${
                              statusClass[
                                status
                              ] ||
                              "draft"
                            }`}
                          >
                            {statusLabel[
                              status
                            ] ||
                              status.toUpperCase()}
                          </span>
                        </td>

                        <td>
                          {renderApprovalActions(
                            drawing,
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap: 6,
                            }}
                          >
                            <button
                              type="button"
                              className="machine-action-button drawing"
                              onClick={() =>
                                handleOpenRevisions(
                                  drawing,
                                )
                              }
                            >
                              🔄 Revisions
                            </button>

                            <button
                              type="button"
                              className="machine-action-button"
                              onClick={() =>
                                handleEditDrawing(
                                  drawing,
                                )
                              }
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              className="machine-action-button delete"
                              onClick={() =>
                                handleDelete(
                                  drawing,
                                )
                              }
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DRAWING MODAL */}
      {showForm && (
        <div className="drawing-modal-overlay">
          <div className="drawing-modal">
            <div className="drawing-modal-header">
              <div>
                <h3>
                  {editingDrawing
                    ? "Edit Drawing"
                    : "Add New Drawing"}
                </h3>
                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color:
                      "#64748b",
                    fontSize:
                      13,
                  }}
                >
                  Enter drawing and
                  project information.
                </p>
              </div>

              <button
                type="button"
                className="drawing-close-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="drawing-modal-body">
                <div className="drawing-form-grid">
                  <div className="drawing-field">
                    <label>
                      Drawing Number *
                    </label>
                    <input
                      name="drawingNumber"
                      value={
                        form.drawingNumber
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="DWG-001"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      Title *
                    </label>
                    <input
                      name="title"
                      value={
                        form.title
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Heat Treatment Furnace Assembly"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      Revision
                    </label>
                    <input
                      name="revision"
                      value={
                        form.revision
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="A"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      Project *
                    </label>
                    <select
                      name="projectId"
                      value={
                        form.projectId
                      }
                      onChange={
                        handleFormChange
                      }
                    >
                      <option value="">
                        Select Project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            {project.projectCode}{" "}
                            -{" "}
                            {
                              project.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="drawing-field">
                    <label>
                      Machine / Model
                    </label>
                    <select
                      name="machineId"
                      value={
                        form.machineId
                      }
                      onChange={
                        handleFormChange
                      }
                    >
                      <option value="">
                        No Machine
                      </option>

                      {machines.map(
                        (machine) => (
                          <option
                            key={
                              machine.id
                            }
                            value={
                              machine.id
                            }
                          >
                            {
                              machine.machineName
                            }{" "}
                            (
                            {
                              machine.machineCode
                            }
                            )
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="drawing-field">
                    <label>
                      Uploaded By Employee ID
                    </label>
                    <input
                      type="number"
                      name="uploadedById"
                      value={
                        form.uploadedById
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      File Name
                    </label>
                    <input
                      name="fileName"
                      value={
                        form.fileName
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="heat-treatment-furnace.pdf"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      File URL
                    </label>
                    <input
                      name="fileUrl"
                      value={
                        form.fileUrl
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      File Type
                    </label>
                    <select
                      name="fileType"
                      value={
                        form.fileType
                      }
                      onChange={
                        handleFormChange
                      }
                    >
                      <option value="pdf">
                        PDF
                      </option>
                      <option value="image">
                        Image
                      </option>
                      <option value="dwg">
                        DWG
                      </option>
                      <option value="dxf">
                        DXF
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="drawing-field">
                    <label>
                      File Size (bytes)
                    </label>
                    <input
                      type="number"
                      name="fileSize"
                      value={
                        form.fileSize
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      Drawing Date
                    </label>
                    <input
                      type="date"
                      name="drawingDate"
                      value={
                        form.drawingDate
                      }
                      onChange={
                        handleFormChange
                      }
                    />
                  </div>

                  <div className="drawing-field">
                    <label>
                      Status
                    </label>
                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleFormChange
                      }
                    >
                      <option value="draft">
                        Draft
                      </option>
                      <option value="under_review">
                        Under Review
                      </option>
                      <option value="approved">
                        Approved
                      </option>
                      <option value="rejected">
                        Rejected
                      </option>
                      <option value="superseded">
                        Superseded
                      </option>
                    </select>
                  </div>

                  <div className="drawing-field full">
                    <label>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Drawing description..."
                    />
                  </div>

                  <div className="drawing-field full">
                    <label>
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={
                        form.remarks
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Additional remarks..."
                    />
                  </div>

                  <div className="drawing-field full">
                    <label className="drawing-check">
                      <input
                        type="checkbox"
                        name="isConfidential"
                        checked={
                          form.isConfidential
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                      Confidential Drawing
                    </label>
                  </div>
                </div>
              </div>

              <div className="drawing-modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingDrawing
                      ? "Update Drawing"
                      : "Create Drawing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVISION HISTORY MODAL */}
      {showRevisionModal &&
        selectedDrawing && (
          <div className="drawing-modal-overlay">
            <div className="drawing-modal">
              <div className="drawing-modal-header">
                <div>
                  <h3>
                    Revision History
                  </h3>

                  <p
                    style={{
                      margin:
                        "4px 0 0",
                      color:
                        "#64748b",
                      fontSize:
                        13,
                    }}
                  >
                    {
                      selectedDrawing.drawingNumber
                    }{" "}
                    —{" "}
                    {
                      selectedDrawing.title
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="drawing-close-button"
                  onClick={() =>
                    setShowRevisionModal(
                      false,
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="drawing-modal-body">
                <div className="workflow-info-grid">
                  <div className="workflow-info-card">
                    <span>
                      Current Revision
                    </span>
                    <strong>
                      {selectedDrawing.revision ||
                        "A"}
                    </strong>
                  </div>

                  <div className="workflow-info-card">
                    <span>
                      Current Status
                    </span>
                    <strong>
                      {
                        statusLabel[
                          getStatus(
                            selectedDrawing.status,
                          )
                        ]
                      }
                    </strong>
                  </div>
                </div>

                {revisionLoading ? (
                  <p>
                    Loading revisions...
                  </p>
                ) : revisions.length ===
                  0 ? (
                  <div
                    style={{
                      padding:
                        14,
                      borderRadius:
                        10,
                      background:
                        "#f8fafc",
                      color:
                        "#64748b",
                    }}
                  >
                    No revision
                    history found.
                  </div>
                ) : (
                  <div className="revision-list">
                    {revisions.map(
                      (revision) => (
                        <div
                          className="revision-item"
                          key={
                            revision.id
                          }
                        >
                          <div className="revision-main">
                            <strong>
                              Revision{" "}
                              {
                                revision.revision
                              }
                            </strong>

                            <div className="revision-meta">
                              File:{" "}
                              {revision.fileName ||
                                "-"}
                            </div>

                            <div className="revision-meta">
                              Date:{" "}
                              {formatDate(
                                revision.revisionDate ||
                                  revision.createdAt,
                              )}
                            </div>

                            <div
                              className="revision-meta"
                              style={{
                                marginTop:
                                  5,
                              }}
                            >
                              {
                                revision.changeDescription
                              }
                            </div>
                          </div>

                          <button
                            type="button"
                            className="machine-action-button delete"
                            onClick={() =>
                              handleDeleteRevision(
                                revision,
                              )
                            }
                          >
                            🗑 Delete
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <hr
                  style={{
                    border: 0,
                    borderTop:
                      "1px solid #e5e7eb",
                    margin:
                      "20px 0",
                  }}
                />

                <h4>
                  Add New Revision
                </h4>

                <form
                  onSubmit={
                    handleCreateRevision
                  }
                >
                  <div className="drawing-form-grid">
                    <div className="drawing-field">
                      <label>
                        Revision *
                      </label>
                      <input
                        name="revision"
                        value={
                          revisionForm.revision
                        }
                        onChange={
                          handleRevisionChange
                        }
                        placeholder="B"
                      />
                    </div>

                    <div className="drawing-field">
                      <label>
                        File Name
                      </label>
                      <input
                        name="fileName"
                        value={
                          revisionForm.fileName
                        }
                        onChange={
                          handleRevisionChange
                        }
                        placeholder="drawing-rev-B.pdf"
                      />
                    </div>

                    <div className="drawing-field">
                      <label>
                        File URL
                      </label>
                      <input
                        name="fileUrl"
                        value={
                          revisionForm.fileUrl
                        }
                        onChange={
                          handleRevisionChange
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div className="drawing-field">
                      <label>
                        File Type
                      </label>
                      <select
                        name="fileType"
                        value={
                          revisionForm.fileType
                        }
                        onChange={
                          handleRevisionChange
                        }
                      >
                        <option value="pdf">
                          PDF
                        </option>
                        <option value="image">
                          Image
                        </option>
                        <option value="dwg">
                          DWG
                        </option>
                        <option value="dxf">
                          DXF
                        </option>
                        <option value="other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="drawing-field">
                      <label>
                        File Size (bytes)
                      </label>
                      <input
                        type="number"
                        name="fileSize"
                        value={
                          revisionForm.fileSize
                        }
                        onChange={
                          handleRevisionChange
                        }
                      />
                    </div>

                    <div className="drawing-field full">
                      <label>
                        Change Description
                      </label>
                      <textarea
                        name="changeDescription"
                        value={
                          revisionForm.changeDescription
                        }
                        onChange={
                          handleRevisionChange
                        }
                        placeholder="Describe what changed in this revision..."
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop:
                        14,
                      display:
                        "flex",
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        revisionSaving
                      }
                    >
                      {revisionSaving
                        ? "Adding..."
                        : "Add Revision"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      {/* APPROVAL DETAILS MODAL */}
      {showApprovalDetailsModal && (
        <div className="drawing-modal-overlay">
          <div
            className="drawing-modal"
            style={{
              maxWidth: 720,
            }}
          >
            <div className="drawing-modal-header">
              <div>
                <h3>Approval History / Details</h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  {approvalDetails?.drawingNumber ||
                    selectedDrawing?.drawingNumber ||
                    "Drawing"}
                  {approvalDetails?.drawingTitle
                    ? ` — ${approvalDetails.drawingTitle}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="drawing-close-button"
                onClick={closeApprovalDetails}
                disabled={approvalDetailsLoading}
              >
                ×
              </button>
            </div>

            <div className="drawing-modal-body">
              {approvalDetailsLoading ? (
                <div
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading approval details...
                </div>
              ) : approvalDetails ? (
                <>
                  <div className="workflow-info-grid">
                    <div className="workflow-info-card">
                      <span>Current Status</span>
                      <strong>
                        {statusLabel[
                          getStatus(approvalDetails.status)
                        ] ||
                          getStatus(
                            approvalDetails.status,
                          ).toUpperCase()}
                      </strong>
                    </div>

                    <div className="workflow-info-card">
                      <span>Current Revision</span>
                      <strong>
                        {approvalDetails.revision ||
                          "-"}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 14,
                      marginTop: 16,
                    }}
                  >
                    <div className="workflow-info-card">
                      <span>Reviewed By</span>
                      <strong>
                        {getApprovalEmployeeLabel(
                          approvalDetails.reviewedById,
                        )}
                      </strong>
                    </div>

                    <div className="workflow-info-card">
                      <span>Reviewed At</span>
                      <strong>
                        {formatDateTime(
                          approvalDetails.reviewedAt,
                        )}
                      </strong>
                    </div>

                    <div className="workflow-info-card">
                      <span>Approved By</span>
                      <strong>
                        {getApprovalEmployeeLabel(
                          approvalDetails.approvedById,
                        )}
                      </strong>
                    </div>

                    <div className="workflow-info-card">
                      <span>Approved At</span>
                      <strong>
                        {formatDateTime(
                          approvalDetails.approvedAt,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: 7,
                      }}
                    >
                      Approval Remarks
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#334155",
                        lineHeight: 1.6,
                      }}
                    >
                      {approvalDetails.approvalRemarks ||
                        "No approval remarks recorded."}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Approval details could not be loaded.
                </div>
              )}
            </div>

            <div className="drawing-modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={closeApprovalDetails}
                disabled={approvalDetailsLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL WORKFLOW MODAL */}
      {showApprovalModal &&
        approvalDrawing && (
          <div className="drawing-modal-overlay">
            <div
              className="drawing-modal"
              style={{
                maxWidth:
                  620,
              }}
            >
              <div className="drawing-modal-header">
                <div>
                  <h3>
                    {approvalForm.action ===
                    "submit_review"
                      ? "Submit Drawing for Review"
                      : approvalForm.action ===
                          "approve"
                        ? "Approve Drawing"
                        : "Reject Drawing"}
                  </h3>

                  <p
                    style={{
                      margin:
                        "4px 0 0",
                      color:
                        "#64748b",
                      fontSize:
                        13,
                    }}
                  >
                    {
                      approvalDrawing.drawingNumber
                    }{" "}
                    —{" "}
                    {
                      approvalDrawing.title
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="drawing-close-button"
                  onClick={
                    closeApproval
                  }
                  disabled={
                    approvalSaving
                  }
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleApprovalSubmit
                }
              >
                <div className="drawing-modal-body">
                  <div className="workflow-info-grid">
                    <div className="workflow-info-card">
                      <span>
                        Current Status
                      </span>
                      <strong>
                        {
                          statusLabel[
                            getStatus(
                              approvalDrawing.status,
                            )
                          ]
                        }
                      </strong>
                    </div>

                    <div className="workflow-info-card">
                      <span>
                        Current Revision
                      </span>
                      <strong>
                        {
                          approvalDrawing.revision ||
                          "A"
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="drawing-field">
                    <label>
                      Employee ID *
                    </label>

                    <input
                      type="number"
                      name="employeeId"
                      value={
                        approvalForm.employeeId
                      }
                      onChange={
                        handleApprovalChange
                      }
                      placeholder="Enter reviewer / approver employee ID"
                      required
                    />

                    <small
                      style={{
                        color:
                          "#64748b",
                      }}
                    >
                      This ID is used
                      by the backend
                      to record who
                      performed the
                      workflow action.
                    </small>
                  </div>

                  <div
                    className="drawing-field"
                    style={{
                      marginTop:
                        14,
                    }}
                  >
                    <label>
                      {approvalForm.action ===
                      "reject"
                        ? "Rejection Remarks *"
                        : "Remarks"}
                    </label>

                    <textarea
                      name="remarks"
                      value={
                        approvalForm.remarks
                      }
                      onChange={
                        handleApprovalChange
                      }
                      placeholder={
                        approvalForm.action ===
                        "reject"
                          ? "Explain why the drawing was rejected..."
                          : "Add workflow remarks..."
                      }
                      required={
                        approvalForm.action ===
                        "reject"
                      }
                    />
                  </div>
                </div>

                <div className="drawing-modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeApproval
                    }
                    disabled={
                      approvalSaving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      approvalSaving
                    }
                    style={
                      approvalForm.action ===
                      "reject"
                        ? {
                            background:
                              "#dc3545",
                            borderColor:
                              "#dc3545",
                          }
                        : approvalForm.action ===
                            "approve"
                          ? {
                              background:
                                "#198754",
                              borderColor:
                                "#198754",
                            }
                          : undefined
                    }
                  >
                    {approvalSaving
                      ? "Processing..."
                      : approvalForm.action ===
                          "submit_review"
                        ? "Submit for Review"
                        : approvalForm.action ===
                            "approve"
                          ? "Approve Drawing"
                          : "Reject Drawing"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default Drawing;
