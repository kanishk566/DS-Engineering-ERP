import { useEffect, useMemo, useState } from "react";

import "./Attendance.css";

const API_BASE_URL = "https://ds-engineering-erp.onrender.com/api";

const STATUS_OPTIONS = [
  {
    value: "present",
    label: "Present",
    icon: "✓",
  },
  {
    value: "absent",
    label: "Absent",
    icon: "✕",
  },
  {
    value: "half_day",
    label: "Half Day",
    icon: "½",
  },
  {
    value: "leave",
    label: "Leave",
    icon: "L",
  },
];

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
  return getToday().slice(0, 7);
}

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt")
  );
}

function getEmployeeName(employee) {
  return `${employee.firstName || ""}${
    employee.lastName ? ` ${employee.lastName}` : ""
  }`.trim();
}

function Attendance() {
  const [employees, setEmployees] = useState([]);

  const [attendanceDate, setAttendanceDate] =
    useState(getToday());

  const [selectedEmployee, setSelectedEmployee] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("present");

  const [dailyAttendance, setDailyAttendance] =
    useState([]);

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [monthlyReport, setMonthlyReport] =
    useState([]);

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [loadingDaily, setLoadingDaily] =
    useState(false);

  const [loadingMonthly, setLoadingMonthly] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  // ============================================================
  // API HELPER
  // ============================================================

  async function apiRequest(url, options = {}) {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong"
      );
    }

    return data;
  }

  // ============================================================
  // LOAD EMPLOYEES
  // ============================================================

  async function loadEmployees() {
    try {
      setLoadingEmployees(true);
      setError("");

      const response = await apiRequest(
        `${API_BASE_URL}/employees`
      );

      setEmployees(response.data || []);

      if (
        response.data &&
        response.data.length > 0 &&
        !selectedEmployee
      ) {
        setSelectedEmployee(
          String(response.data[0].id)
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load employees"
      );
    } finally {
      setLoadingEmployees(false);
    }
  }

  // ============================================================
  // LOAD DAILY ATTENDANCE
  // ============================================================

  async function loadDailyAttendance() {
    try {
      setLoadingDaily(true);

      const response = await apiRequest(
        `${API_BASE_URL}/attendance?date=${attendanceDate}`
      );

      setDailyAttendance(response.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load daily attendance"
      );
    } finally {
      setLoadingDaily(false);
    }
  }

  // ============================================================
  // LOAD MONTHLY REPORT
  // ============================================================

  async function loadMonthlyReport() {
    try {
      setLoadingMonthly(true);

      const response = await apiRequest(
        `${API_BASE_URL}/attendance/monthly/report?month=${selectedMonth}`
      );

      setMonthlyReport(response.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load monthly attendance"
      );
    } finally {
      setLoadingMonthly(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!loadingEmployees) {
      loadDailyAttendance();
    }
  }, [attendanceDate, loadingEmployees]);

  useEffect(() => {
    loadMonthlyReport();
  }, [selectedMonth]);

  // ============================================================
  // EMPLOYEE MAP
  // ============================================================

  const employeeMap = useMemo(() => {
    const map = {};

    employees.forEach((employee) => {
      map[employee.id] = employee;
    });

    return map;
  }, [employees]);

  // ============================================================
  // DAILY SUMMARY
  // ============================================================

  const dailySummary = useMemo(() => {
    return {
      present: dailyAttendance.filter(
        (item) => item.status === "present"
      ).length,

      absent: dailyAttendance.filter(
        (item) => item.status === "absent"
      ).length,

      halfDay: dailyAttendance.filter(
        (item) => item.status === "half_day"
      ).length,

      leave: dailyAttendance.filter(
        (item) => item.status === "leave"
      ).length,
    };
  }, [dailyAttendance]);

  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  // ============================================================
  // MARK ATTENDANCE
  // ============================================================

  async function handleSaveAttendance(event) {
    event.preventDefault();

    clearMessages();

    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    if (!attendanceDate) {
      setError("Please select a date.");
      return;
    }

    if (!selectedStatus) {
      setError("Please select attendance status.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await apiRequest(
          `${API_BASE_URL}/attendance/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              employeeId: Number(
                selectedEmployee
              ),
              date: attendanceDate,
              status: selectedStatus,
            }),
          }
        );

        setSuccess(
          "Attendance updated successfully."
        );
      } else {
        await apiRequest(
          `${API_BASE_URL}/attendance`,
          {
            method: "POST",
            body: JSON.stringify({
              employeeId: Number(
                selectedEmployee
              ),
              date: attendanceDate,
              status: selectedStatus,
            }),
          }
        );

        setSuccess(
          "Attendance marked successfully."
        );
      }

      setEditingId(null);

      await loadDailyAttendance();
      await loadMonthlyReport();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // EDIT ATTENDANCE
  // ============================================================

  function handleEdit(record) {
    setEditingId(record.id);

    setSelectedEmployee(
      String(record.employeeId)
    );

    setSelectedStatus(record.status);

    if (record.date) {
      setAttendanceDate(
        String(record.date).slice(0, 10)
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  function handleCancelEdit() {
    setEditingId(null);
    setSelectedStatus("present");
  }

  // ============================================================
  // DELETE ATTENDANCE
  // ============================================================

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      await apiRequest(
        `${API_BASE_URL}/attendance/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Attendance deleted successfully."
      );

      await loadDailyAttendance();
      await loadMonthlyReport();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to delete attendance."
      );
    }
  }

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  function getStatusLabel(status) {
    const option = STATUS_OPTIONS.find(
      (item) => item.value === status
    );

    return option
      ? option.label
      : status;
  }

  function getStatusClass(status) {
    return `attendance-status attendance-status-${status}`;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="attendance-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="attendance-page-header">

        <div>
          <div className="attendance-eyebrow">
            HR MANAGEMENT
          </div>

          <h1>
            Attendance
          </h1>

          <p>
            Manage daily employee attendance
            and monthly performance.
          </p>
        </div>

        <div className="attendance-header-icon">
          <span>✓</span>
        </div>

      </div>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {error && (
        <div className="attendance-alert attendance-alert-error">
          <span>⚠</span>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="attendance-alert attendance-alert-success">
          <span>✓</span>
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}


      {/* ======================================================
          DAILY ATTENDANCE
      ====================================================== */}

      <section className="attendance-card">

        <div className="attendance-card-header">

          <div>
            <h2>
              {editingId
                ? "Update Attendance"
                : "Mark Attendance"}
            </h2>

            <p>
              Select employee, date and
              attendance status.
            </p>
          </div>

          <div className="attendance-date-badge">
            {attendanceDate}
          </div>

        </div>


        <form
          onSubmit={handleSaveAttendance}
          className="attendance-form"
        >

          {/* EMPLOYEE */}

          <div className="attendance-field">

            <label>
              Employee
            </label>

            <select
              value={selectedEmployee}
              onChange={(event) =>
                setSelectedEmployee(
                  event.target.value
                )
              }
              disabled={
                loadingEmployees || saving
              }
            >
              <option value="">
                Select Employee
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employeeCode
                    ? `${employee.employeeCode} - `
                    : ""}
                  {getEmployeeName(employee)}
                </option>
              ))}
            </select>

          </div>


          {/* DATE */}

          <div className="attendance-field">

            <label>
              Attendance Date
            </label>

            <input
              type="date"
              value={attendanceDate}
              onChange={(event) =>
                setAttendanceDate(
                  event.target.value
                )
              }
              disabled={saving}
            />

          </div>


          {/* STATUS */}

          <div className="attendance-status-section">

            <label>
              Attendance Status
            </label>

            <div className="attendance-status-options">

              {STATUS_OPTIONS.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`attendance-status-option ${
                      selectedStatus ===
                      option.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedStatus(
                        option.value
                      )
                    }
                    disabled={saving}
                  >

                    <span className="attendance-status-icon">
                      {option.icon}
                    </span>

                    <span>
                      {option.label}
                    </span>

                  </button>
                )
              )}

            </div>

          </div>


          {/* ACTIONS */}

          <div className="attendance-form-actions">

            {editingId && (
              <button
                type="button"
                className="attendance-btn attendance-btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="attendance-btn attendance-btn-primary"
              disabled={
                saving ||
                loadingEmployees
              }
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Attendance"
                : "Mark Attendance"}
            </button>

          </div>

        </form>

      </section>


      {/* ======================================================
          DAILY SUMMARY
      ====================================================== */}

      <section className="attendance-summary-grid">

        <div className="attendance-summary-card">
          <div className="summary-icon present">
            ✓
          </div>

          <div>
            <span>
              Present
            </span>

            <strong>
              {dailySummary.present}
            </strong>
          </div>
        </div>


        <div className="attendance-summary-card">
          <div className="summary-icon absent">
            ✕
          </div>

          <div>
            <span>
              Absent
            </span>

            <strong>
              {dailySummary.absent}
            </strong>
          </div>
        </div>


        <div className="attendance-summary-card">
          <div className="summary-icon half">
            ½
          </div>

          <div>
            <span>
              Half Day
            </span>

            <strong>
              {dailySummary.halfDay}
            </strong>
          </div>
        </div>


        <div className="attendance-summary-card">
          <div className="summary-icon leave">
            L
          </div>

          <div>
            <span>
              Leave
            </span>

            <strong>
              {dailySummary.leave}
            </strong>
          </div>
        </div>

      </section>


      {/* ======================================================
          DAILY RECORDS
      ====================================================== */}

      <section className="attendance-card">

        <div className="attendance-card-header">

          <div>
            <h2>
              Daily Attendance
            </h2>

            <p>
              Attendance records for{" "}
              {attendanceDate}
            </p>
          </div>

          <button
            type="button"
            className="attendance-refresh-btn"
            onClick={loadDailyAttendance}
            disabled={loadingDaily}
          >
            {loadingDaily
              ? "Loading..."
              : "↻ Refresh"}
          </button>

        </div>


        {loadingDaily ? (
          <div className="attendance-empty">
            Loading attendance...
          </div>
        ) : dailyAttendance.length ===
          0 ? (
          <div className="attendance-empty">
            <div className="attendance-empty-icon">
              📅
            </div>

            <h3>
              No attendance marked
            </h3>

            <p>
              No attendance records found
              for this date.
            </p>
          </div>
        ) : (
          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>
                <tr>
                  <th>
                    Employee
                  </th>

                  <th>
                    Employee Code
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {dailyAttendance.map(
                  (record) => {

                    const employee =
                      employeeMap[
                        record.employeeId
                      ];

                    return (
                      <tr
                        key={record.id}
                      >

                        <td>
                          <div className="employee-cell">

                            <div className="employee-avatar">
                              {employee
                                ? employee.firstName
                                    ?.charAt(0)
                                    ?.toUpperCase()
                                : "E"}
                            </div>

                            <div>
                              <strong>
                                {employee
                                  ? getEmployeeName(
                                      employee
                                    )
                                  : `Employee #${record.employeeId}`}
                              </strong>
                            </div>

                          </div>
                        </td>

                        <td>
                          {employee?.employeeCode ||
                            "-"}
                        </td>

                        <td>
                          {String(
                            record.date
                          ).slice(0, 10)}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              record.status
                            )}
                          >
                            {getStatusLabel(
                              record.status
                            )}
                          </span>
                        </td>

                        <td>

                          <div className="attendance-actions">

                            <button
                              type="button"
                              className="table-action edit"
                              onClick={() =>
                                handleEdit(
                                  record
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="table-action delete"
                              onClick={() =>
                                handleDelete(
                                  record.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* ======================================================
          MONTHLY REPORT
      ====================================================== */}

      <section className="attendance-card monthly-card">

        <div className="attendance-card-header">

          <div>
            <h2>
              Monthly Attendance
            </h2>

            <p>
              Employee-wise attendance
              performance.
            </p>
          </div>

          <div className="monthly-selector">

            <label>
              Month
            </label>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {loadingMonthly ? (
          <div className="attendance-empty">
            Loading monthly report...
          </div>
        ) : monthlyReport.length ===
          0 ? (
          <div className="attendance-empty">
            <div className="attendance-empty-icon">
              📊
            </div>

            <h3>
              No employees found
            </h3>

            <p>
              There are no employees available
              for this report.
            </p>
          </div>
        ) : (
          <div className="monthly-report-list">

            {monthlyReport.map(
              (employee) => {

                const percentage =
                  Number(
                    employee.attendancePercentage ||
                      0
                  );

                return (
                  <div
                    className="monthly-employee-row"
                    key={
                      employee.employeeId
                    }
                  >

                    <div className="monthly-employee-info">

                      <div className="employee-avatar">
                        {employee.employeeName
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "E"}
                      </div>

                      <div>

                        <strong>
                          {
                            employee.employeeName
                          }
                        </strong>

                        <span>
                          {
                            employee.employeeCode
                          }
                        </span>

                      </div>

                    </div>


                    <div className="monthly-counts">

                      <span className="count present">
                        P{" "}
                        {employee.present}
                      </span>

                      <span className="count absent">
                        A{" "}
                        {employee.absent}
                      </span>

                      <span className="count half">
                        H{" "}
                        {employee.halfDay}
                      </span>

                      <span className="count leave">
                        L{" "}
                        {employee.leave}
                      </span>

                    </div>


                    <div className="monthly-progress-area">

                      <div className="monthly-progress-header">

                        <span>
                          Attendance
                        </span>

                        <strong>
                          {percentage}%
                        </strong>

                      </div>

                      <div className="monthly-progress">

                        <div
                          className="monthly-progress-bar"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                percentage,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <small>
                        {
                          employee.totalMarkedDays
                        }{" "}
                        marked days
                      </small>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Attendance;