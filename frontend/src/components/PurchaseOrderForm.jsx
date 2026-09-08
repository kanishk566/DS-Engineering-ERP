import { useEffect, useState } from "react";

import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getProjects,
  getVendors,
} from "../services/api";

function PurchaseOrderForm({
  purchaseOrders = [],
  purchaseOrder = null,
  isEdit = false,
  onClose,
  onSave,
  loading = false,
}) {
  // ============================================================
  // DATE HELPER
  // ============================================================

  function getTodayDate() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // ============================================================
  // FORMAT DATE FOR INPUT
  // ============================================================

  function formatDateForInput(value) {
    if (!value) {
      return "";
    }

    // Already YYYY-MM-DD
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        String(value)
      )
    ) {
      return String(value);
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // ============================================================
  // NEXT PO NUMBER
  // ============================================================

  function getNextPoNumber() {
    const year =
      new Date().getFullYear();

    let maxNumber = 0;

    purchaseOrders.forEach(
      (po) => {
        const poNumber =
          po?.poNumber || "";

        const match =
          String(poNumber).match(
            /(\d+)$/
          );

        if (match) {
          const number =
            Number(match[1]);

          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    );

    return `PO-${year}-${String(
      maxNumber + 1
    ).padStart(3, "0")}`;
  }

  // ============================================================
  // INITIAL FORM DATA
  // ============================================================

  function getInitialFormData() {
    if (isEdit && purchaseOrder) {
      const subtotal =
        Number(
          purchaseOrder.subtotal || 0
        );

      const taxAmount =
        Number(
          purchaseOrder.taxAmount || 0
        );

      const totalAmount =
        purchaseOrder.totalAmount !==
        null &&
        purchaseOrder.totalAmount !==
        undefined
          ? purchaseOrder.totalAmount
          : subtotal + taxAmount;

      return {
        poNumber:
          purchaseOrder.poNumber ||
          "",

        vendorId:
          purchaseOrder.vendorId
            ? String(
                purchaseOrder.vendorId
              )
            : purchaseOrder.vendor?.id
              ? String(
                  purchaseOrder.vendor.id
                )
              : "",

        projectId:
          purchaseOrder.projectId
            ? String(
                purchaseOrder.projectId
              )
            : purchaseOrder.project?.id
              ? String(
                  purchaseOrder.project.id
                )
              : "",

        status:
          purchaseOrder.status ||
          "draft",

        orderDate:
          formatDateForInput(
            purchaseOrder.orderDate
          ),

        expectedDate:
          formatDateForInput(
            purchaseOrder.expectedDate ||
              purchaseOrder.expectedDelivery
          ),

        subtotal:
          purchaseOrder.subtotal ??
          "",

        taxAmount:
          purchaseOrder.taxAmount ??
          "",

        totalAmount:
          totalAmount,

        remarks:
          purchaseOrder.remarks ||
          "",
      };
    }

    return {
      poNumber:
        getNextPoNumber(),

      vendorId:
        "",

      projectId:
        "",

      status:
        "draft",

      orderDate:
        getTodayDate(),

      expectedDate:
        "",

      subtotal:
        "",

      taxAmount:
        "",

      totalAmount:
        "",

      remarks:
        "",
    };
  }

  // ============================================================
  // STATE
  // ============================================================

  const [vendors, setVendors] =
    useState([]);

  const [projects, setProjects] =
    useState([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState(
      getInitialFormData
    );

  // ============================================================
  // UPDATE FORM WHEN PURCHASE ORDER CHANGES
  // ============================================================

  useEffect(() => {
    setFormData(
      getInitialFormData()
    );

    setError("");
  }, [
    purchaseOrder,
    isEdit,
    purchaseOrders,
  ]);

  // ============================================================
  // LOAD VENDORS + PROJECTS
  // ============================================================

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

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
          "Failed to load PO options:",
          err
        );

        setError(
          err?.message ||
            "Failed to load vendors and projects."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    if (error) {
      setError("");
    }
  }

  // ============================================================
  // AMOUNT CHANGE
  // ============================================================

  function handleAmountChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => {
        const subtotal =
          name === "subtotal"
            ? Number(value || 0)
            : Number(
                previous.subtotal || 0
              );

        const taxAmount =
          name === "taxAmount"
            ? Number(value || 0)
            : Number(
                previous.taxAmount || 0
              );

        const total =
          subtotal + taxAmount;

        return {
          ...previous,

          [name]:
            value,

          totalAmount:
            total > 0
              ? total.toFixed(2)
              : "",
        };
      }
    );

    if (error) {
      setError("");
    }
  }

  // ============================================================
  // CONVERT DATE TO ISO
  // ============================================================

  function convertDateToISO(
    dateValue
  ) {
    if (!dateValue) {
      return null;
    }

    return `${dateValue}T00:00:00Z`;
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !formData.poNumber.trim()
    ) {
      setError(
        "PO Number is required."
      );
      return;
    }

    if (!formData.vendorId) {
      setError(
        "Please select a vendor."
      );
      return;
    }

    if (!formData.orderDate) {
      setError(
        "Order Date is required."
      );
      return;
    }

    if (
      formData.expectedDate &&
      formData.expectedDate <
        formData.orderDate
    ) {
      setError(
        "Expected Delivery cannot be before Order Date."
      );
      return;
    }

    // ----------------------------------------------------------
    // AMOUNTS
    // ----------------------------------------------------------

    const subtotal =
      Number(
        formData.subtotal
      ) || 0;

    const taxAmount =
      Number(
        formData.taxAmount
      ) || 0;

    const totalAmount =
      subtotal + taxAmount;

    // ----------------------------------------------------------
    // PAYLOAD
    // ----------------------------------------------------------

    const payload = {
      poNumber:
        formData.poNumber.trim(),

      vendorId:
        Number(
          formData.vendorId
        ),

      projectId:
        formData.projectId
          ? Number(
              formData.projectId
            )
          : null,

      orderDate:
        convertDateToISO(
          formData.orderDate
        ),

      expectedDate:
        formData.expectedDate
          ? convertDateToISO(
              formData.expectedDate
            )
          : null,

      status:
        formData.status,

      subtotal:
        subtotal.toFixed(2),

      taxAmount:
        taxAmount.toFixed(2),

      totalAmount:
        totalAmount.toFixed(2),

      remarks:
        formData.remarks.trim()
          ? formData.remarks.trim()
          : null,
    };

    console.log(
      isEdit
        ? "UPDATE PURCHASE ORDER PAYLOAD:"
        : "CREATE PURCHASE ORDER PAYLOAD:",
      payload
    );

    // ----------------------------------------------------------
    // CREATE / UPDATE
    // ----------------------------------------------------------

    try {
      setSaving(true);

      let result;

      if (
        isEdit &&
        purchaseOrder?.id
      ) {
        result =
          await updatePurchaseOrder(
            purchaseOrder.id,
            payload
          );
      } else {
        result =
          await createPurchaseOrder(
            payload
          );
      }

      console.log(
        isEdit
          ? "UPDATE PURCHASE ORDER RESPONSE:"
          : "CREATE PURCHASE ORDER RESPONSE:",
        result
      );

      if (
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
            `Failed to ${
              isEdit
                ? "update"
                : "create"
            } purchase order.`
        );
      }

      // Refresh parent
      await onSave?.(
        result?.data
      );

      // Close modal
      onClose?.();

    } catch (err) {
      console.error(
        isEdit
          ? "UPDATE PURCHASE ORDER ERROR:"
          : "CREATE PURCHASE ORDER ERROR:",
        err
      );

      setError(
        err?.message ||
          `Failed to ${
            isEdit
              ? "update"
              : "create"
          } purchase order.`
      );
    } finally {
      setSaving(false);
    }
  }

  const isSubmitting =
    loading || saving;

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <style>{`

        .po-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;

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

        .po-modal {
          width: 100%;
          max-width: 850px;

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
            rgba(15, 23, 42, 0.25);

          overflow: hidden;
        }

        .po-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding:
            22px 26px;

          border-bottom:
            1px solid #e8edf3;

          flex-shrink: 0;
        }

        .po-modal-title {
          margin: 0;

          color:
            #0f172a;

          font-size:
            21px;

          font-weight:
            700;

          line-height:
            1.3;
        }

        .po-modal-subtitle {
          margin:
            5px 0 0;

          color:
            #64748b;

          font-size:
            13px;

          line-height:
            1.5;
        }

        .po-close-button {
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
            23px;

          line-height:
            1;

          cursor:
            pointer;

          transition:
            all 0.2s ease;
        }

        .po-close-button:hover {
          background:
            #f8fafc;

          border-color:
            #cbd5e1;

          color:
            #0f172a;
        }

        .po-modal-body {
          flex: 1;

          padding:
            24px 26px;

          overflow-y: auto;
        }

        .po-error {
          margin-bottom:
            20px;

          padding:
            12px 14px;

          border:
            1px solid #fecdd3;

          border-radius:
            9px;

          background:
            #fff1f2;

          color:
            #be123c;

          font-size:
            13px;

          line-height:
            1.5;
        }

        .po-form-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            18px 20px;
        }

        .po-form-group {
          min-width: 0;
        }

        .po-form-label {
          display: block;

          margin-bottom:
            7px;

          color:
            #334155;

          font-size:
            13px;

          font-weight:
            600;
        }

        .po-required {
          margin-left:
            3px;

          color:
            #ef4444;
        }

        .po-form-input,
        .po-form-select,
        .po-form-textarea {
          width: 100%;

          box-sizing:
            border-box;

          border:
            1px solid #d6dee8;

          border-radius:
            9px;

          background:
            #ffffff;

          color:
            #0f172a;

          font-family:
            inherit;

          font-size:
            14px;

          outline:
            none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .po-form-input,
        .po-form-select {
          height:
            44px;

          padding:
            0 13px;
        }

        .po-form-textarea {
          min-height:
            100px;

          padding:
            12px 13px;

          resize:
            vertical;
        }

        .po-form-input::placeholder,
        .po-form-textarea::placeholder {
          color:
            #94a3b8;
        }

        .po-form-input:focus,
        .po-form-select:focus,
        .po-form-textarea:focus {
          border-color:
            #2563eb;

          box-shadow:
            0 0 0 3px
            rgba(
              37,
              99,
              235,
              0.10
            );
        }

        .po-form-input:disabled,
        .po-form-select:disabled,
        .po-form-textarea:disabled {
          background:
            #f8fafc;

          cursor:
            not-allowed;
        }

        .po-amount-section {
          margin-top:
            24px;

          padding-top:
            20px;

          border-top:
            1px solid #e8edf3;
        }

        .po-section-title {
          margin:
            0 0 16px;

          color:
            #0f172a;

          font-size:
            14px;

          font-weight:
            700;
        }

        .po-total-input {
          background:
            #eff6ff !important;

          border-color:
            #bfdbfe !important;

          color:
            #1d4ed8 !important;

          font-weight:
            700 !important;
        }

        .po-remarks-section {
          margin-top:
            22px;
        }

        .po-modal-footer {
          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 10px;

          padding:
            18px 26px;

          border-top:
            1px solid #e8edf3;

          background:
            #ffffff;

          flex-shrink: 0;
        }

        .po-cancel-button,
        .po-submit-button {
          height:
            42px;

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

        .po-cancel-button {
          border:
            1px solid #d6dee8;

          background:
            #ffffff;

          color:
            #334155;
        }

        .po-cancel-button:hover {
          background:
            #f8fafc;

          border-color:
            #cbd5e1;
        }

        .po-submit-button {
          border:
            1px solid #2563eb;

          background:
            #2563eb;

          color:
            #ffffff;
        }

        .po-submit-button:hover {
          background:
            #1d4ed8;

          border-color:
            #1d4ed8;
        }

        .po-cancel-button:disabled,
        .po-submit-button:disabled,
        .po-close-button:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;
        }

        .po-loading-box {
          padding:
            16px;

          border-radius:
            9px;

          background:
            #f8fafc;

          color:
            #64748b;

          font-size:
            13px;
        }

        @media (max-width: 700px) {

          .po-modal-overlay {
            padding:
              10px;

            align-items:
              flex-start;
          }

          .po-modal {
            max-height:
              calc(100vh - 20px);

            border-radius:
              12px;
          }

          .po-modal-header {
            padding:
              18px;
          }

          .po-modal-body {
            padding:
              18px;
          }

          .po-modal-footer {
            padding:
              15px 18px;
          }

          .po-form-grid {
            grid-template-columns:
              1fr;

            gap:
              16px;
          }
        }

        @media (max-width: 480px) {

          .po-modal-title {
            font-size:
              18px;
          }

          .po-modal-footer {
            flex-direction:
              column-reverse;
          }

          .po-cancel-button,
          .po-submit-button {
            width:
              100%;
          }
        }

      `}</style>

      {/* ========================================================
          OVERLAY
      ======================================================== */}

      <div
        className="po-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose?.();
          }
        }}
      >

        {/* ======================================================
            MODAL
        ====================================================== */}

        <div className="po-modal">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="po-modal-header">

            <div>

              <h3 className="po-modal-title">
                {isEdit
                  ? "Edit Purchase Order"
                  : "Create Purchase Order"}
              </h3>

              <p className="po-modal-subtitle">
                {isEdit
                  ? "Update purchase order information."
                  : "Add a new purchase order to the system."}
              </p>

            </div>

            <button
              type="button"
              className="po-close-button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            >
              ×
            </button>

          </div>

          {/* ====================================================
              BODY
          ==================================================== */}

          <div className="po-modal-body">

            {error && (
              <div className="po-error">
                {error}
              </div>
            )}

            {loadingOptions ? (

              <div className="po-loading-box">
                Loading vendors and projects...
              </div>

            ) : (

              <form
                id="purchase-order-form"
                onSubmit={handleSubmit}
              >

                {/* ==============================================
                    BASIC DETAILS
                ============================================== */}

                <div className="po-form-grid">

                  {/* PO NUMBER */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      PO Number
                      <span className="po-required">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="poNumber"
                      className="po-form-input"
                      value={
                        formData.poNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="PO-2026-005"
                      disabled={
                        isSubmitting
                      }
                    />

                  </div>

                  {/* VENDOR */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Vendor
                      <span className="po-required">
                        *
                      </span>
                    </label>

                    <select
                      name="vendorId"
                      className="po-form-select"
                      value={
                        formData.vendorId
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    >

                      <option value="">
                        Select Vendor
                      </option>

                      {vendors.map(
                        (vendor) => (
                          <option
                            key={
                              vendor.id
                            }
                            value={
                              vendor.id
                            }
                          >
                            {vendor.name}

                            {vendor.vendorCode
                              ? ` (${vendor.vendorCode})`
                              : ""}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* PROJECT */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Project
                    </label>

                    <select
                      name="projectId"
                      className="po-form-select"
                      value={
                        formData.projectId
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    >

                      <option value="">
                        Select Project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            {project.projectCode
                              ? `${project.projectCode} - `
                              : ""}

                            {project.name}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* STATUS */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Status
                    </label>

                    <select
                      name="status"
                      className="po-form-select"
                      value={
                        formData.status
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
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

                      <option value="received">
                        Received
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>

                  {/* ORDER DATE */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Order Date
                      <span className="po-required">
                        *
                      </span>
                    </label>

                    <input
                      type="date"
                      name="orderDate"
                      className="po-form-input"
                      value={
                        formData.orderDate
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                  </div>

                  {/* EXPECTED DELIVERY */}

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Expected Delivery
                    </label>

                    <input
                      type="date"
                      name="expectedDate"
                      className="po-form-input"
                      value={
                        formData.expectedDate
                      }
                      min={
                        formData.orderDate
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                  </div>

                </div>

                {/* ==============================================
                    AMOUNT DETAILS
                ============================================== */}

                <div className="po-amount-section">

                  <h4 className="po-section-title">
                    Amount Details
                  </h4>

                  <div className="po-form-grid">

                    {/* SUBTOTAL */}

                    <div className="po-form-group">

                      <label className="po-form-label">
                        Subtotal
                      </label>

                      <input
                        type="number"
                        name="subtotal"
                        className="po-form-input"
                        value={
                          formData.subtotal
                        }
                        onChange={
                          handleAmountChange
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                        disabled={
                          isSubmitting
                        }
                      />

                    </div>

                    {/* TAX */}

                    <div className="po-form-group">

                      <label className="po-form-label">
                        Tax Amount
                      </label>

                      <input
                        type="number"
                        name="taxAmount"
                        className="po-form-input"
                        value={
                          formData.taxAmount
                        }
                        onChange={
                          handleAmountChange
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                        disabled={
                          isSubmitting
                        }
                      />

                    </div>

                    {/* TOTAL */}

                    <div className="po-form-group">

                      <label className="po-form-label">
                        Total Amount
                      </label>

                      <input
                        type="number"
                        name="totalAmount"
                        className="po-form-input po-total-input"
                        value={
                          formData.totalAmount
                        }
                        readOnly
                      />

                    </div>

                  </div>

                </div>

                {/* ==============================================
                    REMARKS
                ============================================== */}

                <div className="po-remarks-section">

                  <div className="po-form-group">

                    <label className="po-form-label">
                      Remarks
                    </label>

                    <textarea
                      name="remarks"
                      className="po-form-textarea"
                      value={
                        formData.remarks
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter purchase order remarks..."
                      disabled={
                        isSubmitting
                      }
                    />

                  </div>

                </div>

              </form>

            )}

          </div>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="po-modal-footer">

            <button
              type="button"
              className="po-cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="purchase-order-form"
              className="po-submit-button"
              disabled={
                isSubmitting ||
                loadingOptions
              }
            >
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Purchase Order"
                  : "Create Purchase Order"}
            </button>

          </div>

        </div>

      </div>
    </>
  );
}

export default PurchaseOrderForm;