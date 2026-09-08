import { useEffect, useMemo, useState } from "react";

import {
  createQuotation,
  getCustomers,
  getProjects,
} from "../services/api";

function QuotationForm({
  quotation = null,
  isEdit = false,
  onClose,
  onSave,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    quotationNumber: "",
    quotationCode: "",
    customerId: "",
    projectId: "",
    quotationDate: "",
    validUntil: "",
    status: "draft",
    subtotal: "",
    taxAmount: "",
    totalAmount: "",
    remarks: "",
  });

  // ============================================================
  // DATE FORMAT FOR INPUT
  // ============================================================

  function formatDateForInput(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

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
  // TODAY
  // ============================================================

  function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // ============================================================
  // DEFAULT QUOTATION NUMBER
  // ============================================================

  function generateQuotationNumber() {
    const year = new Date().getFullYear();

    return `QT-${year}-001`;
  }

  // ============================================================
  // LOAD CUSTOMERS + PROJECTS
  // ============================================================

  useEffect(() => {
    async function loadFormData() {
      try {
        setLoadingData(true);
        setError("");

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
          "Failed to load quotation form data:",
          err
        );

        setError(
          err?.message ||
            "Failed to load customers and projects."
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadFormData();
  }, []);

  // ============================================================
  // INITIAL FORM DATA
  // ============================================================

  useEffect(() => {
    if (quotation) {
      setFormData({
        quotationNumber:
          quotation.quotationNumber ||
          quotation.quotationNo ||
          "",

        quotationCode:
          quotation.quotationCode ||
          quotation.code ||
          "",

        customerId:
          quotation.customerId
            ? String(quotation.customerId)
            : "",

        projectId:
          quotation.projectId
            ? String(quotation.projectId)
            : "",

        quotationDate:
          formatDateForInput(
            quotation.quotationDate ||
              quotation.date
          ),

        validUntil:
          formatDateForInput(
            quotation.validUntil
          ),

        status:
          quotation.status ||
          "draft",

        subtotal:
          quotation.subtotal !== null &&
          quotation.subtotal !== undefined
            ? String(quotation.subtotal)
            : "",

        taxAmount:
          quotation.taxAmount !== null &&
          quotation.taxAmount !== undefined
            ? String(quotation.taxAmount)
            : "",

        totalAmount:
          quotation.totalAmount !== null &&
          quotation.totalAmount !== undefined
            ? String(quotation.totalAmount)
            : "",

        remarks:
          quotation.remarks ||
          "",
      });

      return;
    }

    setFormData({
      quotationNumber:
        generateQuotationNumber(),

      quotationCode:
        "QT-001",

      customerId: "",

      projectId: "",

      quotationDate:
        getToday(),

      validUntil: "",

      status: "draft",

      subtotal: "",

      taxAmount: "",

      totalAmount: "",

      remarks: "",
    });
  }, [quotation]);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // ============================================================
  // AUTO CALCULATE TOTAL
  // ============================================================

  const calculatedTotal = useMemo(() => {
    const subtotal =
      Number(formData.subtotal) || 0;

    const taxAmount =
      Number(formData.taxAmount) || 0;

    return subtotal + taxAmount;
  }, [
    formData.subtotal,
    formData.taxAmount,
  ]);

  // ============================================================
  // UPDATE TOTAL WHEN AMOUNTS CHANGE
  // ============================================================

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      totalAmount:
        calculatedTotal.toFixed(2),
    }));
  }, [calculatedTotal]);

  // ============================================================
  // DATE TO ISO
  // ============================================================

  function toISODate(value) {
    if (!value) {
      return null;
    }

    return `${value}T00:00:00.000Z`;
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  function validateForm() {
    if (
      !formData.quotationNumber.trim()
    ) {
      return "Quotation number is required.";
    }

    if (
      !formData.quotationCode.trim()
    ) {
      return "Quotation code is required.";
    }

    if (!formData.customerId) {
      return "Please select a customer.";
    }

    if (!formData.quotationDate) {
      return "Quotation date is required.";
    }

    if (
      formData.validUntil &&
      formData.validUntil <
        formData.quotationDate
    ) {
      return "Valid until date cannot be before quotation date.";
    }

    const subtotal =
      Number(formData.subtotal);

    const taxAmount =
      Number(formData.taxAmount);

    if (
      Number.isNaN(subtotal) ||
      subtotal < 0
    ) {
      return "Please enter a valid subtotal.";
    }

    if (
      Number.isNaN(taxAmount) ||
      taxAmount < 0
    ) {
      return "Please enter a valid tax amount.";
    }

    return "";
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const quotationData = {
        quotationNumber:
          formData.quotationNumber.trim(),

        quotationCode:
          formData.quotationCode.trim(),

        customerId:
          Number(formData.customerId),

        projectId:
          formData.projectId
            ? Number(formData.projectId)
            : null,

        quotationDate:
          toISODate(
            formData.quotationDate
          ),

        validUntil:
          formData.validUntil
            ? toISODate(
                formData.validUntil
              )
            : null,

        status:
          formData.status,

        subtotal:
          Number(formData.subtotal) || 0,

        taxAmount:
          Number(formData.taxAmount) || 0,

        totalAmount:
          Number(formData.totalAmount) || 0,

        remarks:
          formData.remarks.trim() ||
          null,
      };

      if (isEdit) {
        // Edit will be connected from Quotations.jsx
        // in the next step.
        await onSave(
          quotationData
        );

        return;
      }

      await createQuotation(
        quotationData
      );

      await onSave();
    } catch (err) {
      console.error(
        "CREATE QUOTATION ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to create quotation."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="quotation-form-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >

      <div className="quotation-form-modal">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="quotation-form-header">

          <div>

            <h2>
              {isEdit
                ? "Edit Quotation"
                : "Create Quotation"}
            </h2>

            <p>
              {isEdit
                ? "Update quotation information."
                : "Add a new quotation to the system."}
            </p>

          </div>

          <button
            type="button"
            className="quotation-form-close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>

        </div>

        {/* ======================================================
            BODY
        ====================================================== */}

        <form
          className="quotation-form"
          onSubmit={handleSubmit}
        >

          <div className="quotation-form-body">

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

              <div className="quotation-form-error">
                {error}
              </div>

            )}

            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div className="quotation-section">

              <h3>
                Basic Information
              </h3>

              <div className="quotation-form-grid">

                {/* QUOTATION NUMBER */}

                <div className="quotation-field">

                  <label>
                    Quotation Number
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="quotationNumber"
                    value={
                      formData.quotationNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="QT-2026-001"
                    disabled={saving}
                  />

                </div>

                {/* QUOTATION CODE */}

                <div className="quotation-field">

                  <label>
                    Quotation Code
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="quotationCode"
                    value={
                      formData.quotationCode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="QT-001"
                    disabled={saving}
                  />

                </div>

                {/* CUSTOMER */}

                <div className="quotation-field">

                  <label>
                    Customer
                    <span>*</span>
                  </label>

                  <select
                    name="customerId"
                    value={
                      formData.customerId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving ||
                      loadingData
                    }
                  >

                    <option value="">
                      Select Customer
                    </option>

                    {customers.map(
                      (customer) => (

                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {customer.name}
                          {customer.customerCode
                            ? ` (${customer.customerCode})`
                            : ""}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* PROJECT */}

                <div className="quotation-field">

                  <label>
                    Project
                  </label>

                  <select
                    name="projectId"
                    value={
                      formData.projectId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving ||
                      loadingData
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

                {/* QUOTATION DATE */}

                <div className="quotation-field">

                  <label>
                    Quotation Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="quotationDate"
                    value={
                      formData.quotationDate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />

                </div>

                {/* VALID UNTIL */}

                <div className="quotation-field">

                  <label>
                    Valid Until
                  </label>

                  <input
                    type="date"
                    name="validUntil"
                    value={
                      formData.validUntil
                    }
                    onChange={
                      handleChange
                    }
                    min={
                      formData.quotationDate ||
                      undefined
                    }
                    disabled={saving}
                  />

                </div>

                {/* STATUS */}

                <div className="quotation-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="draft">
                      Draft
                    </option>

                    <option value="sent">
                      Sent
                    </option>

                    <option value="approved">
                      Approved
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                    <option value="expired">
                      Expired
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* ==================================================
                AMOUNT DETAILS
            ================================================== */}

            <div className="quotation-section">

              <h3>
                Amount Details
              </h3>

              <div className="quotation-form-grid">

                {/* SUBTOTAL */}

                <div className="quotation-field">

                  <label>
                    Subtotal
                  </label>

                  <input
                    type="number"
                    name="subtotal"
                    value={
                      formData.subtotal
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={saving}
                  />

                </div>

                {/* TAX */}

                <div className="quotation-field">

                  <label>
                    Tax Amount
                  </label>

                  <input
                    type="number"
                    name="taxAmount"
                    value={
                      formData.taxAmount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={saving}
                  />

                </div>

                {/* TOTAL */}

                <div className="quotation-field">

                  <label>
                    Total Amount
                  </label>

                  <input
                    type="number"
                    name="totalAmount"
                    value={
                      formData.totalAmount
                    }
                    readOnly
                  />

                </div>

              </div>

            </div>

            {/* ==================================================
                ADDITIONAL INFORMATION
            ================================================== */}

            <div className="quotation-section">

              <h3>
                Additional Information
              </h3>

              <div className="quotation-field">

                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={
                    formData.remarks
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter any additional remarks..."
                  rows="5"
                  disabled={saving}
                />

              </div>

            </div>

          </div>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="quotation-form-footer">

            <button
              type="button"
              className="quotation-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="quotation-submit-button"
              disabled={
                saving ||
                loadingData
              }
            >

              {saving
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Quotation"
                : "Create Quotation"}

            </button>

          </div>

        </form>

      </div>

      {/* ========================================================
          CSS
      ======================================================== */}

      <style>{`

        /* ======================================================
           OVERLAY
        ====================================================== */

        .quotation-form-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 12px;

          background:
            rgba(15, 23, 42, 0.58);

          backdrop-filter:
            blur(5px);

          overflow-y: auto;
        }

        /* ======================================================
           MODAL
        ====================================================== */

        .quotation-form-modal {
          width: 100%;
          max-width: 840px;

          max-height:
            calc(100vh - 24px);

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
           HEADER
        ====================================================== */

        .quotation-form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding:
            22px 26px;

          border-bottom:
            1px solid #e5eaf0;

          background:
            #ffffff;
        }

        .quotation-form-header h2 {
          margin:
            0 0 5px;

          color:
            #0f172a;

          font-size:
            21px;

          font-weight:
            700;
        }

        .quotation-form-header p {
          margin:
            0;

          color:
            #64748b;

          font-size:
            13px;
        }

        .quotation-form-close {
          width:
            36px;

          height:
            36px;

          min-width:
            36px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

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
        }

        .quotation-form-close:hover {
          background:
            #f8fafc;

          color:
            #0f172a;
        }

        /* ======================================================
           FORM
        ====================================================== */

        .quotation-form {
          display:
            flex;

          flex-direction:
            column;

          min-height:
            0;

          flex: 1;
        }

        .quotation-form-body {
          padding:
            22px 26px;

          overflow-y:
            auto;
        }

        /* ======================================================
           ERROR
        ====================================================== */

        .quotation-form-error {
          margin-bottom:
            18px;

          padding:
            12px 14px;

          border:
            1px solid #fecaca;

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

        /* ======================================================
           SECTION
        ====================================================== */

        .quotation-section {
          margin-bottom:
            24px;

          padding-bottom:
            22px;

          border-bottom:
            1px solid #e5eaf0;
        }

        .quotation-section:last-child {
          margin-bottom:
            0;

          padding-bottom:
            0;

          border-bottom:
            0;
        }

        .quotation-section h3 {
          margin:
            0 0 16px;

          color:
            #0f172a;

          font-size:
            14px;

          font-weight:
            700;
        }

        /* ======================================================
           GRID
        ====================================================== */

        .quotation-form-grid {
          display:
            grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            18px 20px;
        }

        /* ======================================================
           FIELD
        ====================================================== */

        .quotation-field {
          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;
        }

        .quotation-field label {
          margin-bottom:
            7px;

          color:
            #334155;

          font-size:
            12px;

          font-weight:
            600;
        }

        .quotation-field label span {
          margin-left:
            3px;

          color:
            #ef4444;
        }

        .quotation-field input,
        .quotation-field select,
        .quotation-field textarea {
          width:
            100%;

          box-sizing:
            border-box;

          border:
            1px solid #cfd9e5;

          border-radius:
            9px;

          background:
            #ffffff;

          color:
            #1e293b;

          font-family:
            inherit;

          font-size:
            13px;

          outline:
            none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .quotation-field input,
        .quotation-field select {
          height:
            44px;

          padding:
            0 13px;
        }

        .quotation-field textarea {
          min-height:
            110px;

          padding:
            12px 13px;

          resize:
            vertical;

          line-height:
            1.5;
        }

        .quotation-field input:focus,
        .quotation-field select:focus,
        .quotation-field textarea:focus {
          border-color:
            #2563eb;

          box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, 0.10);
        }

        .quotation-field input::placeholder,
        .quotation-field textarea::placeholder {
          color:
            #94a3b8;
        }

        .quotation-field input:disabled,
        .quotation-field select:disabled,
        .quotation-field textarea:disabled {
          background:
            #f8fafc;

          cursor:
            not-allowed;

          opacity:
            0.75;
        }

        .quotation-field input[readonly] {
          background:
            #f1f5f9;

          color:
            #2563eb;

          font-weight:
            700;

          cursor:
            default;
        }

        /* ======================================================
           FOOTER
        ====================================================== */

        .quotation-form-footer {
          display:
            flex;

          justify-content:
            flex-end;

          gap:
            10px;

          padding:
            16px 26px;

          border-top:
            1px solid #e5eaf0;

          background:
            #ffffff;
        }

        .quotation-cancel-button,
        .quotation-submit-button {
          height:
            42px;

          padding:
            0 18px;

          border-radius:
            9px;

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

        .quotation-cancel-button {
          border:
            1px solid #d6dee8;

          background:
            #ffffff;

          color:
            #334155;
        }

        .quotation-cancel-button:hover {
          background:
            #f8fafc;
        }

        .quotation-submit-button {
          border:
            1px solid #2563eb;

          background:
            #2563eb;

          color:
            #ffffff;
        }

        .quotation-submit-button:hover {
          background:
            #1d4ed8;

          border-color:
            #1d4ed8;
        }

        .quotation-cancel-button:disabled,
        .quotation-submit-button:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;
        }

        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 700px) {

          .quotation-form-overlay {
            padding:
              8px;

            align-items:
              flex-start;
          }

          .quotation-form-modal {
            max-height:
              calc(100vh - 16px);

            border-radius:
              12px;
          }

          .quotation-form-header {
            padding:
              18px;
          }

          .quotation-form-body {
            padding:
              18px;
          }

          .quotation-form-footer {
            padding:
              14px 18px;
          }

          .quotation-form-grid {
            grid-template-columns:
              1fr;
          }

          .quotation-form-header h2 {
            font-size:
              18px;
          }

        }

      `}</style>

    </div>
  );
}

export default QuotationForm;