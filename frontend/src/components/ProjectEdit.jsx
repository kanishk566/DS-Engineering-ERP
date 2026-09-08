import { useEffect, useState } from "react";

function ProjectEdit({
  project,
  customers = [],
  onClose,
  onSave,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    projectCode: "",
    customerId: "",
    startDate: "",
    expectedEndDate: "",
    status: "planning",
    description: "",
  });

  const [error, setError] = useState("");

  // ============================================================
  // LOAD PROJECT DATA
  // ============================================================

  useEffect(() => {
    if (!project) return;

    setFormData({
      name: project.name || "",
      projectCode: project.projectCode || "",
      customerId:
        project.customerId !== null &&
        project.customerId !== undefined
          ? String(project.customerId)
          : "",
      startDate: formatDateForInput(
        project.startDate,
      ),
      expectedEndDate: formatDateForInput(
        project.expectedEndDate,
      ),
      status: project.status || "planning",
      description: project.description || "",
    });

    setError("");
  }, [project]);

  // ============================================================
  // DATE FORMATTER
  // ============================================================

  function formatDateForInput(value) {
    if (!value) return "";

    const dateString = String(value);

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // ISO date
    if (dateString.includes("T")) {
      return dateString.substring(0, 10);
    }

    return "";
  }

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!formData.projectCode.trim()) {
      setError("Project code is required.");
      return;
    }

    if (
      formData.startDate &&
      formData.expectedEndDate &&
      formData.expectedEndDate <
        formData.startDate
    ) {
      setError(
        "Expected end date cannot be before start date.",
      );
      return;
    }

    if (onSave) {
      try {
        await onSave({
          name: formData.name.trim(),

          projectCode:
            formData.projectCode.trim(),

          customerId:
            formData.customerId === ""
              ? null
              : Number(formData.customerId),

          startDate:
            formData.startDate || null,

          expectedEndDate:
            formData.expectedEndDate || null,

          status: formData.status,

          description:
            formData.description.trim() || null,
        });
      } catch (err) {
        setError(
          err.message ||
            "Failed to update project.",
        );
      }
    }
  }

  if (!project) {
    return null;
  }

  return (
    <div className="customer-form-overlay">
      <div className="customer-details-modal">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="customer-form-header">

          <div>
            <h3>Edit Project</h3>

            <p>
              Update project information.
            </p>
          </div>

          <button
            type="button"
            className="form-close-button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>

        </div>

        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

          {/* ERROR */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-section-title">
            Project Information
          </div>

          <div className="form-grid">

            {/* PROJECT NAME */}

            <div className="form-group">

              <label htmlFor="edit-project-name">
                Project Name *
              </label>

              <input
                id="edit-project-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>

            {/* PROJECT CODE */}

            <div className="form-group">

              <label htmlFor="edit-project-code">
                Project Code *
              </label>

              <input
                id="edit-project-code"
                name="projectCode"
                type="text"
                value={formData.projectCode}
                onChange={handleChange}
                required
              />

            </div>

            {/* CUSTOMER */}

            <div className="form-group">

              <label htmlFor="edit-project-customer">
                Customer
              </label>

              <select
                id="edit-project-customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
              >

                <option value="">
                  Select Customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                  </option>
                ))}

              </select>

            </div>

            {/* STATUS */}

            <div className="form-group">

              <label htmlFor="edit-project-status">
                Status
              </label>

              <select
                id="edit-project-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >

                <option value="planning">
                  Planning
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="on_hold">
                  On Hold
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </div>

            {/* START DATE */}

            <div className="form-group">

              <label htmlFor="edit-project-start-date">
                Start Date
              </label>

              <input
                id="edit-project-start-date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />

            </div>

            {/* END DATE */}

            <div className="form-group">

              <label htmlFor="edit-project-end-date">
                Expected End Date
              </label>

              <input
                id="edit-project-end-date"
                name="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={handleChange}
              />

            </div>

            {/* DESCRIPTION */}

            <div className="form-group full-width">

              <label htmlFor="edit-project-description">
                Description
              </label>

              <textarea
                id="edit-project-description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* ================================================== */}
          {/* ACTIONS */}
          {/* ================================================== */}

          <div className="customer-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "Update Project"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default ProjectEdit;