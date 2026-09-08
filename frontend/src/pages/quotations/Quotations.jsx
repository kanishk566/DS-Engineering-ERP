import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getQuotations,
  getCustomers,
  getProjects,
  updateQuotation,
  deleteQuotation,
} from "../../services/api";

import QuotationForm from "../../components/QuotationForm";

function Quotations() {
  // ============================================================
  // STATE
  // ============================================================

  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CREATE
  const [showCreateForm, setShowCreateForm] = useState(false);

  // VIEW
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // EDIT
  const [editingQuotation, setEditingQuotation] = useState(null);

  // DELETE
  const [deletingQuotation, setDeletingQuotation] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ============================================================
  // LOAD QUOTATIONS
  // ============================================================

  async function loadQuotations() {
    try {
      setLoading(true);
      setError("");

      const result = await getQuotations();

      if (result?.success) {
        setQuotations(result.data || []);
      } else {
        setQuotations([]);
        setError(
          result?.message ||
            "Failed to load quotations."
        );
      }
    } catch (err) {
      console.error(
        "FAILED TO LOAD QUOTATIONS:",
        err
      );

      setQuotations([]);

      setError(
        err?.message ||
          "Failed to load quotations."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD CUSTOMERS + PROJECTS
  // ============================================================

  async function loadRelatedData() {
    try {
      const [
        customersResult,
        projectsResult,
      ] = await Promise.all([
        getCustomers(),
        getProjects(),
      ]);

      setCustomers(
        customersResult?.data || []
      );

      setProjects(
        projectsResult?.data || []
      );
    } catch (err) {
      console.error(
        "FAILED TO LOAD RELATED DATA:",
        err
      );

      setCustomers([]);
      setProjects([]);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadQuotations();
    loadRelatedData();
  }, []);

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  function getCustomerName(quotation) {
    if (quotation?.customer?.name) {
      return quotation.customer.name;
    }

    if (quotation?.customerName) {
      return quotation.customerName;
    }

    if (quotation?.customerId) {
      const customer = customers.find(
        (item) =>
          Number(item.id) ===
          Number(quotation.customerId)
      );

      if (customer) {
        return customer.name;
      }
    }

    return "-";
  }

  // ============================================================
  // CUSTOMER CODE
  // ============================================================

  function getCustomerCode(quotation) {
    if (
      quotation?.customer?.customerCode
    ) {
      return quotation.customer.customerCode;
    }

    if (quotation?.customer?.code) {
      return quotation.customer.code;
    }

    if (quotation?.customerCode) {
      return quotation.customerCode;
    }

    if (quotation?.customerId) {
      const customer = customers.find(
        (item) =>
          Number(item.id) ===
          Number(quotation.customerId)
      );

      if (customer) {
        return (
          customer.customerCode ||
          customer.code ||
          "-"
        );
      }
    }

    return "-";
  }

  // ============================================================
  // PROJECT NAME
  // ============================================================

  function getProjectName(quotation) {
    if (quotation?.project?.name) {
      if (quotation.project.projectCode) {
        return `${quotation.project.projectCode} - ${quotation.project.name}`;
      }

      return quotation.project.name;
    }

    if (quotation?.projectName) {
      return quotation.projectName;
    }

    if (quotation?.projectId) {
      const project = projects.find(
        (item) =>
          Number(item.id) ===
          Number(quotation.projectId)
      );

      if (project) {
        if (project.projectCode) {
          return `${project.projectCode} - ${project.name}`;
        }

        return project.name;
      }
    }

    return "-";
  }

  // ============================================================
  // QUOTATION NUMBER
  // ============================================================

  function getQuotationNumber(quotation) {
    return (
      quotation?.quotationNumber ||
      quotation?.quotationNo ||
      quotation?.quotation ||
      quotation?.number ||
      "-"
    );
  }

  // ============================================================
  // QUOTATION CODE
  // ============================================================

  function getQuotationCode(quotation) {
    return (
      quotation?.quotationCode ||
      quotation?.code ||
      "-"
    );
  }

  // ============================================================
  // DATE FORMAT
  // ============================================================

  function formatDate(value) {
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
  }

  // ============================================================
  // AMOUNT FORMAT
  // ============================================================

  function formatAmount(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "₹0";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return `₹${value}`;
    }

    return `₹${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  // ============================================================
  // STATUS FORMAT
  // ============================================================

  function formatStatus(status) {
    if (!status) {
      return "Draft";
    }

    return String(status)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) => letter.toUpperCase()
      );
  }

  // ============================================================
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "draft" ||
      normalized === "rejected" ||
      normalized === "expired" ||
      normalized === "cancelled"
    ) {
      return "status-inactive";
    }

    return "status-active";
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredQuotations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return quotations;
    }

    return quotations.filter(
      (quotation) => {
        const quotationNumber =
          getQuotationNumber(quotation);

        const quotationCode =
          getQuotationCode(quotation);

        const customerName =
          getCustomerName(quotation);

        const projectName =
          getProjectName(quotation);

        const status =
          quotation.status || "";

        return (
          String(quotationNumber)
            .toLowerCase()
            .includes(query) ||

          String(quotationCode)
            .toLowerCase()
            .includes(query) ||

          String(customerName)
            .toLowerCase()
            .includes(query) ||

          String(projectName)
            .toLowerCase()
            .includes(query) ||

          String(status)
            .toLowerCase()
            .includes(query)
        );
      }
    );
  }, [
    quotations,
    customers,
    projects,
    search,
  ]);

  // ============================================================
  // CREATE
  // ============================================================

  async function handleCreateSuccess() {
    setShowCreateForm(false);

    await loadQuotations();
    await loadRelatedData();
  }

  function closeCreateForm() {
    setShowCreateForm(false);
  }

  // ============================================================
  // VIEW
  // ============================================================

  function handleViewQuotation(quotation) {
    setSelectedQuotation(quotation);
  }

  function closeQuotationDetails() {
    setSelectedQuotation(null);
  }

  // ============================================================
  // EDIT
  // ============================================================

  function handleEditQuotation(quotation) {
    setEditingQuotation(quotation);
  }

  function closeEditForm() {
    setEditingQuotation(null);
  }

  async function handleUpdateQuotation(
    quotationData
  ) {
    if (!editingQuotation?.id) {
      throw new Error(
        "Quotation ID is missing."
      );
    }

    try {
      await updateQuotation(
        editingQuotation.id,
        quotationData
      );

      setEditingQuotation(null);

      await loadQuotations();
      await loadRelatedData();
    } catch (err) {
      console.error(
        "UPDATE QUOTATION ERROR:",
        err
      );

      throw err;
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  function handleDeleteQuotation(
    quotation
  ) {
    setDeletingQuotation(quotation);
  }

  function closeDeleteModal() {
    if (deleteLoading) {
      return;
    }

    setDeletingQuotation(null);
  }

  async function confirmDeleteQuotation() {
    if (!deletingQuotation?.id) {
      return;
    }

    try {
      setDeleteLoading(true);

      await deleteQuotation(
        deletingQuotation.id
      );

      setDeletingQuotation(null);

      await loadQuotations();
      await loadRelatedData();
    } catch (err) {
      console.error(
        "DELETE QUOTATION ERROR:",
        err
      );

      alert(
        err?.message ||
          "Failed to delete quotation."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="quotations-page">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="page-header">

          <div>

            <h2>
              Quotations
            </h2>

            <p>
              Manage quotations, customers
              and quotation status.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowCreateForm(true)
            }
          >
            + Create Quotation
          </button>

        </div>

        {/* ======================================================
            DATA CARD
        ====================================================== */}

        <div className="data-card">

          <div className="data-card-header">

            <div>

              <h3>
                Quotation List
              </h3>

              <p>
                {loading
                  ? "Loading quotations..."
                  : `${filteredQuotations.length} of ${quotations.length} registered quotations`}
              </p>

            </div>

            <div className="search-box">

              <input
                type="text"
                placeholder="Search quotations..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {/* ====================================================
              ERROR
          ==================================================== */}

          {!loading && error && (

            <div className="empty-state">

              <div className="empty-state-icon">
                ⚠️
              </div>

              <h3>
                Unable to load quotations
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  loadQuotations
                }
              >
                Try Again
              </button>

            </div>

          )}

          {/* ====================================================
              LOADING
          ==================================================== */}

          {loading && (

            <div className="empty-state">

              <div className="empty-state-icon">
                ⏳
              </div>

              <h3>
                Loading quotations...
              </h3>

              <p>
                Please wait while quotation
                data is being loaded.
              </p>

            </div>

          )}

          {/* ====================================================
              TABLE
          ==================================================== */}

          {!loading && !error && (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Quotation
                    </th>

                    <th>
                      Code
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Project
                    </th>

                    <th>
                      Quotation Date
                    </th>

                    <th>
                      Total Amount
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

                  {/* EMPTY */}

                  {filteredQuotations.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan="8"
                        style={{
                          textAlign:
                            "center",
                          padding:
                            "40px",
                        }}
                      >
                        {search
                          ? "No quotations match your search."
                          : "No quotations found."}
                      </td>

                    </tr>

                  )}

                  {/* ROWS */}

                  {filteredQuotations.map(
                    (quotation) => {

                      const quotationNumber =
                        getQuotationNumber(
                          quotation
                        );

                      const quotationCode =
                        getQuotationCode(
                          quotation
                        );

                      const customerName =
                        getCustomerName(
                          quotation
                        );

                      const projectName =
                        getProjectName(
                          quotation
                        );

                      const status =
                        quotation.status ||
                        "draft";

                      return (

                        <tr
                          key={
                            quotation.id
                          }
                        >

                          {/* QUOTATION */}

                          <td>

                            <div className="table-customer">

                              <div className="table-avatar">
                                Q
                              </div>

                              <div>

                                <strong>
                                  {
                                    quotationNumber
                                  }
                                </strong>

                                <span>
                                  {quotation.description ||
                                    quotation.title ||
                                    "Quotation"}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* CODE */}

                          <td>

                            <span className="code-badge">
                              {
                                quotationCode
                              }
                            </span>

                          </td>

                          {/* CUSTOMER */}

                          <td>
                            {customerName}
                          </td>

                          {/* PROJECT */}

                          <td>
                            {projectName}
                          </td>

                          {/* DATE */}

                          <td>
                            {formatDate(
                              quotation.quotationDate ||
                                quotation.date ||
                                quotation.createdAt
                            )}
                          </td>

                          {/* TOTAL */}

                          <td>
                            {formatAmount(
                              quotation.totalAmount
                            )}
                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                status
                              )}`}
                            >
                              {formatStatus(
                                status
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
                                  handleViewQuotation(
                                    quotation
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
                                  handleEditQuotation(
                                    quotation
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
                                  handleDeleteQuotation(
                                    quotation
                                  )
                                }
                              >
                                🗑
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

          {/* ====================================================
              FOOTER
          ==================================================== */}

          {!loading && !error && (

            <div className="table-footer">

              <span>

                Showing{" "}

                <strong>
                  {filteredQuotations.length}
                </strong>{" "}

                of{" "}

                <strong>
                  {quotations.length}
                </strong>{" "}

                quotations

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

          )}

        </div>

      </div>

      {/* ========================================================
          CREATE QUOTATION MODAL
      ======================================================== */}

      {showCreateForm && (

        <QuotationForm
          quotation={null}
          isEdit={false}
          onClose={
            closeCreateForm
          }
          onSave={
            handleCreateSuccess
          }
        />

      )}

      {/* ========================================================
          EDIT QUOTATION MODAL
      ======================================================== */}

      {editingQuotation && (

        <QuotationForm
          quotation={
            editingQuotation
          }
          isEdit={true}
          onClose={
            closeEditForm
          }
          onSave={
            handleUpdateQuotation
          }
        />

      )}

      {/* ========================================================
          VIEW QUOTATION DETAILS
      ======================================================== */}

      {selectedQuotation && (

        <div
          className="quotation-details-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeQuotationDetails();
            }
          }}
        >

          <div className="quotation-details-modal">

            <div className="quotation-details-header">

              <div>

                <div className="quotation-details-title-row">

                  <h2>
                    Quotation Details
                  </h2>

                  <span
                    className={`status-badge ${getStatusClass(
                      selectedQuotation.status
                    )}`}
                  >
                    {formatStatus(
                      selectedQuotation.status
                    )}
                  </span>

                </div>

                <p>
                  Complete information for{" "}

                  <strong>
                    {
                      getQuotationNumber(
                        selectedQuotation
                      )
                    }
                  </strong>
                </p>

              </div>

              <button
                type="button"
                className="quotation-details-close"
                onClick={
                  closeQuotationDetails
                }
              >
                ×
              </button>

            </div>

            <div className="quotation-details-body">

              {/* BASIC INFORMATION */}

              <div className="quotation-details-section">

                <h3>
                  Basic Information
                </h3>

                <div className="quotation-info-grid">

                  <div className="quotation-info-item">

                    <span>
                      QUOTATION NUMBER
                    </span>

                    <strong className="quotation-number-value">
                      {
                        getQuotationNumber(
                          selectedQuotation
                        )
                      }
                    </strong>

                  </div>

                  <div className="quotation-info-item">

                    <span>
                      QUOTATION CODE
                    </span>

                    <strong>
                      {
                        getQuotationCode(
                          selectedQuotation
                        )
                      }
                    </strong>

                  </div>

                  <div className="quotation-info-item">

                    <span>
                      CUSTOMER
                    </span>

                    <strong>
                      {
                        getCustomerName(
                          selectedQuotation
                        )
                      }
                    </strong>

                    <small>
                      Code:{" "}
                      {
                        getCustomerCode(
                          selectedQuotation
                        )
                      }
                    </small>

                  </div>

                  <div className="quotation-info-item">

                    <span>
                      PROJECT
                    </span>

                    <strong>
                      {
                        getProjectName(
                          selectedQuotation
                        )
                      }
                    </strong>

                  </div>

                  <div className="quotation-info-item">

                    <span>
                      QUOTATION DATE
                    </span>

                    <strong>
                      {formatDate(
                        selectedQuotation.quotationDate ||
                          selectedQuotation.date
                      )}
                    </strong>

                  </div>

                  <div className="quotation-info-item">

                    <span>
                      VALID UNTIL
                    </span>

                    <strong>
                      {formatDate(
                        selectedQuotation.validUntil
                      )}
                    </strong>

                  </div>

                </div>

              </div>

              {/* AMOUNT DETAILS */}

              <div className="quotation-details-section">

                <h3>
                  Amount Details
                </h3>

                <div className="quotation-amount-grid">

                  <div className="quotation-amount-card">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatAmount(
                        selectedQuotation.subtotal
                      )}
                    </strong>

                  </div>

                  <div className="quotation-amount-card">

                    <span>
                      Tax Amount
                    </span>

                    <strong>
                      {formatAmount(
                        selectedQuotation.taxAmount
                      )}
                    </strong>

                  </div>

                  <div className="quotation-amount-card total">

                    <span>
                      Total Amount
                    </span>

                    <strong>
                      {formatAmount(
                        selectedQuotation.totalAmount
                      )}
                    </strong>

                  </div>

                </div>

              </div>

              {/* REMARKS */}

              <div className="quotation-details-section">

                <h3>
                  Additional Information
                </h3>

                <div className="quotation-remarks-box">

                  <span>
                    REMARKS
                  </span>

                  <p>
                    {selectedQuotation.remarks ||
                      "No remarks added."}
                  </p>

                </div>

              </div>

            </div>

            <div className="quotation-details-footer">

              <button
                type="button"
                className="quotation-details-close-button"
                onClick={
                  closeQuotationDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}

      {deletingQuotation && (

        <div
          className="quotation-delete-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >

          <div className="quotation-delete-modal">

            {/* ICON */}

            <div className="quotation-delete-icon">
              🗑
            </div>

            {/* TITLE */}

            <h2>
              Delete Quotation?
            </h2>

            {/* MESSAGE */}

            <p>
              Are you sure you want to
              delete{" "}

              <strong>
                {
                  getQuotationNumber(
                    deletingQuotation
                  )
                }
              </strong>
              ?
            </p>

            <span className="quotation-delete-warning">
              This action cannot be undone.
            </span>

            {/* BUTTONS */}

            <div className="quotation-delete-actions">

              <button
                type="button"
                className="quotation-delete-cancel"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleteLoading
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="quotation-delete-confirm"
                onClick={
                  confirmDeleteQuotation
                }
                disabled={
                  deleteLoading
                }
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          CSS
      ======================================================== */}

      <style>{`

        /* ======================================================
           VIEW MODAL
        ====================================================== */

        .quotation-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 11000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(15, 23, 42, 0.58);

          backdrop-filter:
            blur(5px);

          overflow-y: auto;
        }

        .quotation-details-modal {
          width: 100%;
          max-width: 850px;

          max-height:
            calc(100vh - 40px);

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: #ffffff;

          border-radius: 16px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.30);
        }

        .quotation-details-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding:
            24px 26px;

          border-bottom:
            1px solid #e5eaf0;
        }

        .quotation-details-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 10px;
        }

        .quotation-details-header h2 {
          margin: 0;

          color: #0f172a;

          font-size: 21px;

          font-weight: 700;
        }

        .quotation-details-header p {
          margin:
            6px 0 0;

          color: #64748b;

          font-size: 13px;
        }

        .quotation-details-header p strong {
          color: #2563eb;
        }

        .quotation-details-close {
          width: 38px;
          height: 38px;
          min-width: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #dbe3ec;

          border-radius: 9px;

          background: #ffffff;

          color: #64748b;

          font-size: 24px;

          line-height: 1;

          cursor: pointer;
        }

        .quotation-details-close:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .quotation-details-body {
          padding:
            24px 26px;

          overflow-y: auto;
        }

        .quotation-details-section {
          margin-bottom: 26px;
        }

        .quotation-details-section:last-child {
          margin-bottom: 0;
        }

        .quotation-details-section h3 {
          margin:
            0 0 14px;

          color: #0f172a;

          font-size: 14px;

          font-weight: 700;
        }

        .quotation-info-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          border:
            1px solid #dfe6ee;

          border-radius: 11px;

          overflow: hidden;
        }

        .quotation-info-item {
          min-height: 78px;

          padding:
            14px 16px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          border-right:
            1px solid #dfe6ee;

          border-bottom:
            1px solid #dfe6ee;
        }

        .quotation-info-item:nth-child(even) {
          border-right: none;
        }

        .quotation-info-item:nth-last-child(-n + 2) {
          border-bottom: none;
        }

        .quotation-info-item span {
          margin-bottom: 5px;

          color: #64748b;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 0.04em;
        }

        .quotation-info-item strong {
          color: #1e293b;

          font-size: 13px;

          line-height: 1.45;
        }

        .quotation-info-item small {
          margin-top: 3px;

          color: #94a3b8;

          font-size: 11px;
        }

        .quotation-number-value {
          color:
            #2563eb !important;
        }

        .quotation-amount-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 12px;
        }

        .quotation-amount-card {
          padding: 16px;

          border:
            1px solid #dfe6ee;

          border-radius: 11px;

          background: #ffffff;
        }

        .quotation-amount-card span {
          display: block;

          margin-bottom: 8px;

          color: #64748b;

          font-size: 11px;

          font-weight: 600;
        }

        .quotation-amount-card strong {
          color: #0f172a;

          font-size: 18px;

          font-weight: 700;
        }

        .quotation-amount-card.total {
          border-color: #bfdbfe;

          background: #eff6ff;
        }

        .quotation-amount-card.total strong {
          color: #2563eb;
        }

        .quotation-remarks-box {
          padding: 16px;

          border:
            1px solid #dfe6ee;

          border-radius: 11px;

          background: #f8fafc;
        }

        .quotation-remarks-box span {
          display: block;

          margin-bottom: 8px;

          color: #64748b;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 0.04em;
        }

        .quotation-remarks-box p {
          margin: 0;

          color: #334155;

          font-size: 13px;

          line-height: 1.6;

          white-space: pre-wrap;
        }

        .quotation-details-footer {
          display: flex;

          justify-content: flex-end;

          padding:
            15px 26px;

          border-top:
            1px solid #e5eaf0;

          background: #ffffff;
        }

        .quotation-details-close-button {
          height: 40px;

          padding:
            0 20px;

          border:
            1px solid #d6dee8;

          border-radius: 9px;

          background: #ffffff;

          color: #334155;

          font-family: inherit;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;
        }

        .quotation-details-close-button:hover {
          background: #f8fafc;
        }

        /* ======================================================
           DELETE MODAL
        ====================================================== */

        .quotation-delete-overlay {
          position: fixed;
          inset: 0;

          z-index: 12000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(15, 23, 42, 0.60);

          backdrop-filter:
            blur(5px);
        }

        .quotation-delete-modal {
          width: 100%;
          max-width: 420px;

          padding: 28px;

          text-align: center;

          background: #ffffff;

          border-radius: 16px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.30);
        }

        .quotation-delete-icon {
          width: 56px;
          height: 56px;

          margin:
            0 auto 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #fff1f2;

          color: #ef4444;

          font-size: 23px;
        }

        .quotation-delete-modal h2 {
          margin:
            0 0 10px;

          color: #0f172a;

          font-size: 20px;

          font-weight: 700;
        }

        .quotation-delete-modal p {
          margin: 0;

          color: #64748b;

          font-size: 13px;

          line-height: 1.6;
        }

        .quotation-delete-modal p strong {
          color: #0f172a;
        }

        .quotation-delete-warning {
          display: block;

          margin-top: 8px;

          color: #ef4444;

          font-size: 12px;

          font-weight: 600;
        }

        .quotation-delete-actions {
          display: flex;

          justify-content: center;

          gap: 10px;

          margin-top: 24px;
        }

        .quotation-delete-cancel,
        .quotation-delete-confirm {
          min-width: 76px;

          height: 40px;

          padding:
            0 18px;

          border-radius: 8px;

          font-family: inherit;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;
        }

        .quotation-delete-cancel {
          border:
            1px solid #d6dee8;

          background: #ffffff;

          color: #334155;
        }

        .quotation-delete-cancel:hover {
          background: #f8fafc;
        }

        .quotation-delete-confirm {
          border: none;

          background: #ef2929;

          color: #ffffff;
        }

        .quotation-delete-confirm:hover {
          background: #dc2626;
        }

        .quotation-delete-cancel:disabled,
        .quotation-delete-confirm:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }

        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 700px) {

          .quotation-details-overlay {
            padding: 10px;

            align-items: flex-start;
          }

          .quotation-details-modal {
            max-height:
              calc(100vh - 20px);

            border-radius: 12px;
          }

          .quotation-details-header {
            padding: 18px;
          }

          .quotation-details-body {
            padding: 18px;
          }

          .quotation-details-footer {
            padding:
              14px 18px;
          }

          .quotation-info-grid {
            grid-template-columns: 1fr;
          }

          .quotation-info-item {
            border-right: none;

            border-bottom:
              1px solid #dfe6ee !important;
          }

          .quotation-info-item:last-child {
            border-bottom:
              none !important;
          }

          .quotation-amount-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 500px) {

          .quotation-delete-modal {
            padding: 22px;

            border-radius: 13px;
          }

          .quotation-delete-actions {
            flex-direction: column;
          }

          .quotation-delete-cancel,
          .quotation-delete-confirm {
            width: 100%;
          }

        }

      `}</style>
    </>
  );
}

export default Quotations;