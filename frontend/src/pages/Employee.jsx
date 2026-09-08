import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

const EMPTY_FORM = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  designation: "",
  department: "",
  joiningDate: "",
  status: "active",
  userId: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

function getEmployeeList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.employees)) {
    return response.data.employees;
  }

  if (Array.isArray(response?.employees)) {
    return response.employees;
  }

  return [];
}

function getEmployee(response) {
  if (response?.data?.employee) {
    return response.data.employee;
  }

  if (response?.employee) {
    return response.employee;
  }

  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }

  return response;
}

function getErrorMessage(error, fallback = "Something went wrong") {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.message ||
    error?.response?.data?.message ||
    fallback
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status) {
  const found = STATUS_OPTIONS.find(
    (item) => item.value === status,
  );

  return found ? found.label : status || "-";
}

function getStatusClass(status) {
  if (status === "active") {
    return "employee-status active";
  }

  if (status === "inactive") {
    return "employee-status inactive";
  }

  if (status === "on_leave") {
    return "employee-status leave";
  }

  return "employee-status";
}

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/employees");

      const list = getEmployeeList(response);

      setEmployees(list);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Employees load nahi ho paaye.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(employee) {
    setEditingEmployee(employee);

    setForm({
      employeeCode: employee.employeeCode || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      phone: employee.phone || "",
      email: employee.email || "",
      designation: employee.designation || "",
      department: employee.department || "",
      joiningDate: employee.joiningDate
        ? String(employee.joiningDate).slice(0, 10)
        : "",
      status: employee.status || "active",
      userId:
        employee.userId !== null &&
        employee.userId !== undefined
          ? String(employee.userId)
          : "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.employeeCode.trim()) {
      setError("Employee Code required hai.");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First Name required hai.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employeeCode: form.employeeCode.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        designation: form.designation.trim() || null,
        department: form.department.trim() || null,
        joiningDate: form.joiningDate || null,
        status: form.status,
        userId: form.userId
          ? Number(form.userId)
          : null,
      };

      if (editingEmployee) {
        await apiRequest(
          `/employees/${editingEmployee.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        setSuccess("Employee successfully updated.");
      } else {
        await apiRequest("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Employee successfully created.");
      }

      await loadEmployees();

      setTimeout(() => {
        setShowModal(false);
        setEditingEmployee(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 500);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Employee save nahi ho paaya.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteEmployee) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/employees/${deleteEmployee.id}`,
        {
          method: "DELETE",
        },
      );

      setEmployees((previous) =>
        previous.filter(
          (employee) =>
            employee.id !== deleteEmployee.id,
        ),
      );

      setSuccess(
        "Employee successfully deleted.",
      );

      setDeleteEmployee(null);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Employee delete nahi ho paaya.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !search ||
        String(employee.employeeCode || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.firstName || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.lastName || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.email || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.phone || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.designation || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.department || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    employees,
    searchTerm,
    statusFilter,
  ]);

  const activeCount = employees.filter(
    (employee) =>
      employee.status === "active",
  ).length;

  const inactiveCount = employees.filter(
    (employee) =>
      employee.status === "inactive",
  ).length;

  const leaveCount = employees.filter(
    (employee) =>
      employee.status === "on_leave",
  ).length;

  return (
    <div className="customers-page employee-page">
      <style>{`
        .employee-page {
          padding-bottom: 40px;
        }

        .employee-page .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .employee-page .page-header h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 700;
        }

        .employee-page .page-header p {
          margin: 0;
          color: #667085;
        }

        .employee-page .primary-button {
          border: none;
          border-radius: 8px;
          padding: 11px 18px;
          background: #2563eb;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .employee-page .primary-button:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .employee-page .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .employee-page .stat-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
        }

        .employee-page .stat-label {
          color: #667085;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .employee-page .stat-value {
          font-size: 25px;
          font-weight: 700;
          color: #101828;
        }

        .employee-page .filter-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .employee-page .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .employee-page .search-box input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 14px;
          outline: none;
        }

        .employee-page .search-box input:focus,
        .employee-page select:focus,
        .employee-page input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .employee-page .filter-select {
          min-width: 160px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 11px 12px;
          background: #fff;
          font-size: 14px;
          outline: none;
        }

        .employee-page .data-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
        }

        .employee-page .data-card-header {
          padding: 18px 20px;
          border-bottom: 1px solid #eaecf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .employee-page .data-card-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .employee-page .record-count {
          font-size: 13px;
          color: #667085;
        }

        .employee-page .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .employee-page .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .employee-page .data-table th {
          background: #f9fafb;
          color: #475467;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 13px 16px;
          border-bottom: 1px solid #eaecf0;
          white-space: nowrap;
        }

        .employee-page .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f0f2f5;
          color: #344054;
          font-size: 13px;
          vertical-align: middle;
        }

        .employee-page .data-table tbody tr:hover {
          background: #fcfcfd;
        }

        .employee-code {
          font-weight: 700;
          color: #175cd3;
        }

        .employee-name {
          font-weight: 600;
          color: #101828;
        }

        .employee-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: #f2f4f7;
          color: #475467;
        }

        .employee-status.active {
          background: #ecfdf3;
          color: #027a48;
        }

        .employee-status.inactive {
          background: #fef3f2;
          color: #b42318;
        }

        .employee-status.leave {
          background: #fffaeb;
          color: #b54708;
        }

        .employee-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .employee-action-button {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .employee-action-button:hover {
          background: #f9fafb;
        }

        .employee-action-button.delete {
          border-color: #fecdca;
          color: #b42318;
          background: #fffafa;
        }

        .employee-action-button.delete:hover {
          background: #fef3f2;
        }

        .employee-page .empty-state {
          text-align: center;
          padding: 55px 20px;
          color: #667085;
        }

        .employee-page .empty-state-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .employee-page .loading-state {
          text-align: center;
          padding: 50px 20px;
          color: #667085;
        }

        .employee-alert {
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 500;
        }

        .employee-alert.error {
          background: #fef3f2;
          border: 1px solid #fecdca;
          color: #b42318;
        }

        .employee-alert.success {
          background: #ecfdf3;
          border: 1px solid #abefc6;
          color: #027a48;
        }

        .employee-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16, 24, 40, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .employee-modal {
          width: min(760px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(16, 24, 40, 0.20);
        }

        .employee-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .employee-modal-header h2 {
          margin: 0;
          font-size: 19px;
          color: #101828;
        }

        .employee-close-button {
          width: 34px;
          height: 34px;
          border: none;
          background: #f2f4f7;
          border-radius: 7px;
          font-size: 20px;
          cursor: pointer;
          color: #475467;
        }

        .employee-form {
          padding: 22px;
        }

        .employee-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .employee-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .employee-form-group.full {
          grid-column: 1 / -1;
        }

        .employee-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #344054;
        }

        .employee-form-group label span {
          color: #d92d20;
        }

        .employee-form-group input,
        .employee-form-group select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .employee-form-hint {
          font-size: 11px;
          color: #667085;
          margin-top: 1px;
        }

        .employee-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px 20px;
          border-top: 1px solid #eaecf0;
        }

        .employee-secondary-button {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .employee-submit-button {
          border: none;
          background: #2563eb;
          color: #fff;
          border-radius: 8px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
        }

        .employee-submit-button:disabled,
        .employee-secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .delete-modal {
          width: min(440px, 100%);
          background: #fff;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(16, 24, 40, 0.20);
        }

        .delete-modal h2 {
          margin: 0 0 10px;
          color: #101828;
          font-size: 19px;
        }

        .delete-modal p {
          margin: 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.6;
        }

        .delete-modal strong {
          color: #344054;
        }

        .delete-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .delete-confirm-button {
          border: none;
          background: #d92d20;
          color: #fff;
          border-radius: 8px;
          padding: 10px 17px;
          font-weight: 600;
          cursor: pointer;
        }

        .delete-confirm-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 1000px) {
          .employee-page .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .employee-page .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .employee-page .stats-grid {
            grid-template-columns: 1fr;
          }

          .employee-form-grid {
            grid-template-columns: 1fr;
          }

          .employee-form-group.full {
            grid-column: auto;
          }

          .employee-modal-overlay {
            padding: 10px;
          }

          .employee-modal-footer {
            flex-direction: column-reverse;
          }

          .employee-modal-footer button {
            width: 100%;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>
            Manage employees and approval workflow users.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Employee
        </button>
      </div>

      {error && !showModal && (
        <div className="employee-alert error">
          {error}
        </div>
      )}

      {success && !showModal && (
        <div className="employee-alert success">
          {success}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            Total Employees
          </div>

          <div className="stat-value">
            {employees.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Active
          </div>

          <div className="stat-value">
            {activeCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            On Leave
          </div>

          <div className="stat-value">
            {leaveCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Inactive
          </div>

          <div className="stat-value">
            {inactiveCount}
          </div>
        </div>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by code, name, phone, email, department..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          {STATUS_OPTIONS.map((status) => (
            <option
              key={status.value}
              value={status.value}
            >
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h2>Employee Directory</h2>

          <span className="record-count">
            Showing {filteredEmployees.length} of{" "}
            {employees.length}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              👥
            </div>

            <h3>
              {employees.length === 0
                ? "No Employees Found"
                : "No Matching Employees"}
            </h3>

            <p>
              {employees.length === 0
                ? "Add your first employee to get started."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr key={employee.id}>
                      <td>
                        <span className="employee-code">
                          {employee.employeeCode}
                        </span>
                      </td>

                      <td>
                        <span className="employee-name">
                          {employee.firstName}{" "}
                          {employee.lastName || ""}
                        </span>
                      </td>

                      <td>
                        <div>
                          {employee.phone || "-"}
                        </div>

                        {employee.email && (
                          <div
                            style={{
                              color: "#667085",
                              marginTop: "3px",
                              fontSize: "12px",
                            }}
                          >
                            {employee.email}
                          </div>
                        )}
                      </td>

                      <td>
                        {employee.designation || "-"}
                      </td>

                      <td>
                        {employee.department || "-"}
                      </td>

                      <td>
                        {formatDate(
                          employee.joiningDate,
                        )}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            employee.status,
                          )}
                        >
                          {getStatusLabel(
                            employee.status,
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="employee-actions">
                          <button
                            type="button"
                            className="employee-action-button"
                            onClick={() =>
                              openEditModal(
                                employee,
                              )
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className="employee-action-button delete"
                            onClick={() =>
                              setDeleteEmployee(
                                employee,
                              )
                            }
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="employee-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="employee-modal">
            <div className="employee-modal-header">
              <h2>
                {editingEmployee
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <button
                type="button"
                className="employee-close-button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {error && (
              <div
                className="employee-alert error"
                style={{
                  margin:
                    "18px 22px 0",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="employee-alert success"
                style={{
                  margin:
                    "18px 22px 0",
                }}
              >
                {success}
              </div>
            )}

            <form
              className="employee-form"
              onSubmit={handleSubmit}
            >
              <div className="employee-form-grid">
                <div className="employee-form-group">
                  <label>
                    Employee Code{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="employeeCode"
                    value={form.employeeCode}
                    onChange={handleChange}
                    placeholder="EMP-001"
                    required
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    First Name{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="employee@company.com"
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Designation
                  </label>

                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Design Engineer"
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="Engineering"
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Joining Date
                  </label>

                  <input
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="employee-form-group">
                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="employee-form-group">
                  <label>
                    User ID
                  </label>

                  <input
                    type="number"
                    name="userId"
                    value={form.userId}
                    onChange={handleChange}
                    placeholder="Optional"
                    min="1"
                  />

                  <div className="employee-form-hint">
                    Login user ke saath link karna ho
                    to User ID enter karein.
                  </div>
                </div>
              </div>

              <div className="employee-modal-footer">
                <button
                  type="button"
                  className="employee-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-submit-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEmployee
                    ? "Update Employee"
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteEmployee && (
        <div
          className="employee-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !deleting
            ) {
              setDeleteEmployee(null);
            }
          }}
        >
          <div className="delete-modal">
            <h2>
              Delete Employee?
            </h2>

            <p>
              Kya aap employee{" "}
              <strong>
                {deleteEmployee.employeeCode}
              </strong>{" "}
              —{" "}
              <strong>
                {deleteEmployee.firstName}{" "}
                {deleteEmployee.lastName || ""}
              </strong>{" "}
              ko delete karna chahte hain?
              <br />
              <br />
              Agar employee kisi drawing ya project
              membership se linked hai, backend delete
              ko prevent karega.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="employee-secondary-button"
                onClick={() =>
                  setDeleteEmployee(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}