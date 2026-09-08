import { useEffect, useMemo, useState } from "react";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getCustomers,
} from "../../services/api";

import ProjectForm from "../../components/ProjectForm";
import ProjectDetails from "../../components/ProjectDetails";
import ProjectEdit from "../../components/ProjectEdit";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showProjectForm, setShowProjectForm] =
    useState(false);

  // Selected project for VIEW modal
  const [selectedProject, setSelectedProject] =
    useState(null);

  // Selected project for EDIT modal
  const [selectedEditProject, setSelectedEditProject] =
    useState(null);

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const result = await getProjects();

      setProjects(result.data || []);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD CUSTOMERS
  // ============================================================

  async function loadCustomers() {
    try {
      const result = await getCustomers();

      setCustomers(result.data || []);
    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err,
      );
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredProjects = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const projectName =
        project.name ||
        project.projectName ||
        "";

      const projectCode =
        project.projectCode ||
        project.code ||
        "";

      const customerName =
        project.customer?.name ||
        project.customerName ||
        "";

      const description =
        project.description || "";

      const status =
        project.status || "";

      return (
        projectName
          .toLowerCase()
          .includes(query) ||
        projectCode
          .toLowerCase()
          .includes(query) ||
        customerName
          .toLowerCase()
          .includes(query) ||
        description
          .toLowerCase()
          .includes(query) ||
        status
          .toLowerCase()
          .includes(query)
      );
    });
  }, [projects, search]);

  // ============================================================
  // CREATE PROJECT
  // ============================================================

  async function handleCreateProject(
    projectData,
  ) {
    try {
      setSaving(true);
      setError("");

      await createProject(projectData);

      setShowProjectForm(false);

      await loadProjects();
    } catch (err) {
      setError(
        err?.message ||
          "Failed to create project.",
      );

      throw err;
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UPDATE PROJECT
  // ============================================================

  async function handleUpdateProject(
    projectData,
  ) {
    if (!selectedEditProject) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateProject(
        selectedEditProject.id,
        projectData,
      );

      // Close edit modal
      setSelectedEditProject(null);

      // Refresh project list
      await loadProjects();
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update project.",
      );

      throw err;
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
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

  // ============================================================
  // FORMAT STATUS
  // ============================================================

  function formatStatus(status) {
    if (!status) {
      return "Planning";
    }

    return String(status)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      );
  }

  // ============================================================
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    const normalizedStatus =
      String(status || "")
        .toLowerCase();

    if (
      normalizedStatus ===
      "completed"
    ) {
      return "status-inactive";
    }

    if (
      normalizedStatus ===
      "cancelled"
    ) {
      return "status-inactive";
    }

    return "status-active";
  }

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  function getCustomerName(project) {
    return (
      project.customer?.name ||
      project.customerName ||
      customers.find(
        (customer) =>
          customer.id ===
          project.customerId,
      )?.name ||
      "-"
    );
  }

  // ============================================================
  // VIEW PROJECT
  // ============================================================

  function handleViewProject(project) {
    setSelectedProject(project);
  }

  // ============================================================
  // EDIT PROJECT
  // ============================================================

  function handleEditProject(project) {
    setSelectedEditProject(project);
  }

  // ============================================================
  // DELETE PROJECT
  // ============================================================

  async function handleDeleteProject(
    project,
  ) {
    const projectName =
      project.name ||
      project.projectName ||
      "Unnamed Project";

    const confirmed =
      window.confirm(
        `Delete project "${projectName}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteProject(
        project.id,
      );

      setProjects(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              project.id,
          ),
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to delete project.",
      );
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="projects-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h2>
            Projects
          </h2>

          <p>
            Manage your projects, timelines and
            project status.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowProjectForm(true)
          }
        >
          + Add Project
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="login-error"
          style={{
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          PROJECT CARD
      ====================================================== */}

      <div className="data-card">

        {/* CARD HEADER */}

        <div className="data-card-header">

          <div>
            <h3>
              Project List
            </h3>

            <p>
              {filteredProjects.length} of{" "}
              {projects.length} registered projects
            </p>
          </div>

          <div className="search-box">

            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="table-wrapper">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  Project
                </th>

                <th>
                  Code
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Start Date
                </th>

                <th>
                  End Date
                </th>

                <th>
                  Status
                </th>

                <th className="actions-column">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "40px",
                    }}
                  >
                    Loading projects...
                  </td>

                </tr>

              ) : error && projects.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "40px",
                      color:
                        "#dc2626",
                    }}
                  >
                    Failed to load projects.
                  </td>

                </tr>

              ) : filteredProjects.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "40px",
                    }}
                  >
                    {search
                      ? "No projects match your search."
                      : "No projects found."}
                  </td>

                </tr>

              ) : (

                filteredProjects.map(
                  (project) => {

                    const projectName =
                      project.name ||
                      project.projectName ||
                      "Unnamed Project";

                    const projectCode =
                      project.projectCode ||
                      project.code ||
                      "-";

                    const initial =
                      projectName
                        .charAt(0)
                        .toUpperCase();

                    const customerName =
                      getCustomerName(
                        project,
                      );

                    const status =
                      project.status ||
                      "planning";

                    return (

                      <tr
                        key={project.id}
                      >

                        {/* PROJECT */}

                        <td>

                          <div className="table-customer">

                            <div className="table-avatar">
                              {initial}
                            </div>

                            <div>

                              <strong>
                                {projectName}
                              </strong>

                              <span>
                                {project.description ||
                                  "Project"}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CODE */}

                        <td>

                          <span className="code-badge">
                            {projectCode}
                          </span>

                        </td>

                        {/* CUSTOMER */}

                        <td>
                          {customerName}
                        </td>

                        {/* START DATE */}

                        <td>
                          {formatDate(
                            project.startDate,
                          )}
                        </td>

                        {/* END DATE */}

                        <td>
                          {formatDate(
                            project.expectedEndDate ||
                              project.endDate,
                          )}
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              status,
                            )}`}
                          >
                            {formatStatus(
                              status,
                            )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="table-actions">

                            {/* VIEW */}

                            <button
                              type="button"
                              className="action-button view"
                              title="View"
                              onClick={() =>
                                handleViewProject(
                                  project,
                                )
                              }
                            >
                              👁
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              className="action-button edit"
                              title="Edit"
                              onClick={() =>
                                handleEditProject(
                                  project,
                                )
                              }
                            >
                              ✏
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="action-button delete"
                              title="Delete"
                              onClick={() =>
                                handleDeleteProject(
                                  project,
                                )
                              }
                            >
                              🗑
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  },
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="table-footer">

          <span>

            Showing{" "}

            <strong>
              {filteredProjects.length}
            </strong>{" "}

            of{" "}

            <strong>
              {projects.length}
            </strong>{" "}

            projects

          </span>

          <div className="pagination">

            <button
              type="button"
              className="pagination-button active"
            >
              1
            </button>

          </div>

        </div>

      </div>

      {/* ======================================================
          ADD PROJECT MODAL
      ====================================================== */}

      {showProjectForm && (

        <ProjectForm
          customers={customers}

          onClose={() =>
            setShowProjectForm(false)
          }

          onSave={
            handleCreateProject
          }

          loading={saving}
        />

      )}

      {/* ======================================================
          VIEW PROJECT MODAL
      ====================================================== */}

      {selectedProject && (

        <ProjectDetails
          project={selectedProject}
          customerName={getCustomerName(
            selectedProject,
          )}
          onClose={() =>
            setSelectedProject(null)
          }
        />

      )}

      {/* ======================================================
          EDIT PROJECT MODAL
      ====================================================== */}

      {selectedEditProject && (

        <ProjectEdit
          project={selectedEditProject}
          customers={customers}

          onClose={() =>
            setSelectedEditProject(null)
          }

          onSave={
            handleUpdateProject
          }

          loading={saving}
        />

      )}

    </div>
  );
}

export default Projects;