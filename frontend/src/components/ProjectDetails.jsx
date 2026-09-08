function ProjectDetails({ project, customerName, onClose }) {
  if (!project) {
    return null;
  }

  const projectName =
    project.name ||
    project.projectName ||
    "Unnamed Project";

  const projectCode =
    project.projectCode ||
    project.code ||
    "-";

  const status =
    project.status ||
    "planning";

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  }

  function formatStatus(value) {
    if (!value) {
      return "Planning";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }

  function getStatusClass(value) {
    const normalized =
      String(value || "").toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "cancelled"
    ) {
      return "status-inactive";
    }

    return "status-active";
  }

  const initial =
    projectName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* HEADER */}

        <div className="customer-form-header">

          <div className="customer-details-title">

            <div className="customer-details-avatar">
              {initial}
            </div>

            <div>
              <h3>{projectName}</h3>

              <p>
                Project Details
              </p>
            </div>

          </div>

          <button
            type="button"
            className="form-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* CONTENT */}

        <div className="customer-details-content">

          <div className="details-section-title">
            Project Information
          </div>


          <div className="details-grid">

            <div className="detail-item">
              <span>
                Project Name
              </span>

              <strong>
                {projectName}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Project Code
              </span>

              <strong>
                {projectCode}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Customer
              </span>

              <strong>
                {customerName || "-"}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Status
              </span>

              <strong>

                <span
                  className={`status-badge ${getStatusClass(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>

              </strong>
            </div>


            <div className="detail-item">
              <span>
                Start Date
              </span>

              <strong>
                {formatDate(
                  project.startDate,
                )}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Expected End Date
              </span>

              <strong>
                {formatDate(
                  project.expectedEndDate ||
                    project.endDate,
                )}
              </strong>
            </div>

          </div>


          <div className="details-section-title address-title">
            Description
          </div>


          <div className="customer-address">
            {project.description ||
              "No description available"}
          </div>

        </div>


        {/* FOOTER */}

        <div className="customer-details-footer">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProjectDetails;