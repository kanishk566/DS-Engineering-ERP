import React, { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  getProjects,
  getInvoice,
  getInvoiceItemsByInvoice,
  createInvoice,
  updateInvoice,
  createInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
} from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return getLocalDateString(date);
}

function InvoiceForm({ onSuccess, onCancel }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerId: "",
    projectId: "",
    invoiceDate: getLocalDateString(),
    dueDate: "",
    status: "draft",
    taxAmount: "0",
    paidAmount: "0",
    notes: "",
  });

  const [items, setItems] = useState([
    {
      id: null,
      itemName: "",
      description: "",
      quantity: "1",
      unit: "Nos",
      unitPrice: "0",
    },
  ]);

  const [deletedItemIds, setDeletedItemIds] = useState([]);

  // --------------------------------------------------
  // LOAD CUSTOMERS & PROJECTS
  // --------------------------------------------------
  useEffect(() => {
    loadFormData();
  }, []);

  // --------------------------------------------------
  // LOAD EXISTING INVOICE IN EDIT MODE
  // --------------------------------------------------
  useEffect(() => {
    if (isEditMode) {
      loadInvoice();
    }
  }, [isEditMode, id]);

  async function loadFormData() {
    try {
      setLoading(true);
      setError("");

      const [customerResponse, projectResponse] =
        await Promise.all([
          getCustomers(),
          getProjects(),
        ]);

      const customerData =
        customerResponse?.data ||
        customerResponse?.customers ||
        [];

      const projectData =
        projectResponse?.data ||
        projectResponse?.projects ||
        [];

      setCustomers(
        Array.isArray(customerData)
          ? customerData
          : []
      );

      setProjects(
        Array.isArray(projectData)
          ? projectData
          : []
      );
    } catch (err) {
      console.error(
        "Invoice form load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load customers and projects."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      const [
        invoiceResponse,
        itemResponse,
      ] = await Promise.all([
        getInvoice(id),
        getInvoiceItemsByInvoice(id),
      ]);

      const invoice =
        invoiceResponse?.data ||
        invoiceResponse;

      const invoiceItems =
        itemResponse?.data ||
        itemResponse?.items ||
        [];

      if (!invoice?.id) {
        throw new Error(
          "Invoice not found."
        );
      }

      setFormData({
        invoiceNumber:
          invoice.invoiceNumber || "",

        customerId:
          invoice.customerId
            ? String(invoice.customerId)
            : "",

        projectId:
          invoice.projectId
            ? String(invoice.projectId)
            : "",

        invoiceDate:
          getDateInputValue(invoice.invoiceDate),

        dueDate:
          getDateInputValue(invoice.dueDate),

        status:
          invoice.status || "draft",

        taxAmount:
          String(invoice.taxAmount || "0"),

        paidAmount:
          String(invoice.paidAmount || "0"),

        notes:
          invoice.notes || "",
      });

      if (
        Array.isArray(invoiceItems) &&
        invoiceItems.length > 0
      ) {
        setItems(
          invoiceItems.map((item) => ({
            id: item.id,

            itemName:
              item.itemName || "",

            description:
              item.description || "",

            quantity:
              String(item.quantity || "1"),

            unit:
              item.unit || "Nos",

            unitPrice:
              String(item.unitPrice || "0"),
          }))
        );
      } else {
        setItems([
          {
            id: null,
            itemName: "",
            description: "",
            quantity: "1",
            unit: "Nos",
            unitPrice: "0",
          },
        ]);
      }
    } catch (err) {
      console.error(
        "Load Invoice Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // --------------------------------------------------
  // ITEM CHANGE
  // --------------------------------------------------
  function handleItemChange(
    index,
    field,
    value
  ) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  // --------------------------------------------------
  // ADD ITEM
  // --------------------------------------------------
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: null,
        itemName: "",
        description: "",
        quantity: "1",
        unit: "Nos",
        unitPrice: "0",
      },
    ]);
  }

  // --------------------------------------------------
  // REMOVE ITEM
  // --------------------------------------------------
  function removeItem(index) {
    if (items.length === 1) {
      return;
    }

    const itemToRemove = items[index];

    if (itemToRemove?.id) {
      setDeletedItemIds((prev) => [
        ...prev,
        itemToRemove.id,
      ]);
    }

    setItems((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  // --------------------------------------------------
  // ITEM TOTAL
  // --------------------------------------------------
  function getItemTotal(item) {
    const quantity =
      Number(item.quantity) || 0;

    const unitPrice =
      Number(item.unitPrice) || 0;

    return quantity * unitPrice;
  }

  // --------------------------------------------------
  // SUBTOTAL
  // --------------------------------------------------
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        return (
          sum +
          getItemTotal(item)
        );
      },
      0
    );
  }, [items]);

  // --------------------------------------------------
  // TAX
  // --------------------------------------------------
  const taxAmount =
    Number(formData.taxAmount) || 0;

  // --------------------------------------------------
  // TOTAL
  // --------------------------------------------------
  const totalAmount =
    subtotal + taxAmount;

  // --------------------------------------------------
  // CURRENCY
  // --------------------------------------------------
  function formatCurrency(value) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value) || 0
    );
  }

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------
  function validateForm() {
    if (
      !formData.invoiceNumber.trim()
    ) {
      return (
        "Invoice number is required."
      );
    }

    if (!formData.customerId) {
      return (
        "Please select a customer."
      );
    }

    if (!formData.invoiceDate) {
      return (
        "Invoice date is required."
      );
    }

    if (items.length === 0) {
      return (
        "Please add at least one invoice item."
      );
    }

    for (
      let i = 0;
      i < items.length;
      i++
    ) {
      if (
        !items[i].itemName.trim()
      ) {
        return `Item ${
          i + 1
        }: Item name is required.`;
      }

      if (
        Number(items[i].quantity) <=
        0
      ) {
        return `Item ${
          i + 1
        }: Quantity must be greater than 0.`;
      }

      if (
        Number(items[i].unitPrice) <
        0
      ) {
        return `Item ${
          i + 1
        }: Unit price cannot be negative.`;
      }
    }

    if (taxAmount < 0) {
      return (
        "Tax amount cannot be negative."
      );
    }

    const paidAmountValue =
      Number(formData.paidAmount) || 0;

    if (paidAmountValue < 0) {
      return "Paid amount cannot be negative.";
    }

    if (paidAmountValue > totalAmount) {
      return "Paid amount cannot be greater than the invoice total.";
    }

    return "";
  }

  // --------------------------------------------------
  // SAVE / UPDATE INVOICE
  // --------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const invoicePayload = {
        invoiceNumber:
          formData.invoiceNumber.trim(),

        customerId:
          Number(formData.customerId),

        projectId:
          formData.projectId
            ? Number(formData.projectId)
            : null,

        invoiceDate:
          formData.invoiceDate,

        dueDate:
          formData.dueDate || null,

        status:
          formData.status,

        subtotal:
          String(subtotal),

        taxAmount:
          String(taxAmount),

        totalAmount:
          String(totalAmount),

        paidAmount:
          String(
            Number(
              formData.paidAmount
            ) || 0
          ),

        notes:
          formData.notes.trim() ||
          null,
      };

      let invoice;

      // ==================================================
      // EDIT EXISTING INVOICE
      // ==================================================
      if (isEditMode) {
        const updateResponse =
          await updateInvoice(
            Number(id),
            invoicePayload
          );

        invoice =
          updateResponse?.data ||
          updateResponse;

        if (!invoice?.id) {
          throw new Error(
            "Invoice update failed."
          );
        }

        // ----------------------------------------------
        // DELETE REMOVED ITEMS
        // ----------------------------------------------
        for (
          const itemId of
          deletedItemIds
        ) {
          await deleteInvoiceItem(
            itemId
          );
        }

        // ----------------------------------------------
        // UPDATE EXISTING ITEMS
        // CREATE NEW ITEMS
        // ----------------------------------------------
        for (
          const item of items
        ) {
          const itemPayload = {
            invoiceId:
              Number(id),

            itemName:
              item.itemName.trim(),

            description:
              item.description.trim() ||
              null,

            quantity:
              String(item.quantity),

            unit:
              item.unit.trim() ||
              null,

            unitPrice:
              String(item.unitPrice),

            totalPrice:
              String(
                getItemTotal(item)
              ),
          };

          if (item.id) {
            await updateInvoiceItem(
              item.id,
              itemPayload
            );
          } else {
            await createInvoiceItem(
              itemPayload
            );
          }
        }

        alert(
          "Invoice updated successfully!"
        );
      }

      // ==================================================
      // CREATE NEW INVOICE
      // ==================================================
      else {
        const invoiceResponse =
          await createInvoice(
            invoicePayload
          );

        invoice =
          invoiceResponse?.data ||
          invoiceResponse;

        const invoiceId =
          invoice?.id;

        if (!invoiceId) {
          throw new Error(
            "Invoice was created but invoice ID was not returned."
          );
        }

        // ----------------------------------------------
        // CREATE INVOICE ITEMS
        // ----------------------------------------------
        for (
          const item of items
        ) {
          const itemPayload = {
            invoiceId:
              Number(invoiceId),

            itemName:
              item.itemName.trim(),

            description:
              item.description.trim() ||
              null,

            quantity:
              String(item.quantity),

            unit:
              item.unit.trim() ||
              null,

            unitPrice:
              String(item.unitPrice),

            totalPrice:
              String(
                getItemTotal(item)
              ),
          };

          await createInvoiceItem(
            itemPayload
          );
        }

        alert(
          "Invoice created successfully!"
        );
      }

      // ----------------------------------------------
      // AFTER SAVE
      // ----------------------------------------------
      if (onSuccess) {
        onSuccess(invoice);
      } else {
        navigate("/invoices");
      }
    } catch (err) {
      console.error(
        "Save Invoice Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to save invoice. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // CANCEL
  // --------------------------------------------------
  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/invoices");
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="invoice-form-loading">
        <div className="invoice-loading-spinner"></div>

        <p>
          {isEditMode
            ? "Loading invoice..."
            : "Loading invoice form..."}
        </p>

        <style>{`
          .invoice-form-loading {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #667085;
          }

          .invoice-loading-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #e5e7eb;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: invoiceSpin 0.8s linear infinite;
            margin-bottom: 12px;
          }

          @keyframes invoiceSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="invoice-form-page">
      <form onSubmit={handleSubmit}>

        {/* ------------------------------------------
            HEADER
        ------------------------------------------- */}

        <div className="invoice-form-header">
          <div>
            <h1>
              {isEditMode
                ? "Edit Invoice"
                : "Create Invoice"}
            </h1>

            <p>
              {isEditMode
                ? "Update invoice details, items, tax and payment information."
                : "Create a customer invoice with items, tax and payment details."}
            </p>
          </div>

          <div className="invoice-header-actions">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditMode
                ? "Update Invoice"
                : "Save Invoice"}
            </button>

          </div>
        </div>

        {/* ------------------------------------------
            ERROR
        ------------------------------------------- */}

        {error && (
          <div className="invoice-error">
            <strong>Error:</strong>{" "}
            {error}
          </div>
        )}

        {/* ------------------------------------------
            BASIC INFORMATION
        ------------------------------------------- */}

        <div className="form-card">

          <div className="card-title">
            <h2>
              Invoice Information
            </h2>

            <span>
              Basic invoice details
            </span>
          </div>

          <div className="form-grid">

            {/* Invoice Number */}

            <div className="form-group">
              <label>
                Invoice Number{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                name="invoiceNumber"
                value={
                  formData.invoiceNumber
                }
                onChange={handleChange}
                placeholder="e.g. INV-2026-002"
              />
            </div>

            {/* Customer */}

            <div className="form-group">
              <label>
                Customer{" "}
                <span>*</span>
              </label>

              <select
                name="customerId"
                value={
                  formData.customerId
                }
                onChange={handleChange}
              >
                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.customerCode
                        ? `${customer.customerCode} - `
                        : ""}
                      {customer.name ||
                        customer.companyName ||
                        customer.customerName ||
                        `Customer #${customer.id}`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Project */}

            <div className="form-group">
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
                  Select Project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.projectCode
                        ? `${project.projectCode} - `
                        : ""}
                      {project.name ||
                        project.projectName ||
                        `Project #${project.id}`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Status */}

            <div className="form-group">
              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={handleChange}
              >
                <option value="draft">
                  Draft
                </option>

                <option value="sent">
                  Sent
                </option>

                <option value="partial">
                  Partial
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="overdue">
                  Overdue
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            {/* Invoice Date */}

            <div className="form-group">
              <label>
                Invoice Date{" "}
                <span>*</span>
              </label>

              <input
                type="date"
                name="invoiceDate"
                value={
                  formData.invoiceDate
                }
                onChange={handleChange}
              />
            </div>

            {/* Due Date */}

            <div className="form-group">
              <label>
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={
                  formData.dueDate
                }
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* ------------------------------------------
            ITEMS
        ------------------------------------------- */}

        <div className="form-card">

          <div className="card-title item-title-row">

            <div>
              <h2>
                Invoice Items
              </h2>

              <span>
                Add products or services
              </span>
            </div>

            <button
              type="button"
              className="btn btn-add-item"
              onClick={addItem}
            >
              + Add Item
            </button>

          </div>

          <div className="items-table-wrapper">

            <table className="items-table">

              <thead>
                <tr>

                  <th
                    style={{
                      width: "22%",
                    }}
                  >
                    Item Name *
                  </th>

                  <th
                    style={{
                      width: "22%",
                    }}
                  >
                    Description
                  </th>

                  <th
                    style={{
                      width: "10%",
                    }}
                  >
                    Qty *
                  </th>

                  <th
                    style={{
                      width: "10%",
                    }}
                  >
                    Unit
                  </th>

                  <th
                    style={{
                      width: "14%",
                    }}
                  >
                    Unit Price *
                  </th>

                  <th
                    style={{
                      width: "14%",
                    }}
                  >
                    Total
                  </th>

                  <th
                    style={{
                      width: "8%",
                    }}
                  >
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {items.map(
                  (item, index) => (
                    <tr key={item.id || `new-${index}`}>

                      {/* Item Name */}

                      <td>
                        <input
                          type="text"
                          value={
                            item.itemName
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "itemName",
                              e.target.value
                            )
                          }
                          placeholder="Item name"
                        />
                      </td>

                      {/* Description */}

                      <td>
                        <input
                          type="text"
                          value={
                            item.description
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                        />
                      </td>

                      {/* Quantity */}

                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Unit */}

                      <td>
                        <input
                          type="text"
                          value={
                            item.unit
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                          placeholder="Nos"
                        />
                      </td>

                      {/* Unit Price */}

                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.unitPrice
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Total */}

                      <td className="item-total">
                        {formatCurrency(
                          getItemTotal(item)
                        )}
                      </td>

                      {/* Delete */}

                      <td>

                        <button
                          type="button"
                          className="remove-item"
                          onClick={() =>
                            removeItem(
                              index
                            )
                          }
                          disabled={
                            items.length ===
                            1
                          }
                          title={
                            items.length ===
                            1
                              ? "At least one item is required"
                              : "Remove item"
                          }
                        >
                          🗑
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* ------------------------------------------
            TOTALS + PAYMENT
        ------------------------------------------- */}

        <div className="bottom-grid">

          {/* NOTES */}

          <div className="form-card notes-card">

            <div className="card-title">
              <h2>
                Notes
              </h2>

              <span>
                Additional information
              </span>
            </div>

            <div className="form-group">

              <label>
                Invoice Notes
              </label>

              <textarea
                name="notes"
                value={
                  formData.notes
                }
                onChange={handleChange}
                rows="7"
                placeholder="Enter any additional notes..."
              ></textarea>

            </div>

          </div>

          {/* PAYMENT SUMMARY */}

          <div className="form-card totals-card">

            <div className="card-title">

              <h2>
                Payment Summary
              </h2>

              <span>
                Invoice totals
              </span>

            </div>

            {/* Subtotal */}

            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  subtotal
                )}
              </strong>

            </div>

            {/* Tax */}

            <div className="tax-input-row">

              <span>
                Tax Amount
              </span>

              <input
                type="number"
                name="taxAmount"
                min="0"
                step="0.01"
                value={
                  formData.taxAmount
                }
                onChange={handleChange}
              />

            </div>

            {/* Total */}

            <div className="summary-row total-row">

              <span>
                Total Amount
              </span>

              <strong>
                {formatCurrency(
                  totalAmount
                )}
              </strong>

            </div>

            {/* Paid */}

            <div className="paid-input-row">

              <label>
                Paid Amount
                {isEditMode && (
                  <small style={{ marginLeft: "6px", color: "#667085", fontWeight: 400 }}>
                    (managed by Payments)
                  </small>
                )}
              </label>

              <input
                type="number"
                name="paidAmount"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={handleChange}
                readOnly={isEditMode}
                title={
                  isEditMode
                    ? "Paid amount is managed through the Payments section."
                    : "Optional opening paid amount."
                }
              />

            </div>

            {/* Balance */}

            <div className="summary-row balance-row">

              <span>
                Balance Due
              </span>

              <strong>
                {formatCurrency(
                  Math.max(
                    totalAmount -
                      (Number(
                        formData.paidAmount
                      ) || 0),
                    0
                  )
                )}
              </strong>

            </div>

          </div>

        </div>

        {/* ------------------------------------------
            BOTTOM ACTIONS
        ------------------------------------------- */}

        <div className="form-footer-actions">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Invoice"
              : "Create Invoice"}
          </button>

        </div>

      </form>

      {/* --------------------------------------------
          STYLES
      --------------------------------------------- */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .invoice-form-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
          color: #12213a;
        }

        .invoice-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .invoice-form-header h1 {
          margin: 0 0 6px;
          font-size: 30px;
          font-weight: 700;
          color: #12213a;
        }

        .invoice-form-header p {
          margin: 0;
          color: #667085;
          font-size: 14px;
        }

        .invoice-header-actions,
        .form-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn {
          border: none;
          border-radius: 8px;
          padding: 11px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2563eb;
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #ffffff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f8fafc;
        }

        .btn-add-item {
          background: #eef4ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          padding: 9px 14px;
        }

        .btn-add-item:hover {
          background: #dbeafe;
        }

        .invoice-error {
          background: #fef3f2;
          border: 1px solid #fecdca;
          color: #b42318;
          padding: 13px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .form-card {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
        }

        .card-title {
          margin-bottom: 20px;
        }

        .card-title h2 {
          margin: 0 0 4px;
          font-size: 18px;
          color: #12213a;
        }

        .card-title span {
          font-size: 13px;
          color: #667085;
        }

        .item-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .item-title-row > div {
          margin-bottom: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #344054;
        }

        .form-group label span {
          color: #d92d20;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 11px 12px;
          background: #ffffff;
          color: #101828;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 130px;
        }

        .items-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #eaecf0;
          border-radius: 8px;
        }

        .items-table {
          width: 100%;
          min-width: 950px;
          border-collapse: collapse;
        }

        .items-table th {
          background: #f8fafc;
          color: #475467;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 12px 10px;
          border-bottom: 1px solid #eaecf0;
          white-space: nowrap;
        }

        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #eaecf0;
          vertical-align: middle;
        }

        .items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .items-table input {
          width: 100%;
          min-width: 0;
          border: 1px solid #d0d5dd;
          border-radius: 7px;
          padding: 9px 10px;
          font-size: 13px;
          outline: none;
        }

        .items-table input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
        }

        .item-total {
          font-size: 13px;
          font-weight: 700;
          color: #12213a;
          white-space: nowrap;
        }

        .remove-item {
          width: 34px;
          height: 34px;
          border: 1px solid #fecdca;
          background: #fff5f4;
          border-radius: 7px;
          cursor: pointer;
          font-size: 14px;
        }

        .remove-item:hover:not(:disabled) {
          background: #fee4e2;
        }

        .remove-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }

        .notes-card,
        .totals-card {
          margin-bottom: 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 0;
          border-bottom: 1px solid #eaecf0;
          font-size: 14px;
          color: #475467;
        }

        .summary-row strong {
          color: #12213a;
        }

        .tax-input-row,
        .paid-input-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 0;
          border-bottom: 1px solid #eaecf0;
          font-size: 14px;
          color: #475467;
        }

        .tax-input-row input,
        .paid-input-row input {
          width: 150px;
          border: 1px solid #d0d5dd;
          border-radius: 7px;
          padding: 9px 10px;
          font-size: 14px;
          outline: none;
          text-align: right;
        }

        .tax-input-row input:focus,
        .paid-input-row input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
        }

        .paid-input-row input[readonly] {
          background: #f8fafc;
          color: #667085;
          cursor: not-allowed;
        }

        .total-row {
          padding: 18px 0;
        }

        .total-row span {
          font-weight: 700;
          color: #12213a;
        }

        .total-row strong {
          font-size: 20px;
          color: #2563eb;
        }

        .paid-input-row label {
          font-weight: 600;
        }

        .balance-row {
          border-bottom: none;
          padding-top: 18px;
        }

        .balance-row strong {
          color: #d97706;
          font-size: 16px;
        }

        .form-footer-actions {
          justify-content: flex-end;
          padding: 5px 0 20px;
        }

        @media (max-width: 1000px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .invoice-form-page {
            padding: 18px;
          }

          .invoice-form-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .invoice-header-actions {
            width: 100%;
          }

          .invoice-header-actions .btn {
            flex: 1;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .item-title-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .btn-add-item {
            width: 100%;
          }

          .tax-input-row,
          .paid-input-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .tax-input-row input,
          .paid-input-row input {
            width: 100%;
            text-align: left;
          }

          .form-footer-actions {
            width: 100%;
          }

          .form-footer-actions .btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default InvoiceForm;