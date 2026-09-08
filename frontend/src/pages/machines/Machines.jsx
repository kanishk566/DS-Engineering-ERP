import { useEffect, useMemo, useState } from "react";

import {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getProjects,
} from "../../services/api";

function Machines() {
  // ============================================================
  // STATE
  // ============================================================

  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const [formData, setFormData] = useState({
    machineCode: "",
    machineName: "",
    modelNumber: "",
    serialNumber: "",
    description: "",
    projectId: "",
    isActive: true,
  });

  // ============================================================
  // LOAD MACHINES
  // ============================================================

  const loadMachines = async () => {
    try {
      setLoading(true);

      const response = await getMachines();

      const machineData =
        response?.data ||
        response?.machines ||
        [];

      setMachines(
        Array.isArray(machineData)
          ? machineData
          : []
      );
    } catch (error) {
      console.error(
        "LOAD MACHINES ERROR:",
        error
      );

      alert(
        error?.message ||
          "Failed to load machines"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = async () => {
    try {
      const response = await getProjects();

      const projectData =
        response?.data ||
        response?.projects ||
        [];

      setProjects(
        Array.isArray(projectData)
          ? projectData
          : []
      );
    } catch (error) {
      console.error(
        "LOAD PROJECTS ERROR:",
        error
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadMachines();
    loadProjects();
  }, []);

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setFormData({
      machineCode: "",
      machineName: "",
      modelNumber: "",
      serialNumber: "",
      description: "",
      projectId: "",
      isActive: true,
    });

    setEditingMachine(null);
  };

  // ============================================================
  // OPEN ADD FORM
  // ============================================================

  const handleAddMachine = () => {
    resetForm();
    setShowForm(true);
  };

  // ============================================================
  // OPEN EDIT FORM
  // ============================================================

  const handleEditMachine = (machine) => {
    setEditingMachine(machine);

    setFormData({
      machineCode:
        machine.machineCode || "",

      machineName:
        machine.machineName || "",

      modelNumber:
        machine.modelNumber || "",

      serialNumber:
        machine.serialNumber || "",

      description:
        machine.description || "",

      projectId:
        machine.projectId
          ? String(machine.projectId)
          : "",

      isActive:
        machine.isActive !== false,
    });

    setShowForm(true);
  };

  // ============================================================
  // CLOSE FORM
  // ============================================================

  const handleCloseForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ============================================================
  // SAVE MACHINE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.machineCode.trim()) {
      alert("Machine code is required.");
      return;
    }

    if (!formData.machineName.trim()) {
      alert("Machine name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        machineCode:
          formData.machineCode.trim(),

        machineName:
          formData.machineName.trim(),

        modelNumber:
          formData.modelNumber.trim(),

        serialNumber:
          formData.serialNumber.trim(),

        description:
          formData.description.trim(),

        projectId:
          formData.projectId || null,

        isActive:
          formData.isActive,
      };

      if (editingMachine) {
        await updateMachine(
          editingMachine.id,
          payload
        );

        alert(
          "Machine updated successfully."
        );
      } else {
        await createMachine(payload);

        alert(
          "Machine created successfully."
        );
      }

      setShowForm(false);
      resetForm();

      await loadMachines();
    } catch (error) {
      console.error(
        "SAVE MACHINE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Failed to save machine"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE MACHINE
  // ============================================================

  const handleDelete = async (machine) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${machine.machineName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(machine.id);

      await deleteMachine(machine.id);

      await loadMachines();

      alert(
        "Machine deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE MACHINE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Failed to delete machine"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredMachines = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return machines;
    }

    return machines.filter(
      (machine) =>
        [
          machine.machineCode,
          machine.machineName,
          machine.modelNumber,
          machine.serialNumber,
          machine.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword)
          )
    );
  }, [machines, search]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // GET PROJECT NAME
  // ============================================================

  const getProjectName = (projectId) => {
    if (!projectId) {
      return "-";
    }

    const project = projects.find(
      (item) =>
        item.id === Number(projectId)
    );

    return (
      project?.name ||
      project?.projectCode ||
      `Project #${projectId}`
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="machines-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h2>Machines</h2>

          <p>
            Manage machines and their
            technical information.
          </p>
        </div>

        <div className="page-header-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={loadMachines}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleAddMachine}
          >
            + Add Machine
          </button>

        </div>

      </div>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="machine-summary-grid">

        <div className="machine-summary-card">

          <div className="machine-summary-icon blue">
            ⚙️
          </div>

          <div>
            <span>Total Machines</span>

            <strong>
              {machines.length}
            </strong>
          </div>

        </div>


        <div className="machine-summary-card">

          <div className="machine-summary-icon green">
            ✓
          </div>

          <div>
            <span>Active Machines</span>

            <strong>
              {
                machines.filter(
                  (machine) =>
                    machine.isActive !== false
                ).length
              }
            </strong>
          </div>

        </div>


        <div className="machine-summary-card">

          <div className="machine-summary-icon orange">
            🏭
          </div>

          <div>
            <span>Assigned Machines</span>

            <strong>
              {
                machines.filter(
                  (machine) =>
                    machine.projectId
                ).length
              }
            </strong>
          </div>

        </div>

      </div>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="machine-toolbar">

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search machine code, name, model or serial number..."
          className="machine-search"
        />

      </div>


      {/* ======================================================
          MACHINE TABLE
      ====================================================== */}

      <div className="machine-table-card">

        <div className="machine-table-wrapper">

          <table className="machine-table">

            <thead>
              <tr>
                <th>Machine Code</th>
                <th>Machine Name</th>
                <th>Model Number</th>
                <th>Serial Number</th>
                <th>Project</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="machine-empty"
                  >
                    Loading machines...
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="machine-empty"
                  >
                    {search
                      ? "No machines found."
                      : "No machines available."}
                  </td>
                </tr>
              ) : (
                filteredMachines.map(
                  (machine) => (
                    <tr key={machine.id}>

                      <td>
                        <strong>
                          {machine.machineCode ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {machine.machineName ||
                          "-"}
                      </td>

                      <td>
                        {machine.modelNumber ||
                          "-"}
                      </td>

                      <td>
                        {machine.serialNumber ||
                          "-"}
                      </td>

                      <td>
                        {getProjectName(
                          machine.projectId
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            machine.isActive
                              ? "machine-status active"
                              : "machine-status inactive"
                          }
                        >
                          {machine.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td>
                        {formatDate(
                          machine.createdAt
                        )}
                      </td>

                      <td>

                        <div className="machine-actions">

                          <button
                            type="button"
                            className="machine-action-button edit"
                            onClick={() =>
                              handleEditMachine(
                                machine
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
  type="button"
  className="machine-action-button drawing"
  onClick={() =>
    window.location.href = `/drawings?machineId=${machine.id}`
  }
>
  📄 Drawings
</button>

                          <button
                            type="button"
                            className="machine-action-button delete"
                            disabled={
                              deleting ===
                              machine.id
                            }
                            onClick={() =>
                              handleDelete(
                                machine
                              )
                            }
                          >
                            {deleting ===
                            machine.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>


        <div className="machine-table-footer">

          Showing{" "}
          <strong>
            {filteredMachines.length}
          </strong>{" "}
          of{" "}
          <strong>
            {machines.length}
          </strong>{" "}
          machines

        </div>

      </div>


      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="machine-modal-overlay">

          <div className="machine-modal">

            <div className="machine-modal-header">

              <div>
                <h3>
                  {editingMachine
                    ? "Edit Machine"
                    : "Add Machine"}
                </h3>

                <p>
                  Enter machine details below.
                </p>
              </div>

              <button
                type="button"
                className="machine-close-button"
                onClick={handleCloseForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="machine-form"
            >

              <div className="machine-form-grid">

                {/* MACHINE CODE */}

                <div className="machine-field">

                  <label>
                    Machine Code *
                  </label>

                  <input
                    type="text"
                    name="machineCode"
                    value={
                      formData.machineCode
                    }
                    onChange={handleChange}
                    placeholder="e.g. MACH-001"
                    required
                  />

                </div>


                {/* MACHINE NAME */}

                <div className="machine-field">

                  <label>
                    Machine Name *
                  </label>

                  <input
                    type="text"
                    name="machineName"
                    value={
                      formData.machineName
                    }
                    onChange={handleChange}
                    placeholder="e.g. Heat Treatment Furnace"
                    required
                  />

                </div>


                {/* MODEL NUMBER */}

                <div className="machine-field">

                  <label>
                    Model Number
                  </label>

                  <input
                    type="text"
                    name="modelNumber"
                    value={
                      formData.modelNumber
                    }
                    onChange={handleChange}
                    placeholder="Enter model number"
                  />

                </div>


                {/* SERIAL NUMBER */}

                <div className="machine-field">

                  <label>
                    Serial Number
                  </label>

                  <input
                    type="text"
                    name="serialNumber"
                    value={
                      formData.serialNumber
                    }
                    onChange={handleChange}
                    placeholder="Enter serial number"
                  />

                </div>


                {/* PROJECT */}

                <div className="machine-field">

                  <label>
                    Project
                  </label>

                  <select
                    name="projectId"
                    value={
                      formData.projectId
                    }
                    onChange={handleChange}
                  >

                    <option value="">
                      No Project
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.projectCode
                            ? `${project.projectCode} - ${project.name}`
                            : project.name}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* STATUS */}

                <div className="machine-field">

                  <label>
                    Status
                  </label>

                  <label className="machine-checkbox">

                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        formData.isActive
                      }
                      onChange={handleChange}
                    />

                    <span>
                      Active Machine
                    </span>

                  </label>

                </div>


                {/* DESCRIPTION */}

                <div className="machine-field full">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    placeholder="Enter machine description..."
                    rows="4"
                  />

                </div>

              </div>


              {/* FORM ACTIONS */}

              <div className="machine-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCloseForm}
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
                    : editingMachine
                    ? "Update Machine"
                    : "Create Machine"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ======================================================
          PAGE CSS
      ====================================================== */}

      <style>{`

        .machines-page {
          width: 100%;
        }

        .page-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .machine-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .machine-summary-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow:
            0 4px 14px
            rgba(
              15,
              23,
              42,
              0.05
            );
        }

        .machine-summary-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .machine-summary-icon.blue {
          background: #eaf2ff;
        }

        .machine-summary-icon.green {
          background: #eaf9ef;
        }

        .machine-summary-icon.orange {
          background: #fff4e5;
        }

        .machine-summary-card span {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 5px;
        }

        .machine-summary-card strong {
          font-size: 25px;
          color: #0f172a;
        }

        .machine-toolbar {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .machine-search {
          width: 100%;
          height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }

        .machine-search:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px
            rgba(
              37,
              99,
              235,
              0.1
            );
        }

        .machine-table-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 4px 14px
            rgba(
              15,
              23,
              42,
              0.05
            );
        }

        .machine-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .machine-table {
          width: 100%;
          min-width: 1150px;
          border-collapse: collapse;
        }

        .machine-table th {
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 15px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .machine-table td {
          padding: 15px 14px;
          border-bottom: 1px solid #eef2f7;
          color: #334155;
          font-size: 13px;
          vertical-align: middle;
        }

        .machine-table tbody tr:hover {
          background: #fafcff;
        }

        .machine-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .machine-status.active {
          background: #eaf8ef;
          color: #15803d;
        }

        .machine-status.inactive {
          background: #f1f5f9;
          color: #64748b;
        }

        .machine-actions {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
        }

        .machine-action-button {
          border: 1px solid #dbe3ee;
          background: #ffffff;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }

        .machine-action-button:hover {
          background: #f8fafc;
        }

        .machine-action-button.edit {
          color: #475569;
        }

        .machine-action-button.drawing {
          color: #059669;
        }

        .machine-action-button.delete {
          color: #dc2626;
        }

        .machine-action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .machine-empty {
          text-align: center !important;
          padding: 45px 20px !important;
          color: #64748b !important;
        }

        .machine-table-footer {
          padding: 14px 16px;
          font-size: 13px;
          color: #64748b;
          background: #ffffff;
        }

        /* ======================================================
           MODAL
        ====================================================== */

        .machine-modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(
              15,
              23,
              42,
              0.55
            );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .machine-modal {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow:
            0 25px 60px
            rgba(
              15,
              23,
              42,
              0.25
            );
        }

        .machine-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .machine-modal-header h3 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 20px;
        }

        .machine-modal-header p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .machine-close-button {
          border: none;
          background: #f1f5f9;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          color: #475569;
        }

        .machine-form {
          padding: 24px;
        }

        .machine-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .machine-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .machine-field.full {
          grid-column: 1 / -1;
        }

        .machine-field label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .machine-field input,
        .machine-field select,
        .machine-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #ffffff;
        }

        .machine-field input,
        .machine-field select {
          height: 42px;
        }

        .machine-field textarea {
          resize: vertical;
          min-height: 100px;
        }

        .machine-field input:focus,
        .machine-field select:focus,
        .machine-field textarea:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px
            rgba(
              37,
              99,
              235,
              0.1
            );
        }

        .machine-checkbox {
          height: 42px;
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 9px;
          font-weight: 500 !important;
        }

        .machine-checkbox input {
          width: 17px;
          height: 17px;
        }

        .machine-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 900px) {

          .machine-summary-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 650px) {

          .page-header-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .machine-form-grid {
            grid-template-columns: 1fr;
          }

          .machine-field.full {
            grid-column: auto;
          }

        }

      `}</style>

    </div>
  );
}

export default Machines;