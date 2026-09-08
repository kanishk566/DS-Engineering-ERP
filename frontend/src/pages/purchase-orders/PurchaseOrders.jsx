import { useEffect, useMemo, useState } from "react";

import {
  getPurchaseOrders,
  getVendors,
  getProjects,
  deletePurchaseOrder,
} from "../../services/api";

import PurchaseOrderForm from "../../components/PurchaseOrderForm";

function PurchaseOrders() {
  // ============================================================
  // STATE
  // ============================================================

  const [purchaseOrders, setPurchaseOrders] =
    useState([]);

  const [vendors, setVendors] =
    useState([]);

  const [projects, setProjects] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // CREATE
  const [showCreateForm, setShowCreateForm] =
    useState(false);

  // VIEW
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState(null);

  const [showViewModal, setShowViewModal] =
    useState(false);

  // EDIT
  const [editingPurchaseOrder, setEditingPurchaseOrder] =
    useState(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  // DELETE
  const [deletingPurchaseOrder, setDeletingPurchaseOrder] =
    useState(null);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ============================================================
  // LOAD PURCHASE ORDERS
  // ============================================================

  async function loadPurchaseOrders() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getPurchaseOrders();

      if (result?.success) {
        setPurchaseOrders(
          result.data || []
        );
      } else {
        setPurchaseOrders([]);

        setError(
          result?.message ||
            "Failed to load purchase orders."
        );
      }
    } catch (err) {
      console.error(
        "Failed to load purchase orders:",
        err
      );

      setError(
        err?.message ||
          "Failed to load purchase orders."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD VENDORS + PROJECTS
  // ============================================================

  async function loadRelatedData() {
    try {
      const [
        vendorsResult,
        projectsResult,
      ] = await Promise.all([
        getVendors(),
        getProjects(),
      ]);

      setVendors(
        vendorsResult?.data || []
      );

      setProjects(
        projectsResult?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load vendor/project data:",
        err
      );

      setVendors([]);
      setProjects([]);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadPurchaseOrders();
    loadRelatedData();
  }, []);

  // ============================================================
  // GET VENDOR NAME
  // ============================================================

  function getVendorName(
    purchaseOrder
  ) {
    if (
      purchaseOrder?.vendor?.name
    ) {
      return purchaseOrder.vendor.name;
    }

    if (
      purchaseOrder?.vendorName
    ) {
      return purchaseOrder.vendorName;
    }

    if (
      purchaseOrder?.vendorId
    ) {
      const vendor =
        vendors.find(
          (item) =>
            Number(item.id) ===
            Number(
              purchaseOrder.vendorId
            )
        );

      if (vendor) {
        return vendor.name;
      }
    }

    return "-";
  }

  // ============================================================
  // GET PROJECT NAME
  // ============================================================

  function getProjectName(
    purchaseOrder
  ) {
    if (
      purchaseOrder?.project?.name
    ) {
      return purchaseOrder.project.projectCode
        ? `${purchaseOrder.project.projectCode} - ${purchaseOrder.project.name}`
        : purchaseOrder.project.name;
    }

    if (
      purchaseOrder?.projectName
    ) {
      return purchaseOrder.projectName;
    }

    if (
      purchaseOrder?.projectId
    ) {
      const project =
        projects.find(
          (item) =>
            Number(item.id) ===
            Number(
              purchaseOrder.projectId
            )
        );

      if (project) {
        return project.projectCode
          ? `${project.projectCode} - ${project.name}`
          : project.name;
      }
    }

    return "-";
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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
  // FORMAT AMOUNT
  // ============================================================

  function formatAmount(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "₹0";
    }

    const amount =
      Number(value);

    if (
      Number.isNaN(amount)
    ) {
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
  // FORMAT STATUS
  // ============================================================

  function formatStatus(status) {
    if (!status) {
      return "Draft";
    }

    return String(status)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  // ============================================================
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    const normalized =
      String(status || "")
        .toLowerCase();

    if (
      normalized === "received" ||
      normalized === "completed" ||
      normalized === "cancelled"
    ) {
      return "status-inactive";
    }

    return "status-active";
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredPurchaseOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return purchaseOrders;
      }

      return purchaseOrders.filter(
        (purchaseOrder) => {
          const poNumber =
            purchaseOrder.poNumber ||
            "";

          const vendorName =
            getVendorName(
              purchaseOrder
            );

          const projectName =
            getProjectName(
              purchaseOrder
            );

          const status =
            purchaseOrder.status ||
            "";

          const remarks =
            purchaseOrder.remarks ||
            "";

          return (
            String(poNumber)
              .toLowerCase()
              .includes(query) ||

            String(vendorName)
              .toLowerCase()
              .includes(query) ||

            String(projectName)
              .toLowerCase()
              .includes(query) ||

            String(status)
              .toLowerCase()
              .includes(query) ||

            String(remarks)
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      purchaseOrders,
      search,
      vendors,
      projects,
    ]);

  // ============================================================
  // CREATE
  // ============================================================

  async function handleCreateSuccess() {
    setShowCreateForm(false);

    await loadPurchaseOrders();
    await loadRelatedData();
  }

  // ============================================================
  // VIEW
  // ============================================================

  function handleView(
    purchaseOrder
  ) {
    setSelectedPurchaseOrder(
      purchaseOrder
    );

    setShowViewModal(true);
  }

  function closeViewModal() {
    setShowViewModal(false);
    setSelectedPurchaseOrder(null);
  }

  // ============================================================
  // EDIT
  // ============================================================

  function handleEdit(
    purchaseOrder
  ) {
    setEditingPurchaseOrder(
      purchaseOrder
    );

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingPurchaseOrder(null);
  }

  async function handleEditSuccess() {
    closeEditModal();

    await loadPurchaseOrders();
    await loadRelatedData();
  }

  // ============================================================
  // DELETE
  // ============================================================

  function handleDelete(
    purchaseOrder
  ) {
    setDeletingPurchaseOrder(
      purchaseOrder
    );

    setShowDeleteModal(true);

    setError("");
  }

  function closeDeleteModal() {
    if (deleteLoading) {
      return;
    }

    setShowDeleteModal(false);
    setDeletingPurchaseOrder(null);
  }

  async function confirmDelete() {
    if (
      !deletingPurchaseOrder?.id
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      await deletePurchaseOrder(
        deletingPurchaseOrder.id
      );

      setShowDeleteModal(false);
      setDeletingPurchaseOrder(null);

      await loadPurchaseOrders();
      await loadRelatedData();

    } catch (err) {
      console.error(
        "DELETE PURCHASE ORDER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete purchase order."
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
      {/* ========================================================
          VIEW MODAL CSS
      ======================================================== */}

      <style>{`

        /* ======================================================
           VIEW OVERLAY
        ====================================================== */

        .po-view-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(15, 23, 42, 0.58);

          backdrop-filter:
            blur(4px);

          overflow-y: auto;
        }

        /* ======================================================
           VIEW MODAL
        ====================================================== */

        .po-view-modal {
          width: 100%;
          max-width: 760px;

          max-height:
            calc(100vh - 40px);

          display: flex;
          flex-direction: column;

          background:
            #ffffff;

          border-radius:
            16px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.28);

          overflow: hidden;
        }

        /* ======================================================
           VIEW HEADER
        ====================================================== */

        .po-view-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding:
            22px 26px;

          border-bottom:
            1px solid #e8edf3;
        }

        .po-view-header-content {
          min-width: 0;
        }

        .po-view-title-row {
          display: flex;
          align-items: center;

          gap: 12px;

          margin-bottom:
            5px;
        }

        .po-view-title {
          margin: 0;

          color:
            #0f172a;

          font-size:
            21px;

          font-weight:
            700;
        }

        .po-view-subtitle {
          margin: 0;

          color:
            #64748b;

          font-size:
            13px;
        }

        .po-view-close {
          width: 36px;
          height: 36px;

          min-width: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #dbe3ec;

          border-radius:
            9px;

          background:
            #ffffff;

          color:
            #64748b;

          font-size:
            22px;

          line-height:
            1;

          cursor:
            pointer;

          transition:
            all 0.2s ease;
        }

        .po-view-close:hover {
          background:
            #f8fafc;

          border-color:
            #cbd5e1;

          color:
            #0f172a;
        }

        /* ======================================================
           VIEW BODY
        ====================================================== */

        .po-view-body {
          padding:
            24px 26px;

          overflow-y: auto;
        }

        .po-view-section {
          margin-bottom:
            24px;
        }

        .po-view-section:last-child {
          margin-bottom:
            0;
        }

        .po-view-section-title {
          margin:
            0 0 14px;

          color:
            #0f172a;

          font-size:
            14px;

          font-weight:
            700;
        }

        /* ======================================================
           BASIC INFO GRID
        ====================================================== */

        .po-view-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            1px;

          overflow: hidden;

          border:
            1px solid #e5eaf0;

          border-radius:
            10px;

          background:
            #e5eaf0;
        }

        .po-view-item {
          padding:
            14px 16px;

          background:
            #ffffff;
        }

        .po-view-label {
          display: block;

          margin-bottom:
            5px;

          color:
            #64748b;

          font-size:
            11px;

          font-weight:
            600;

          text-transform:
            uppercase;

          letter-spacing:
            0.04em;
        }

        .po-view-value {
          display: block;

          color:
            #0f172a;

          font-size:
            14px;

          font-weight:
            600;

          word-break:
            break-word;
        }

        .po-view-po-number {
          color:
            #2563eb;

          font-size:
            15px;

          font-weight:
            700;
        }

        /* ======================================================
           STATUS
        ====================================================== */

        .po-view-status {
          display: inline-flex;

          align-items: center;

          padding:
            5px 10px;

          border-radius:
            999px;

          font-size:
            12px;

          font-weight:
            600;
        }

        .po-view-status.status-active {
          background:
            #ecfdf3;

          color:
            #15803d;
        }

        .po-view-status.status-inactive {
          background:
            #f1f5f9;

          color:
            #64748b;
        }

        /* ======================================================
           AMOUNTS
        ====================================================== */

        .po-view-amount-grid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap:
            14px;
        }

        .po-view-amount-card {
          padding:
            16px;

          border:
            1px solid #e5eaf0;

          border-radius:
            10px;

          background:
            #ffffff;
        }

        .po-view-amount-card.total {
          border-color:
            #bfdbfe;

          background:
            #eff6ff;
        }

        .po-view-amount-label {
          margin-bottom:
            7px;

          color:
            #64748b;

          font-size:
            12px;

          font-weight:
            600;
        }

        .po-view-amount-value {
          color:
            #0f172a;

          font-size:
            17px;

          font-weight:
            700;
        }

        .po-view-amount-card.total
        .po-view-amount-value {
          color:
            #1d4ed8;
        }

        /* ======================================================
           REMARKS
        ====================================================== */

        .po-view-remarks {
          min-height:
            80px;

          padding:
            14px 16px;

          border:
            1px solid #e5eaf0;

          border-radius:
            10px;

          background:
            #f8fafc;

          color:
            #475569;

          font-size:
            13px;

          line-height:
            1.6;

          white-space:
            pre-wrap;

          word-break:
            break-word;
        }

        /* ======================================================
           VIEW FOOTER
        ====================================================== */

        .po-view-footer {
          display: flex;

          justify-content:
            flex-end;

          padding:
            16px 26px;

          border-top:
            1px solid #e8edf3;

          background:
            #ffffff;
        }

        .po-view-footer-button {
          height:
            40px;

          padding:
            0 18px;

          border:
            1px solid #d6dee8;

          border-radius:
            8px;

          background:
            #ffffff;

          color:
            #334155;

          font-family:
            inherit;

          font-size:
            13px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            all 0.2s ease;
        }

        .po-view-footer-button:hover {
          background:
            #f8fafc;

          border-color:
            #cbd5e1;
        }

        /* ======================================================
           DELETE OVERLAY
        ====================================================== */

        .po-delete-overlay {
          position: fixed;
          inset: 0;
          z-index: 11000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            20px;

          background:
            rgba(15, 23, 42, 0.60);

          backdrop-filter:
            blur(4px);
        }

        /* ======================================================
           DELETE MODAL
        ====================================================== */

        .po-delete-modal {
          width: 100%;
          max-width:
            420px;

          padding:
            28px;

          text-align:
            center;

          background:
            #ffffff;

          border-radius:
            16px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.28);
        }

        .po-delete-icon {
          width:
            54px;

          height:
            54px;

          margin:
            0 auto 16px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #fff1f2;

          color:
            #dc2626;

          font-size:
            22px;
        }

        .po-delete-modal h2 {
          margin:
            0 0 8px;

          color:
            #0f172a;

          font-size:
            19px;

          font-weight:
            700;
        }

        .po-delete-modal p {
          margin:
            0;

          color:
            #64748b;

          font-size:
            13px;

          line-height:
            1.6;
        }

        .po-delete-modal p strong {
          color:
            #0f172a;
        }

        .po-delete-warning {
          display:
            block;

          margin-top:
            8px;

          color:
            #be123c;

          font-size:
            12px;

          font-weight:
            500;
        }

        /* ======================================================
           DELETE ACTIONS
        ====================================================== */

        .po-delete-actions {
          display:
            flex;

          justify-content:
            center;

          gap:
            10px;

          margin-top:
            24px;
        }

        .po-delete-cancel,
        .po-delete-confirm {
          height:
            40px;

          padding:
            0 18px;

          border-radius:
            8px;

          font-family:
            inherit;

          font-size:
            13px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            all 0.2s ease;
        }

        .po-delete-cancel {
          border:
            1px solid #d6dee8;

          background:
            #ffffff;

          color:
            #334155;
        }

        .po-delete-cancel:hover {
          background:
            #f8fafc;

          border-color:
            #cbd5e1;
        }

        .po-delete-confirm {
          border:
            1px solid #dc2626;

          background:
            #dc2626;

          color:
            #ffffff;
        }

        .po-delete-confirm:hover {
          background:
            #b91c1c;

          border-color:
            #b91c1c;
        }

        .po-delete-cancel:disabled,
        .po-delete-confirm:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;
        }

        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 650px) {

          .po-view-overlay {
            padding:
              10px;

            align-items:
              flex-start;
          }

          .po-view-modal {
            max-height:
              calc(100vh - 20px);

            border-radius:
              12px;
          }

          .po-view-header {
            padding:
              18px;
          }

          .po-view-body {
            padding:
              18px;
          }

          .po-view-footer {
            padding:
              15px 18px;
          }

          .po-view-grid {
            grid-template-columns:
              1fr;
          }

          .po-view-amount-grid {
            grid-template-columns:
              1fr;
          }

          .po-view-title {
            font-size:
              18px;
          }

          .po-delete-modal {
            padding:
              24px;
          }
        }

      `}</style>

      {/* ========================================================
          PURCHASE ORDERS PAGE
      ======================================================== */}

      <div className="purchase-orders-page">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="page-header">

          <div>

            <h2>
              Purchase Orders
            </h2>

            <p>
              Manage purchase orders, vendors
              and order status.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowCreateForm(true)
            }
          >
            + Create Purchase Order
          </button>

        </div>

        {/* ======================================================
            DATA CARD
        ====================================================== */}

        <div className="data-card">

          <div className="data-card-header">

            <div>

              <h3>
                Purchase Order List
              </h3>

              <p>
                {loading
                  ? "Loading purchase orders..."
                  : `${filteredPurchaseOrders.length} of ${purchaseOrders.length} registered purchase orders`}
              </p>

            </div>

            <div className="search-box">

              <input
                type="text"
                placeholder="Search purchase orders..."
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

          {!loading &&
            error && (

              <div className="empty-state">

                <div className="empty-state-icon">
                  ⚠️
                </div>

                <h3>
                  Unable to load purchase orders
                </h3>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    loadPurchaseOrders
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
                Loading purchase orders...
              </h3>

              <p>
                Please wait while purchase
                order data is being loaded.
              </p>

            </div>

          )}

          {/* ====================================================
              TABLE
          ==================================================== */}

          {!loading &&
            !error && (

              <div className="table-wrapper">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        PO Number
                      </th>

                      <th>
                        Vendor
                      </th>

                      <th>
                        Order Date
                      </th>

                      <th>
                        Expected Delivery
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

                    {filteredPurchaseOrders.length ===
                      0 && (

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
                            ? "No purchase orders match your search."
                            : "No purchase orders found."}
                        </td>

                      </tr>

                    )}

                    {/* PURCHASE ORDER ROWS */}

                    {filteredPurchaseOrders.map(
                      (purchaseOrder) => {

                        const poNumber =
                          purchaseOrder.poNumber ||
                          "-";

                        const vendorName =
                          getVendorName(
                            purchaseOrder
                          );

                        const status =
                          purchaseOrder.status ||
                          "draft";

                        return (

                          <tr
                            key={
                              purchaseOrder.id
                            }
                          >

                            {/* PO NUMBER */}

                            <td>

                              <div className="table-customer">

                                <div className="table-avatar">
                                  P
                                </div>

                                <div>

                                  <strong>
                                    {poNumber}
                                  </strong>

                                  <span>
                                    {purchaseOrder.remarks ||
                                      "Purchase Order"}
                                  </span>

                                </div>

                              </div>

                            </td>

                            {/* VENDOR */}

                            <td>
                              {vendorName}
                            </td>

                            {/* ORDER DATE */}

                            <td>
                              {formatDate(
                                purchaseOrder.orderDate
                              )}
                            </td>

                            {/* EXPECTED DELIVERY */}

                            <td>
                              {formatDate(
                                purchaseOrder.expectedDate ||
                                  purchaseOrder.expectedDelivery
                              )}
                            </td>

                            {/* TOTAL AMOUNT */}

                            <td>
                              {formatAmount(
                                purchaseOrder.totalAmount
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
                                  title="View Purchase Order"
                                  onClick={() =>
                                    handleView(
                                      purchaseOrder
                                    )
                                  }
                                >
                                  👁
                                </button>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="action-button edit"
                                  title="Edit Purchase Order"
                                  onClick={() =>
                                    handleEdit(
                                      purchaseOrder
                                    )
                                  }
                                >
                                  ✏
                                </button>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="action-button delete"
                                  title="Delete Purchase Order"
                                  onClick={() =>
                                    handleDelete(
                                      purchaseOrder
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

          {!loading &&
            !error && (

              <div className="table-footer">

                <span>
                  Showing{" "}
                  <strong>
                    {filteredPurchaseOrders.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {purchaseOrders.length}
                  </strong>{" "}
                  purchase orders
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

        {/* ======================================================
            CREATE PURCHASE ORDER
        ====================================================== */}

        {showCreateForm && (

          <PurchaseOrderForm
            purchaseOrders={
              purchaseOrders
            }

            purchaseOrder={null}

            isEdit={false}

            onClose={() =>
              setShowCreateForm(false)
            }

            onSave={
              handleCreateSuccess
            }

            loading={false}
          />

        )}

      </div>

      {/* ========================================================
          VIEW PURCHASE ORDER MODAL
      ======================================================== */}

      {showViewModal &&
        selectedPurchaseOrder && (

          <div
            className="po-view-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeViewModal();
              }

            }}
          >

            <div className="po-view-modal">

              {/* VIEW HEADER */}

              <div className="po-view-header">

                <div className="po-view-header-content">

                  <div className="po-view-title-row">

                    <h2 className="po-view-title">
                      Purchase Order Details
                    </h2>

                    <span
                      className={`po-view-status ${getStatusClass(
                        selectedPurchaseOrder.status
                      )}`}
                    >
                      {formatStatus(
                        selectedPurchaseOrder.status
                      )}
                    </span>

                  </div>

                  <p className="po-view-subtitle">
                    Complete information for{" "}
                    <strong>
                      {selectedPurchaseOrder.poNumber ||
                        "-"}
                    </strong>
                  </p>

                </div>

                <button
                  type="button"
                  className="po-view-close"
                  onClick={
                    closeViewModal
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

              {/* VIEW BODY */}

              <div className="po-view-body">

                {/* BASIC INFORMATION */}

                <div className="po-view-section">

                  <h3 className="po-view-section-title">
                    Basic Information
                  </h3>

                  <div className="po-view-grid">

                    <div className="po-view-item">

                      <span className="po-view-label">
                        PO Number
                      </span>

                      <span className="po-view-value po-view-po-number">
                        {selectedPurchaseOrder.poNumber ||
                          "-"}
                      </span>

                    </div>

                    <div className="po-view-item">

                      <span className="po-view-label">
                        Vendor
                      </span>

                      <span className="po-view-value">
                        {getVendorName(
                          selectedPurchaseOrder
                        )}
                      </span>

                    </div>

                    <div className="po-view-item">

                      <span className="po-view-label">
                        Project
                      </span>

                      <span className="po-view-value">
                        {getProjectName(
                          selectedPurchaseOrder
                        )}
                      </span>

                    </div>

                    <div className="po-view-item">

                      <span className="po-view-label">
                        Status
                      </span>

                      <span
                        className={`po-view-status ${getStatusClass(
                          selectedPurchaseOrder.status
                        )}`}
                      >
                        {formatStatus(
                          selectedPurchaseOrder.status
                        )}
                      </span>

                    </div>

                    <div className="po-view-item">

                      <span className="po-view-label">
                        Order Date
                      </span>

                      <span className="po-view-value">
                        {formatDate(
                          selectedPurchaseOrder.orderDate
                        )}
                      </span>

                    </div>

                    <div className="po-view-item">

                      <span className="po-view-label">
                        Expected Delivery
                      </span>

                      <span className="po-view-value">
                        {formatDate(
                          selectedPurchaseOrder.expectedDate ||
                            selectedPurchaseOrder.expectedDelivery
                        )}
                      </span>

                    </div>

                  </div>

                </div>

                {/* AMOUNT DETAILS */}

                <div className="po-view-section">

                  <h3 className="po-view-section-title">
                    Amount Details
                  </h3>

                  <div className="po-view-amount-grid">

                    <div className="po-view-amount-card">

                      <div className="po-view-amount-label">
                        Subtotal
                      </div>

                      <div className="po-view-amount-value">
                        {formatAmount(
                          selectedPurchaseOrder.subtotal
                        )}
                      </div>

                    </div>

                    <div className="po-view-amount-card">

                      <div className="po-view-amount-label">
                        Tax Amount
                      </div>

                      <div className="po-view-amount-value">
                        {formatAmount(
                          selectedPurchaseOrder.taxAmount
                        )}
                      </div>

                    </div>

                    <div className="po-view-amount-card total">

                      <div className="po-view-amount-label">
                        Total Amount
                      </div>

                      <div className="po-view-amount-value">
                        {formatAmount(
                          selectedPurchaseOrder.totalAmount
                        )}
                      </div>

                    </div>

                  </div>

                </div>

                {/* REMARKS */}

                <div className="po-view-section">

                  <h3 className="po-view-section-title">
                    Remarks
                  </h3>

                  <div className="po-view-remarks">

                    {selectedPurchaseOrder.remarks ||
                      "No remarks added for this purchase order."}

                  </div>

                </div>

              </div>

              {/* VIEW FOOTER */}

              <div className="po-view-footer">

                <button
                  type="button"
                  className="po-view-footer-button"
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      {/* ========================================================
          EDIT PURCHASE ORDER MODAL
      ======================================================== */}

      {showEditModal &&
        editingPurchaseOrder && (

          <PurchaseOrderForm
            purchaseOrders={
              purchaseOrders
            }

            purchaseOrder={
              editingPurchaseOrder
            }

            isEdit={true}

            onClose={
              closeEditModal
            }

            onSave={
              handleEditSuccess
            }

            loading={false}
          />

        )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}

      {showDeleteModal &&
        deletingPurchaseOrder && (

          <div
            className="po-delete-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteModal();
              }

            }}
          >

            <div className="po-delete-modal">

              {/* DELETE ICON */}

              <div className="po-delete-icon">
                🗑
              </div>

              {/* TITLE */}

              <h2>
                Delete Purchase Order?
              </h2>

              {/* MESSAGE */}

              <p>
                Are you sure you want to
                delete{" "}
                <strong>
                  {deletingPurchaseOrder.poNumber}
                </strong>
                ?
              </p>

              <span className="po-delete-warning">
                This action cannot be undone.
              </span>

              {/* BUTTONS */}

              <div className="po-delete-actions">

                <button
                  type="button"
                  className="po-delete-cancel"
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
                  className="po-delete-confirm"
                  onClick={
                    confirmDelete
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

    </>
  );
}

export default PurchaseOrders;