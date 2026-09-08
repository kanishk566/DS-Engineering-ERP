import { useState } from "react";

function ProjectForm({
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

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

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
      formData.expectedEndDate < formData.startDate
    ) {
      setError(
        "Expected end date cannot be before start date."
      );
      return;
    }

    if (!onSave) {
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),

        projectCode: formData.projectCode.trim(),

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
        err?.message ||
          "Failed to save project."
      );
    }
  }

  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* HEADER */}

        <div className="customer-form-header">

          <div>
            <h3>Add Project</h3>

            <p>
              Add a new project to your project
              management system.
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

        {/* FORM */}

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

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

              <label htmlFor="project-name">
                Project Name *
              </label>

              <input
                id="project-name"
                name="name"
                type="text"
                placeholder="Enter project name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </div>

            {/* PROJECT CODE */}

            <div className="form-group">

              <label htmlFor="project-code">
                Project Code *
              </label>

              <input
                id="project-code"
                name="projectCode"
                type="text"
                placeholder="e.g. PROJ-002"
                value={formData.projectCode}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </div>

            {/* CUSTOMER */}

            <div className="form-group">

              <label htmlFor="project-customer">
                Customer
              </label>

              <select
                id="project-customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                disabled={loading}
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

              <label htmlFor="project-status">
                Status
              </label>

              <select
                id="project-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
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

              <label htmlFor="project-start-date">
                Start Date
              </label>

              <input
                id="project-start-date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

            {/* EXPECTED END DATE */}

            <div className="form-group">

              <label htmlFor="project-end-date">
                Expected End Date
              </label>

              <input
                id="project-end-date"
                name="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

            {/* DESCRIPTION */}

            <div className="form-group full-width">

              <label htmlFor="project-description">
                Description
              </label>

              <textarea
                id="project-description"
                name="description"
                rows="4"
                placeholder="Enter project description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

          </div>

          {/* ACTIONS */}

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
                ? "Saving..."
                : "Save Project"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ProjectForm;