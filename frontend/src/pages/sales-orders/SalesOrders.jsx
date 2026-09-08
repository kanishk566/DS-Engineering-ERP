import { useEffect, useMemo, useState } from "react";

import SalesOrderForm from "../../components/SalesOrderForm";

import {
  getCustomers,
  getQuotations,
  getSalesOrders,
  getSalesOrder,
  deleteSalesOrder,
} from "../../services/api";

function SalesOrders() {
  // ============================================================
  // SALES ORDERS
  // ============================================================

  const [salesOrders, setSalesOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // CUSTOMERS
  // ============================================================

  const [customers, setCustomers] = useState([]);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  // ============================================================
  // QUOTATIONS
  // ============================================================

  const [quotations, setQuotations] = useState([]);

  const [quotationsLoading, setQuotationsLoading] =
    useState(false);

  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] = useState("");

  // ============================================================
  // CREATE / EDIT MODAL
  // ============================================================

  const [showForm, setShowForm] = useState(false);

  const [editingSalesOrder, setEditingSalesOrder] =
    useState(null);

  // ============================================================
  // VIEW MODAL
  // ============================================================

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedSalesOrder, setSelectedSalesOrder] =
    useState(null);

  const [viewLoading, setViewLoading] =
    useState(false);

  // ============================================================
  // DELETE MODAL
  // ============================================================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deletingSalesOrder, setDeletingSalesOrder] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ============================================================
  // LOAD SALES ORDERS
  // ============================================================

  async function loadSalesOrders() {
    try {
      setLoading(true);
      setError("");

      const result = await getSalesOrders();

      if (result?.success) {
        setSalesOrders(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } else {
        setSalesOrders([]);

        setError(
          result?.message ||
            "Failed to load sales orders."
        );
      }
    } catch (err) {
      console.error(
        "Failed to load sales orders:",
        err
      );

      setSalesOrders([]);

      setError(
        err?.message ||
          "Failed to load sales orders."
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
      setCustomersLoading(true);

      const result = await getCustomers();

      if (result?.success) {
        setCustomers(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error(
        "Failed to load customers:",
        err
      );

      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }

  // ============================================================
  // LOAD QUOTATIONS
  // ============================================================

  async function loadQuotations() {
    try {
      setQuotationsLoading(true);

      const result = await getQuotations();

      if (result?.success) {
        setQuotations(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } else {
        setQuotations([]);
      }
    } catch (err) {
      console.error(
        "Failed to load quotations:",
        err
      );

      setQuotations([]);
    } finally {
      setQuotationsLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSalesOrders();
    loadCustomers();
    loadQuotations();
  }, []);

  // ============================================================
  // FIND CUSTOMER
  // ============================================================

  function getCustomerName(order) {
    if (order?.customer?.name) {
      return order.customer.name;
    }

    if (order?.customer?.companyName) {
      return order.customer.companyName;
    }

    const customer = customers.find(
      (item) =>
        Number(item.id) ===
        Number(order?.customerId)
    );

    if (customer) {
      return (
        customer.name ||
        customer.companyName ||
        "Customer"
      );
    }

    return "Customer";
  }

  // ============================================================
  // FIND CUSTOMER CODE
  // ============================================================

  function getCustomerCode(order) {
    if (order?.customer?.customerCode) {
      return order.customer.customerCode;
    }

    if (order?.customer?.code) {
      return order.customer.code;
    }

    const customer = customers.find(
      (item) =>
        Number(item.id) ===
        Number(order?.customerId)
    );

    return (
      customer?.customerCode ||
      customer?.code ||
      ""
    );
  }

  // ============================================================
  // FIND QUOTATION NUMBER
  // ============================================================

  function getQuotationNumber(order) {
    if (order?.quotation?.quotationNumber) {
      return order.quotation.quotationNumber;
    }

    if (order?.quotation?.quotationNo) {
      return order.quotation.quotationNo;
    }

    const quotation = quotations.find(
      (item) =>
        Number(item.id) ===
        Number(order?.quotationId)
    );

    return (
      quotation?.quotationNumber ||
      quotation?.quotationNo ||
      quotation?.number ||
      ""
    );
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
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
  // FORMAT DATE FOR INPUT
  // ============================================================

  function formatInputDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date
      .toISOString()
      .split("T")[0];
  }

  // ============================================================
  // FORMAT AMOUNT
  // ============================================================

  function formatAmount(amount) {
    const number = Number(amount || 0);

    return `₹${number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  // ============================================================
  // STATUS LABEL
  // ============================================================

  function getStatusLabel(status) {
    if (!status) {
      return "Draft";
    }

    return String(status)
      .charAt(0)
      .toUpperCase() +
      String(status).slice(1);
  }

  // ============================================================
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "draft" ||
      value === "pending" ||
      value === "cancelled"
    ) {
      return "status-inactive";
    }

    return "status-active";
  }

  // ============================================================
  // SEARCH FILTER
  // ============================================================

  const filteredSalesOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return salesOrders;
    }

    return salesOrders.filter((order) => {
      const salesOrderNumber =
        String(
          order?.salesOrderNumber || ""
        ).toLowerCase();

      const salesOrderCode =
        String(
          order?.salesOrderCode || ""
        ).toLowerCase();

      const customerName =
        getCustomerName(order).toLowerCase();

      const quotationNumber =
        getQuotationNumber(order).toLowerCase();

      const status =
        String(
          order?.status || ""
        ).toLowerCase();

      return (
        salesOrderNumber.includes(query) ||
        salesOrderCode.includes(query) ||
        customerName.includes(query) ||
        quotationNumber.includes(query) ||
        status.includes(query)
      );
    });
  }, [
    salesOrders,
    customers,
    quotations,
    search,
  ]);

  // ============================================================
  // OPEN CREATE
  // ============================================================

  function handleCreateSalesOrder() {
    setEditingSalesOrder(null);
    setShowForm(true);
  }

  // ============================================================
  // OPEN EDIT
  // ============================================================

  async function handleEditSalesOrder(order) {
    try {
      setError("");

      let completeOrder = order;

      if (order?.id) {
        try {
          const result =
            await getSalesOrder(order.id);

          if (
            result?.success &&
            result?.data
          ) {
            completeOrder = result.data;
          }
        } catch (err) {
          console.warn(
            "Could not fetch complete sales order:",
            err
          );
        }
      }

      setEditingSalesOrder(
        completeOrder
      );

      setShowForm(true);
    } catch (err) {
      console.error(
        "Edit sales order error:",
        err
      );

      setError(
        err?.message ||
          "Failed to open sales order."
      );
    }
  }

  // ============================================================
  // CLOSE FORM
  // ============================================================

  function handleCloseForm() {
    setShowForm(false);
    setEditingSalesOrder(null);
  }

  // ============================================================
  // FORM SUCCESS
  // ============================================================

  async function handleFormSuccess() {
    setShowForm(false);
    setEditingSalesOrder(null);

    await loadSalesOrders();
  }

  // ============================================================
  // VIEW SALES ORDER
  // ============================================================

  async function handleViewSalesOrder(order) {
    try {
      setViewLoading(true);
      setShowViewModal(true);
      setSelectedSalesOrder(null);

      let completeOrder = order;

      if (order?.id) {
        const result =
          await getSalesOrder(order.id);

        if (
          result?.success &&
          result?.data
        ) {
          completeOrder = result.data;
        }
      }

      setSelectedSalesOrder(
        completeOrder
      );
    } catch (err) {
      console.error(
        "View sales order error:",
        err
      );

      setSelectedSalesOrder(order);
    } finally {
      setViewLoading(false);
    }
  }

  // ============================================================
  // CLOSE VIEW
  // ============================================================

  function handleCloseView() {
    setShowViewModal(false);
    setSelectedSalesOrder(null);
  }

  // ============================================================
  // OPEN DELETE
  // ============================================================

  function handleDeleteClick(order) {
    setDeletingSalesOrder(order);
    setShowDeleteModal(true);
  }

  // ============================================================
  // CLOSE DELETE
  // ============================================================

  function handleCloseDelete() {
    if (deleteLoading) {
      return;
    }

    setShowDeleteModal(false);
    setDeletingSalesOrder(null);
  }

  // ============================================================
  // CONFIRM DELETE
  // ============================================================

  async function handleConfirmDelete() {
    if (!deletingSalesOrder?.id) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      const result =
        await deleteSalesOrder(
          deletingSalesOrder.id
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete sales order."
        );
      }

      setShowDeleteModal(false);
      setDeletingSalesOrder(null);

      await loadSalesOrders();
    } catch (err) {
      console.error(
        "Delete sales order error:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete sales order."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  // ============================================================
  // VIEW FIELD
  // ============================================================

  function ViewField({
    label,
    value,
  }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          {label}
        </span>

        <div
          style={{
            minHeight: "42px",
            display: "flex",
            alignItems: "center",
            padding: "0 13px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
            color: "#172033",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          {value || "-"}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sales-orders-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h2>Sales Orders</h2>

          <p>
            Manage sales orders, customers and order status.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            handleCreateSalesOrder
          }
        >
          + Create Sales Order
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "15px",
            padding: "12px 15px",
            borderRadius: "8px",
            border:
              "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          SALES ORDER CARD
      ====================================================== */}

      <div className="data-card">

        {/* CARD HEADER */}

        <div className="data-card-header">

          <div>

            <h3>
              Sales Order List
            </h3>

            <p>
              {filteredSalesOrders.length} of{" "}
              {salesOrders.length} registered sales orders
            </p>

          </div>

          {/* SEARCH */}

          <div className="search-box">

            <input
              type="text"
              placeholder="Search sales orders..."
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
            TABLE
        ==================================================== */}

        <div className="table-wrapper">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  Sales Order
                </th>

                <th>
                  Code
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Order Date
                </th>

                <th>
                  Delivery Date
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

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (
                <tr>

                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "45px",
                      color: "#64748b",
                    }}
                  >
                    Loading sales orders...
                  </td>

                </tr>
              )}

              {/* =================================================
                  EMPTY
              ================================================= */}

              {!loading &&
                filteredSalesOrders.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "45px",
                        color: "#64748b",
                      }}
                    >
                      {search
                        ? "No sales orders match your search."
                        : "No sales orders found."}
                    </td>

                  </tr>
                )}

              {/* =================================================
                  SALES ORDER ROWS
              ================================================= */}

              {!loading &&
                filteredSalesOrders.map(
                  (order) => {

                    const customerName =
                      getCustomerName(order);

                    const customerCode =
                      getCustomerCode(order);

                    const quotationNumber =
                      getQuotationNumber(order);

                    return (
                      <tr
                        key={order.id}
                      >

                        {/* SALES ORDER */}

                        <td>

                          <div className="table-customer">

                            <div className="table-avatar">
                              S
                            </div>

                            <div>

                              <strong>
                                {order.salesOrderNumber ||
                                  "-"}
                              </strong>

                              <span>
                                {quotationNumber ||
                                  "Sales Order"}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CODE */}

                        <td>

                          <span className="code-badge">
                            {order.salesOrderCode ||
                              "-"}
                          </span>

                        </td>

                        {/* CUSTOMER */}

                        <td>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                            }}
                          >

                            <span>
                              {customerName}
                            </span>

                            {customerCode && (
                              <small
                                style={{
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    "10px",
                                }}
                              >
                                {customerCode}
                              </small>
                            )}

                          </div>

                        </td>

                        {/* ORDER DATE */}

                        <td>
                          {formatDate(
                            order.orderDate
                          )}
                        </td>

                        {/* DELIVERY DATE */}

                        <td>
                          {formatDate(
                            order.deliveryDate
                          )}
                        </td>

                        {/* TOTAL */}

                        <td>

                          <strong>
                            {formatAmount(
                              order.totalAmount
                            )}
                          </strong>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(
                              order.status
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
                                handleViewSalesOrder(
                                  order
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
                                handleEditSalesOrder(
                                  order
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
                                handleDeleteClick(
                                  order
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

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="table-footer">

          <span>
            Showing{" "}
            <strong>
              {filteredSalesOrders.length}
            </strong>{" "}
            of{" "}
            <strong>
              {salesOrders.length}
            </strong>{" "}
            sales orders
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
          CREATE / EDIT FORM
      ====================================================== */}

      {showForm && (
        <SalesOrderForm
          salesOrder={
            editingSalesOrder
          }
          customers={customers}
          quotations={quotations}
          onClose={
            handleCloseForm
          }
          onSuccess={
            handleFormSuccess
          }
        />
      )}

      {/* ======================================================
          VIEW SALES ORDER MODAL
      ====================================================== */}

      {showViewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseView();
            }
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow:
                "0 25px 60px rgba(15,23,42,0.25)",
            }}
          >

            {/* VIEW HEADER */}

            <div
              style={{
                padding: "20px 24px",
                borderBottom:
                  "1px solid #e5eaf0",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#0f172a",
                  }}
                >
                  Sales Order Details
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  View sales order information
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseView
                }
                style={{
                  width: "34px",
                  height: "34px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    "#f1f5f9",
                  color: "#475569",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

            </div>

            {/* VIEW BODY */}

            <div
              style={{
                padding: "24px",
              }}
            >

              {viewLoading && (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding: "40px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Loading sales order...
                </div>
              )}

              {!viewLoading &&
                selectedSalesOrder && (
                  <>

                    {/* BASIC INFORMATION */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: "16px",
                      }}
                    >

                      <ViewField
                        label="Sales Order Number"
                        value={
                          selectedSalesOrder.salesOrderNumber
                        }
                      />

                      <ViewField
                        label="Sales Order Code"
                        value={
                          selectedSalesOrder.salesOrderCode
                        }
                      />

                      <ViewField
                        label="Customer"
                        value={getCustomerName(
                          selectedSalesOrder
                        )}
                      />

                      <ViewField
                        label="Customer Code"
                        value={getCustomerCode(
                          selectedSalesOrder
                        )}
                      />

                      <ViewField
                        label="Quotation"
                        value={
                          getQuotationNumber(
                            selectedSalesOrder
                          ) || "-"
                        }
                      />

                      <ViewField
                        label="Status"
                        value={getStatusLabel(
                          selectedSalesOrder.status
                        )}
                      />

                      <ViewField
                        label="Order Date"
                        value={formatDate(
                          selectedSalesOrder.orderDate
                        )}
                      />

                      <ViewField
                        label="Delivery Date"
                        value={formatDate(
                          selectedSalesOrder.deliveryDate
                        )}
                      />

                    </div>

                    {/* AMOUNT DETAILS */}

                    <div
                      style={{
                        marginTop:
                          "22px",
                        paddingTop:
                          "20px",
                        borderTop:
                          "1px solid #e5eaf0",
                      }}
                    >

                      <h3
                        style={{
                          margin:
                            "0 0 14px",
                          fontSize:
                            "14px",
                          color:
                            "#0f172a",
                        }}
                      >
                        Amount Details
                      </h3>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                          gap: "12px",
                        }}
                      >

                        <ViewField
                          label="Subtotal"
                          value={formatAmount(
                            selectedSalesOrder.subtotal
                          )}
                        />

                        <ViewField
                          label="Tax Amount"
                          value={formatAmount(
                            selectedSalesOrder.taxAmount
                          )}
                        />

                        <ViewField
                          label="Total Amount"
                          value={formatAmount(
                            selectedSalesOrder.totalAmount
                          )}
                        />

                      </div>

                    </div>

                    {/* NOTES */}

                    <div
                      style={{
                        marginTop:
                          "22px",
                        paddingTop:
                          "20px",
                        borderTop:
                          "1px solid #e5eaf0",
                      }}
                    >

                      <ViewField
                        label="Notes"
                        value={
                          selectedSalesOrder.notes ||
                          selectedSalesOrder.remarks ||
                          "-"
                        }
                      />

                    </div>

                  </>
                )}

            </div>

            {/* VIEW FOOTER */}

            <div
              style={{
                padding:
                  "15px 24px",
                borderTop:
                  "1px solid #e5eaf0",
                display: "flex",
                justifyContent:
                  "flex-end",
              }}
            >

              <button
                type="button"
                onClick={
                  handleCloseView
                }
                style={{
                  height: "40px",
                  padding:
                    "0 20px",
                  border:
                    "1px solid #d6dee8",
                  borderRadius: "8px",
                  background:
                    "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteModal &&
        deletingSalesOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background:
                "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              padding: "20px",
            }}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget &&
                !deleteLoading
              ) {
                handleCloseDelete();
              }
            }}
          >

            <div
              style={{
                width: "100%",
                maxWidth: "430px",
                background:
                  "#ffffff",
                borderRadius:
                  "14px",
                boxShadow:
                  "0 25px 60px rgba(15,23,42,0.25)",
                overflow: "hidden",
              }}
            >

              {/* DELETE HEADER */}

              <div
                style={{
                  padding:
                    "22px 24px",
                  borderBottom:
                    "1px solid #e5eaf0",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "12px",
                  }}
                >

                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius:
                        "50%",
                      background:
                        "#fef2f2",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize:
                        "20px",
                    }}
                  >
                    🗑
                  </div>

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "17px",
                        color:
                          "#0f172a",
                      }}
                    >
                      Delete Sales Order
                    </h3>

                    <p
                      style={{
                        margin:
                          "4px 0 0",
                        fontSize:
                          "12px",
                        color:
                          "#94a3b8",
                      }}
                    >
                      This action cannot be undone.
                    </p>

                  </div>

                </div>

              </div>

              {/* DELETE BODY */}

              <div
                style={{
                  padding:
                    "22px 24px",
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 15px",
                    fontSize:
                      "13px",
                    lineHeight:
                      "1.6",
                    color:
                      "#475569",
                  }}
                >
                  Are you sure you want to delete
                  this sales order?
                </p>

                <div
                  style={{
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "9px",
                    background:
                      "#f8fafc",
                  }}
                >

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "13px",
                      color:
                        "#0f172a",
                    }}
                  >
                    {
                      deletingSalesOrder.salesOrderNumber
                    }
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "4px",
                      fontSize:
                        "11px",
                      color:
                        "#64748b",
                    }}
                  >
                    {getCustomerName(
                      deletingSalesOrder
                    )}
                  </span>

                </div>

              </div>

              {/* DELETE FOOTER */}

              <div
                style={{
                  padding:
                    "15px 24px",
                  borderTop:
                    "1px solid #e5eaf0",
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                }}
              >

                <button
                  type="button"
                  onClick={
                    handleCloseDelete
                  }
                  disabled={
                    deleteLoading
                  }
                  style={{
                    height: "40px",
                    padding:
                      "0 18px",
                    border:
                      "1px solid #d6dee8",
                    borderRadius:
                      "8px",
                    background:
                      "#ffffff",
                    color:
                      "#334155",
                    fontWeight:
                      "600",
                    cursor:
                      deleteLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      deleteLoading
                        ? 0.6
                        : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmDelete
                  }
                  disabled={
                    deleteLoading
                  }
                  style={{
                    height: "40px",
                    padding:
                      "0 18px",
                    border: "none",
                    borderRadius:
                      "8px",
                    background:
                      "#dc2626",
                    color:
                      "#ffffff",
                    fontWeight:
                      "600",
                    cursor:
                      deleteLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      deleteLoading
                        ? 0.6
                        : 1,
                  }}
                >
                  {deleteLoading
                    ? "Deleting..."
                    : "Delete Sales Order"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default SalesOrders;