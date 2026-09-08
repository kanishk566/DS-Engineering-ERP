import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getInvoices,
  getInvoice,
  getInvoiceItemsByInvoice,
  deleteInvoice,
  getPaymentsByInvoice,
  createPayment,
  deletePayment,
} from "../../services/api";


export default function Invoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  // ============================================================
  // PAYMENT STATES
  // ============================================================

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [payments, setPayments] = useState([]);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentForm, setPaymentForm] = useState({
    paymentNumber: "",
    paymentDate: new Date()
      .toISOString()
      .slice(0, 10),
    amount: "",
    paymentMethod: "bank_transfer",
    referenceNumber: "",
    notes: "",
  });


  // ============================================================
  // LOAD INVOICES
  // ============================================================

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const result = await getInvoices();

      if (result?.success) {
        const data = result.data || [];

        setInvoices(data);

        return data;
      }

      setInvoices([]);

      setError(
        result?.message ||
          "Failed to load invoices."
      );

      return [];
    } catch (err) {
      console.error(
        "Load Invoices Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load invoices."
      );

      return [];
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadInvoices();
  }, []);


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  function formatCurrency(value) {
    const amount = Number(value || 0);

    return amount.toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  }


  function formatPdfCurrency(value) {
    const amount = Number(value || 0);

    return `Rs. ${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
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
  // STATUS LABEL
  // ============================================================

  function getStatusLabel(status) {
    if (!status) {
      return "Draft";
    }

    const value = String(status);

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );
  }


  // ============================================================
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    switch (status) {
      case "sent":
        return "status sent";

      case "partial":
        return "status partial";

      case "paid":
        return "status paid";

      case "overdue":
        return "status overdue";

      case "cancelled":
        return "status cancelled";

      default:
        return "status draft";
    }
  }


  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredInvoices = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchText ||
        String(
          invoice.invoiceNumber || ""
        )
          .toLowerCase()
          .includes(searchText) ||

        String(
          invoice.customerId || ""
        )
          .toLowerCase()
          .includes(searchText) ||

        String(
          invoice.projectId || ""
        )
          .toLowerCase()
          .includes(searchText) ||

        String(
          invoice.notes || ""
        )
          .toLowerCase()
          .includes(searchText);


      const matchesStatus =
        statusFilter === "all" ||
        invoice.status === statusFilter;


      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    invoices,
    search,
    statusFilter,
  ]);


  // ============================================================
  // DELETE INVOICE
  // ============================================================

  async function handleDelete(invoice) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteInvoice(invoice.id);

      setInvoices((previous) =>
        previous.filter(
          (item) =>
            item.id !== invoice.id
        )
      );
    } catch (err) {
      console.error(
        "Delete Invoice Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete invoice."
      );
    }
  }


  // ============================================================
  // ADD INVOICE
  // ============================================================

  function handleAddInvoice() {
    navigate("/invoices/new");
  }


  // ============================================================
  // EDIT INVOICE
  // ============================================================

  function handleEditInvoice(invoice) {
    navigate(
      `/invoices/edit/${invoice.id}`
    );
  }


  // ============================================================
  // LOAD PAYMENTS
  // ============================================================

  async function loadInvoicePayments(
    invoiceId
  ) {
    try {
      setPaymentLoading(true);
      setPaymentError("");

      const result =
        await getPaymentsByInvoice(
          invoiceId
        );

      if (result?.success) {
        setPayments(
          result.data || []
        );
      } else {
        setPayments([]);

        setPaymentError(
          result?.message ||
            "Failed to load payments."
        );
      }
    } catch (err) {
      console.error(
        "Load Payments Error:",
        err
      );

      setPayments([]);

      setPaymentError(
        err?.message ||
          "Failed to load payments."
      );
    } finally {
      setPaymentLoading(false);
    }
  }


  // ============================================================
  // OPEN PAYMENT MODAL
  // ============================================================

  async function handleOpenPayment(
    invoice
  ) {
    setSelectedInvoice(invoice);

    setPaymentForm({
      paymentNumber:
        `PAY-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-6)}`,

      paymentDate:
        new Date()
          .toISOString()
          .slice(0, 10),

      amount: "",

      paymentMethod:
        "bank_transfer",

      referenceNumber: "",

      notes: "",
    });

    setPaymentError("");
    setPayments([]);
    setPaymentModalOpen(true);

    await loadInvoicePayments(
      invoice.id
    );
  }


  // ============================================================
  // CLOSE PAYMENT MODAL
  // ============================================================

  function handleClosePayment() {
    if (paymentSaving) {
      return;
    }

    setPaymentModalOpen(false);
    setSelectedInvoice(null);
    setPayments([]);
    setPaymentError("");
  }


  // ============================================================
  // PAYMENT FORM CHANGE
  // ============================================================

  function handlePaymentChange(event) {
    const {
      name,
      value,
    } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // ============================================================
  // CREATE PAYMENT
  // ============================================================

  async function handleCreatePayment(
    event
  ) {
    event.preventDefault();

    if (!selectedInvoice) {
      return;
    }

    const amount =
      Number(paymentForm.amount);

    const totalAmount =
      Number(
        selectedInvoice.totalAmount || 0
      );

    const paidAmount =
      Number(
        selectedInvoice.paidAmount || 0
      );

    const remainingAmount =
      Math.max(
        totalAmount - paidAmount,
        0
      );


    if (
      !paymentForm.paymentNumber.trim()
    ) {
      setPaymentError(
        "Payment number is required."
      );

      return;
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setPaymentError(
        "Enter a valid payment amount."
      );

      return;
    }


    if (
      totalAmount > 0 &&
      amount > remainingAmount
    ) {
      setPaymentError(
        `Payment cannot exceed remaining balance of ${formatCurrency(
          remainingAmount
        )}.`
      );

      return;
    }


    try {
      setPaymentSaving(true);
      setPaymentError("");

      const result =
        await createPayment({
          paymentNumber:
            paymentForm.paymentNumber.trim(),

          invoiceId:
            selectedInvoice.id,

          paymentDate:
            paymentForm.paymentDate,

          amount,

          paymentMethod:
            paymentForm.paymentMethod,

          referenceNumber:
            paymentForm.referenceNumber.trim(),

          notes:
            paymentForm.notes.trim(),
        });


      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to create payment."
        );
      }


      // Refresh invoice list
      const updatedInvoices =
        await loadInvoices();


      // Update selected invoice
      const updatedInvoice =
        updatedInvoices.find(
          (invoice) =>
            invoice.id ===
            selectedInvoice.id
        );


      if (updatedInvoice) {
        setSelectedInvoice(
          updatedInvoice
        );
      }


      // Refresh payment history
      await loadInvoicePayments(
        selectedInvoice.id
      );


      // Reset payment fields
      setPaymentForm((previous) => ({
        ...previous,

        paymentNumber:
          `PAY-${new Date().getFullYear()}-${String(
            Date.now()
          ).slice(-6)}`,

        amount: "",

        referenceNumber: "",

        notes: "",
      }));

    } catch (err) {
      console.error(
        "Create Payment Error:",
        err
      );

      setPaymentError(
        err?.message ||
          "Failed to create payment."
      );
    } finally {
      setPaymentSaving(false);
    }
  }


  // ============================================================
  // DELETE PAYMENT
  // ============================================================

  async function handleDeletePayment(
    payment
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete payment ${payment.paymentNumber}?`
      );

    if (!confirmed) {
      return;
    }


    try {
      setPaymentError("");

      const result =
        await deletePayment(
          payment.id
        );


      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete payment."
        );
      }


      // Refresh invoices
      const updatedInvoices =
        await loadInvoices();


      // Update selected invoice
      if (selectedInvoice) {
        const updatedInvoice =
          updatedInvoices.find(
            (invoice) =>
              invoice.id ===
              selectedInvoice.id
          );

        if (updatedInvoice) {
          setSelectedInvoice(
            updatedInvoice
          );
        }


        await loadInvoicePayments(
          selectedInvoice.id
        );
      }

    } catch (err) {
      console.error(
        "Delete Payment Error:",
        err
      );

      setPaymentError(
        err?.message ||
          "Failed to delete payment."
      );
    }
  }


  // ============================================================
  // DOWNLOAD INVOICE PDF
  // ============================================================

  async function handleDownloadPdf(invoice) {
    try {
      setError("");

      const [invoiceResult, itemsResult, paymentsResult] =
        await Promise.all([
          getInvoice(invoice.id),
          getInvoiceItemsByInvoice(invoice.id),
          getPaymentsByInvoice(invoice.id),
        ]);

      if (!invoiceResult?.success) {
        throw new Error(
          invoiceResult?.message ||
            "Failed to fetch invoice details."
        );
      }

      const pdfInvoice = invoiceResult.data || invoice;
      const items = itemsResult?.success
        ? itemsResult.data || []
        : [];
      const paymentRows = paymentsResult?.success
        ? paymentsResult.data || []
        : [];

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      const invoiceNumber =
        pdfInvoice.invoiceNumber ||
        invoice.invoiceNumber ||
        `INV-${pdfInvoice.id}`;

      const customerLabel =
        pdfInvoice.customer?.name ||
        pdfInvoice.customerName ||
        `Customer #${pdfInvoice.customerId || "-"}`;

      const projectLabel =
        pdfInvoice.project?.name ||
        pdfInvoice.projectName ||
        (pdfInvoice.projectId
          ? `Project #${pdfInvoice.projectId}`
          : "-");

      const subtotal = Number(
        pdfInvoice.subtotal || 0
      );
      const taxAmount = Number(
        pdfInvoice.taxAmount || 0
      );
      const totalAmount = Number(
        pdfInvoice.totalAmount || 0
      );
      const paidAmount = Number(
        pdfInvoice.paidAmount || 0
      );
      const balanceDue = Math.max(
        totalAmount - paidAmount,
        0
      );

      // --------------------------------------------------------
      // HEADER
      // --------------------------------------------------------

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("DS Engineering", margin, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "ERP System | Industrial Engineering & Equipment",
        margin,
        26
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(
        "INVOICE",
        pageWidth - margin,
        20,
        { align: "right" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Invoice No: ${invoiceNumber}`,
        pageWidth - margin,
        27,
        { align: "right" }
      );

      doc.line(
        margin,
        33,
        pageWidth - margin,
        33
      );

      // --------------------------------------------------------
      // INVOICE INFORMATION
      // --------------------------------------------------------

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Bill To", margin, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        customerLabel,
        margin,
        49
      );
      doc.text(
        `Customer ID: ${pdfInvoice.customerId || "-"}`,
        margin,
        55
      );
      doc.text(
        `Project: ${projectLabel}`,
        margin,
        61
      );

      const infoX = pageWidth - margin - 70;
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Date:", infoX, 42);
      doc.text("Due Date:", infoX, 49);
      doc.text("Status:", infoX, 56);

      doc.setFont("helvetica", "normal");
      doc.text(
        formatDate(pdfInvoice.invoiceDate),
        infoX + 30,
        42
      );
      doc.text(
        formatDate(pdfInvoice.dueDate),
        infoX + 30,
        49
      );
      doc.text(
        getStatusLabel(pdfInvoice.status),
        infoX + 30,
        56
      );

      // --------------------------------------------------------
      // ITEMS TABLE
      // --------------------------------------------------------

      const tableRows = items.length
        ? items.map((item, index) => [
            String(index + 1),
            item.itemName || "-",
            item.description || "-",
            Number(item.quantity || 0).toLocaleString(
              "en-IN",
              { maximumFractionDigits: 2 }
            ),
            item.unit || "-",
            formatPdfCurrency(item.unitPrice),
            formatPdfCurrency(item.totalPrice),
          ])
        : [["1", "No items", "-", "-", "-", "-", formatPdfCurrency(0)]];

      autoTable(doc, {
        startY: 69,
        margin: { left: margin, right: margin },
        head: [[
          "#",
          "Item",
          "Description",
          "Qty",
          "Unit",
          "Unit Price",
          "Total",
        ]],
        body: tableRows,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          valign: "middle",
        },
        headStyles: {
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 9, halign: "center" },
          1: { cellWidth: 35 },
          2: { cellWidth: 48 },
          3: { cellWidth: 15, halign: "right" },
          4: { cellWidth: 15, halign: "center" },
          5: { cellWidth: 30, halign: "right" },
          6: { cellWidth: 32, halign: "right" },
        },
      });

      let currentY =
        (doc.lastAutoTable?.finalY || 69) + 10;

      // --------------------------------------------------------
      // TOTALS
      // --------------------------------------------------------

      const totalsX = pageWidth - margin - 75;
      const valueX = pageWidth - margin;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Subtotal", totalsX, currentY);
      doc.text(
        formatPdfCurrency(subtotal),
        valueX,
        currentY,
        { align: "right" }
      );

      currentY += 7;
      doc.text("Tax", totalsX, currentY);
      doc.text(
        formatPdfCurrency(taxAmount),
        valueX,
        currentY,
        { align: "right" }
      );

      currentY += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total Amount", totalsX, currentY);
      doc.text(
        formatPdfCurrency(totalAmount),
        valueX,
        currentY,
        { align: "right" }
      );

      currentY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Paid Amount", totalsX, currentY);
      doc.text(
        formatPdfCurrency(paidAmount),
        valueX,
        currentY,
        { align: "right" }
      );

      currentY += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Balance Due", totalsX, currentY);
      doc.text(
        formatPdfCurrency(balanceDue),
        valueX,
        currentY,
        { align: "right" }
      );

      // --------------------------------------------------------
      // PAYMENT HISTORY
      // --------------------------------------------------------

      currentY += 14;

      if (paymentRows.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Payment History", margin, currentY);

        const paymentTableRows = paymentRows.map(
          (payment, index) => [
            String(index + 1),
            payment.paymentNumber || "-",
            formatDate(payment.paymentDate),
            String(payment.paymentMethod || "-")
              .replaceAll("_", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            formatPdfCurrency(payment.amount),
            payment.referenceNumber || "-",
          ]
        );

        autoTable(doc, {
          startY: currentY + 4,
          margin: { left: margin, right: margin },
          head: [[
            "#",
            "Payment No.",
            "Date",
            "Method",
            "Amount",
            "Reference",
          ]],
          body: paymentTableRows,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
          },
          headStyles: {
            fontStyle: "bold",
          },
        });

        currentY =
          (doc.lastAutoTable?.finalY || currentY) + 10;
      }

      // --------------------------------------------------------
      // NOTES
      // --------------------------------------------------------

      if (pdfInvoice.notes) {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Notes", margin, currentY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(
          String(pdfInvoice.notes),
          pageWidth - margin * 2
        );
        doc.text(
          noteLines,
          margin,
          currentY + 6
        );
      }

      // --------------------------------------------------------
      // FOOTER ON EVERY PAGE
      // --------------------------------------------------------

      const pageCount = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(
          "Thank you for your business.",
          margin,
          pageHeight - 10
        );
        doc.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      const safeFileName = invoiceNumber
        .replace(/[^a-z0-9_-]/gi, "-")
        .replace(/-+/g, "-");

      doc.save(`${safeFileName}.pdf`);
    } catch (err) {
      console.error(
        "Download Invoice PDF Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to generate invoice PDF."
      );
    }
  }


  // ============================================================
  // REFRESH
  // ============================================================

  function handleRefresh() {
    loadInvoices();
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <style>{`

        /* ======================================================
           INVOICES PAGE
        ====================================================== */

        .invoices-page {
          padding: 24px;
          min-height: 100%;
          background: #f7f9fc;
          box-sizing: border-box;
        }

        .invoices-container {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }


        /* ======================================================
           HEADER
        ====================================================== */

        .invoices-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .invoices-title-area h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #172033;
        }

        .invoices-title-area p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }


        /* ======================================================
           BUTTONS
        ====================================================== */

        .btn {
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
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
          background: #0d6efd;
          color: #fff;
        }

        .btn-primary:hover {
          background: #0b5ed7;
        }

        .btn-secondary {
          background: #fff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }


        /* ======================================================
           SUMMARY
        ====================================================== */

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px;
          box-shadow:
            0 2px 8px
            rgba(16, 24, 40, 0.04);
        }

        .summary-label {
          font-size: 13px;
          color: #667085;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #172033;
        }


        /* ======================================================
           FILTERS
        ====================================================== */

        .filters-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 240px;
        }

        .search-box input,
        .status-select {
          width: 100%;
          height: 42px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
          box-sizing: border-box;
        }

        .search-box input:focus,
        .status-select:focus {
          border-color: #0d6efd;
          box-shadow:
            0 0 0 3px
            rgba(13, 110, 253, 0.1);
        }

        .status-filter {
          width: 180px;
        }


        /* ======================================================
           TABLE
        ====================================================== */

        .table-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow:
            0 2px 8px
            rgba(16, 24, 40, 0.04);
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1150px;
        }

        .invoice-table th {
          background: #f8fafc;
          color: #475467;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #eaecf0;
          white-space: nowrap;
        }

        .invoice-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #eaecf0;
          color: #344054;
          font-size: 14px;
          white-space: nowrap;
        }

        .invoice-table tbody tr:hover {
          background: #fafcff;
        }

        .invoice-table tbody tr:last-child td {
          border-bottom: none;
        }

        .invoice-number {
          color: #0d6efd;
          font-weight: 700;
        }

        .amount {
          font-weight: 700;
          color: #172033;
        }


        /* ======================================================
           STATUS
        ====================================================== */

        .status {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status.draft {
          background: #f2f4f7;
          color: #475467;
        }

        .status.sent {
          background: #eff8ff;
          color: #175cd3;
        }

        .status.partial {
          background: #fffaeb;
          color: #b54708;
        }

        .status.paid {
          background: #ecfdf3;
          color: #027a48;
        }

        .status.overdue {
          background: #fef3f2;
          color: #b42318;
        }

        .status.cancelled {
          background: #fef3f2;
          color: #912018;
        }


        /* ======================================================
           ACTION BUTTONS
        ====================================================== */

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .action-btn {
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .action-btn:hover {
          background: #f8fafc;
        }

        .delete-btn {
          color: #b42318;
        }

        .payment-btn {
          color: #027a48;
          border-color: #abefc6;
        }

        .payment-btn:hover {
          background: #ecfdf3;
        }

        .pdf-btn {
          color: #175cd3;
          border-color: #b2ddff;
        }

        .pdf-btn:hover {
          background: #eff8ff;
        }


        /* ======================================================
           STATES
        ====================================================== */

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 55px 20px;
          color: #667085;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e5e7eb;
          border-top-color: #0d6efd;
          border-radius: 50%;
          margin: 0 auto 12px;
          animation:
            invoiceSpin
            0.8s linear infinite;
        }

        @keyframes invoiceSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-box {
          background: #fef3f2;
          border: 1px solid #fecdca;
          color: #b42318;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 18px;
          font-size: 14px;
        }


        /* ======================================================
           TABLE FOOTER
        ====================================================== */

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-top: 1px solid #eaecf0;
          color: #667085;
          font-size: 13px;
          flex-wrap: wrap;
          gap: 10px;
        }


        /* ======================================================
           PAYMENT MODAL
        ====================================================== */

        .payment-modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(16, 24, 40, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .payment-modal {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          box-shadow:
            0 20px 60px
            rgba(16, 24, 40, 0.20);
        }

        .payment-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .payment-modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #172033;
        }

        .payment-close {
          border: none;
          background: transparent;
          font-size: 26px;
          cursor: pointer;
          color: #667085;
          line-height: 1;
        }

        .payment-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
          padding: 18px 22px;
          background: #f8fafc;
        }

        .payment-summary-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          padding: 12px;
        }

        .payment-summary-label {
          font-size: 12px;
          color: #667085;
          margin-bottom: 5px;
        }

        .payment-summary-value {
          font-size: 17px;
          font-weight: 700;
          color: #172033;
        }


        /* ======================================================
           PAYMENT FORM
        ====================================================== */

        .payment-form {
          padding: 22px;
        }

        .payment-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 15px;
        }

        .payment-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .payment-field.full {
          grid-column: 1 / -1;
        }

        .payment-field label {
          font-size: 13px;
          font-weight: 600;
          color: #344054;
        }

        .payment-field input,
        .payment-field select,
        .payment-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .payment-field textarea {
          min-height: 80px;
          resize: vertical;
        }

        .payment-field input:focus,
        .payment-field select:focus,
        .payment-field textarea:focus {
          border-color: #0d6efd;
          box-shadow:
            0 0 0 3px
            rgba(13, 110, 253, 0.1);
        }

        .payment-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid #eaecf0;
        }


        /* ======================================================
           PAYMENT HISTORY
        ====================================================== */

        .payment-history {
          padding: 0 22px 22px;
        }

        .payment-history h3 {
          margin: 0 0 12px;
          font-size: 16px;
          color: #172033;
        }

        .payment-history-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }

        .payment-history-table th,
        .payment-history-table td {
          padding: 10px;
          border-bottom: 1px solid #eaecf0;
          text-align: left;
          font-size: 13px;
        }

        .payment-history-table th {
          color: #667085;
          font-size: 11px;
          text-transform: uppercase;
        }

        .payment-delete {
          border: none;
          background: transparent;
          color: #b42318;
          cursor: pointer;
          font-weight: 600;
        }


        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 1000px) {
          .summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }


        @media (max-width: 650px) {
          .invoices-page {
            padding: 14px;
          }

          .invoices-title-area h1 {
            font-size: 23px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .status-filter {
            width: 100%;
          }

          .search-box {
            width: 100%;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
          }

          .payment-summary {
            grid-template-columns: 1fr;
          }

          .payment-form-grid {
            grid-template-columns: 1fr;
          }

          .payment-field.full {
            grid-column: auto;
          }

          .payment-modal {
            max-height: 95vh;
          }
        }

      `}</style>


      <div className="invoices-page">

        <div className="invoices-container">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="invoices-header">

            <div className="invoices-title-area">

              <h1>
                Invoices
              </h1>

              <p>
                Manage customer invoices,
                payments and billing.
              </p>

            </div>


            <div className="header-actions">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                ↻ Refresh
              </button>


              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  handleAddInvoice
                }
              >
                + Add Invoice
              </button>

            </div>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="summary-grid">

            <div className="summary-card">

              <div className="summary-label">
                Total Invoices
              </div>

              <div className="summary-value">
                {invoices.length}
              </div>

            </div>


            <div className="summary-card">

              <div className="summary-label">
                Draft
              </div>

              <div className="summary-value">
                {
                  invoices.filter(
                    (invoice) =>
                      invoice.status ===
                      "draft"
                  ).length
                }
              </div>

            </div>


            <div className="summary-card">

              <div className="summary-label">
                Paid
              </div>

              <div className="summary-value">
                {
                  invoices.filter(
                    (invoice) =>
                      invoice.status ===
                      "paid"
                  ).length
                }
              </div>

            </div>


            <div className="summary-card">

              <div className="summary-label">
                Total Amount
              </div>

              <div className="summary-value">
                {formatCurrency(
                  invoices.reduce(
                    (sum, invoice) =>
                      sum +
                      Number(
                        invoice.totalAmount ||
                          0
                      ),
                    0
                  )
                )}
              </div>

            </div>

          </div>


          {/* ==================================================
              FILTERS
          ================================================== */}

          <div className="filters-card">

            <div className="filters">

              <div className="search-box">

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search invoice number, customer ID, project ID..."
                />

              </div>


              <div className="status-filter">

                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="all">
                    All Status
                  </option>

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

            </div>

          </div>


          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="table-card">

            {loading ? (

              <div className="loading-state">

                <div className="loading-spinner" />

                Loading invoices...

              </div>

            ) : filteredInvoices.length ===
              0 ? (

              <div className="empty-state">

                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "10px",
                  }}
                >
                  📄
                </div>

                <strong>
                  No invoices found
                </strong>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                  }}
                >
                  {search ||
                  statusFilter !== "all"
                    ? "Try changing your search or filter."
                    : "Create your first invoice to get started."}
                </div>

              </div>

            ) : (

              <>

                <div className="table-wrapper">

                  <table className="invoice-table">

                    <thead>

                      <tr>

                        <th>
                          Invoice
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Project
                        </th>

                        <th>
                          Invoice Date
                        </th>

                        <th>
                          Due Date
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Subtotal
                        </th>

                        <th>
                          Tax
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Paid
                        </th>

                        <th>
                          Actions
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredInvoices.map(
                        (invoice) => (

                          <tr
                            key={
                              invoice.id
                            }
                          >

                            <td>

                              <span className="invoice-number">

                                {
                                  invoice.invoiceNumber ||
                                  "-"
                                }

                              </span>

                            </td>


                            <td>
                              Customer #
                              {invoice.customerId ||
                                "-"}
                            </td>


                            <td>

                              {invoice.projectId
                                ? `Project #${invoice.projectId}`
                                : "-"}

                            </td>


                            <td>

                              {formatDate(
                                invoice.invoiceDate
                              )}

                            </td>


                            <td>

                              {formatDate(
                                invoice.dueDate
                              )}

                            </td>


                            <td>

                              <span
                                className={getStatusClass(
                                  invoice.status
                                )}
                              >

                                {getStatusLabel(
                                  invoice.status
                                )}

                              </span>

                            </td>


                            <td>

                              {formatCurrency(
                                invoice.subtotal
                              )}

                            </td>


                            <td>

                              {formatCurrency(
                                invoice.taxAmount
                              )}

                            </td>


                            <td>

                              <span className="amount">

                                {formatCurrency(
                                  invoice.totalAmount
                                )}

                              </span>

                            </td>


                            <td>

                              {formatCurrency(
                                invoice.paidAmount
                              )}

                            </td>


                            <td>

                              <div className="action-buttons">


                                {/* PDF */}

                                <button
                                  type="button"
                                  className="action-btn pdf-btn"
                                  onClick={() =>
                                    handleDownloadPdf(
                                      invoice
                                    )
                                  }
                                >
                                  📄 PDF
                                </button>


                                {/* PAYMENT */}

                                <button
                                  type="button"
                                  className="action-btn payment-btn"
                                  onClick={() =>
                                    handleOpenPayment(
                                      invoice
                                    )
                                  }
                                >
                                  💰 Payment
                                </button>


                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="action-btn"
                                  onClick={() =>
                                    handleEditInvoice(
                                      invoice
                                    )
                                  }
                                >
                                  Edit
                                </button>


                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  onClick={() =>
                                    handleDelete(
                                      invoice
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


                <div className="table-footer">

                  <span>

                    Showing{" "}

                    <strong>
                      {
                        filteredInvoices.length
                      }
                    </strong>

                    {" "}of{" "}

                    <strong>
                      {invoices.length}
                    </strong>

                    {" "}invoices

                  </span>

                </div>

              </>

            )}

          </div>

        </div>

      </div>


      {/* ========================================================
          PAYMENT MODAL
      ======================================================== */}

      {paymentModalOpen &&
        selectedInvoice && (

          <div
            className="payment-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                handleClosePayment();
              }

            }}
          >

            <div className="payment-modal">


              {/* ==================================================
                  MODAL HEADER
              ================================================== */}

              <div className="payment-modal-header">

                <div>

                  <h2>
                    Add Payment
                  </h2>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#667085",
                      fontSize: "13px",
                    }}
                  >
                    Invoice:{" "}
                    <strong>
                      {
                        selectedInvoice.invoiceNumber
                      }
                    </strong>
                  </div>

                </div>


                <button
                  type="button"
                  className="payment-close"
                  onClick={
                    handleClosePayment
                  }
                >
                  ×
                </button>

              </div>


              {/* ==================================================
                  PAYMENT SUMMARY
              ================================================== */}

              <div className="payment-summary">


                <div className="payment-summary-card">

                  <div className="payment-summary-label">
                    Invoice Total
                  </div>

                  <div className="payment-summary-value">
                    {formatCurrency(
                      selectedInvoice.totalAmount
                    )}
                  </div>

                </div>


                <div className="payment-summary-card">

                  <div className="payment-summary-label">
                    Paid
                  </div>

                  <div className="payment-summary-value">
                    {formatCurrency(
                      selectedInvoice.paidAmount
                    )}
                  </div>

                </div>


                <div className="payment-summary-card">

                  <div className="payment-summary-label">
                    Remaining
                  </div>

                  <div className="payment-summary-value">
                    {formatCurrency(
                      Math.max(
                        Number(
                          selectedInvoice.totalAmount ||
                            0
                        ) -
                          Number(
                            selectedInvoice.paidAmount ||
                              0
                          ),
                        0
                      )
                    )}
                  </div>

                </div>

              </div>


              {/* ==================================================
                  PAYMENT ERROR
              ================================================== */}

              {paymentError && (

                <div
                  className="error-box"
                  style={{
                    margin:
                      "18px 22px 0",
                  }}
                >
                  {paymentError}
                </div>

              )}


              {/* ==================================================
                  PAYMENT FORM
              ================================================== */}

              <form
                className="payment-form"
                onSubmit={
                  handleCreatePayment
                }
              >

                <div className="payment-form-grid">


                  {/* PAYMENT NUMBER */}

                  <div className="payment-field">

                    <label>
                      Payment Number *
                    </label>

                    <input
                      type="text"
                      name="paymentNumber"
                      value={
                        paymentForm.paymentNumber
                      }
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="PAY-2026-000001"
                    />

                  </div>


                  {/* PAYMENT DATE */}

                  <div className="payment-field">

                    <label>
                      Payment Date *
                    </label>

                    <input
                      type="date"
                      name="paymentDate"
                      value={
                        paymentForm.paymentDate
                      }
                      onChange={
                        handlePaymentChange
                      }
                    />

                  </div>


                  {/* AMOUNT */}

                  <div className="payment-field">

                    <label>
                      Amount *
                    </label>

                    <input
                      type="number"
                      name="amount"
                      value={
                        paymentForm.amount
                      }
                      onChange={
                        handlePaymentChange
                      }
                      min="0.01"
                      step="0.01"
                      placeholder="Enter payment amount"
                    />

                  </div>


                  {/* PAYMENT METHOD */}

                  <div className="payment-field">

                    <label>
                      Payment Method *
                    </label>

                    <select
                      name="paymentMethod"
                      value={
                        paymentForm.paymentMethod
                      }
                      onChange={
                        handlePaymentChange
                      }
                    >

                      <option value="bank_transfer">
                        Bank Transfer
                      </option>

                      <option value="cash">
                        Cash
                      </option>

                      <option value="cheque">
                        Cheque
                      </option>

                      <option value="upi">
                        UPI
                      </option>

                      <option value="card">
                        Card
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>


                  {/* REFERENCE */}

                  <div className="payment-field full">

                    <label>
                      Reference Number
                    </label>

                    <input
                      type="text"
                      name="referenceNumber"
                      value={
                        paymentForm.referenceNumber
                      }
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="Transaction / cheque / UTR number"
                    />

                  </div>


                  {/* NOTES */}

                  <div className="payment-field full">

                    <label>
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      value={
                        paymentForm.notes
                      }
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="Payment notes..."
                    />

                  </div>

                </div>


                {/* ==================================================
                    FORM BUTTONS
                ================================================== */}

                <div className="payment-modal-footer">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                      handleClosePayment
                    }
                    disabled={
                      paymentSaving
                    }
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      paymentSaving
                    }
                  >
                    {paymentSaving
                      ? "Saving..."
                      : "Save Payment"}
                  </button>

                </div>

              </form>


              {/* ==================================================
                  PAYMENT HISTORY
              ================================================== */}

              <div className="payment-history">

                <h3>
                  Payment History
                </h3>


                {paymentLoading ? (

                  <div
                    style={{
                      padding:
                        "20px 0",
                      color:
                        "#667085",
                    }}
                  >
                    Loading payments...
                  </div>

                ) : payments.length ===
                  0 ? (

                  <div
                    style={{
                      padding:
                        "15px 0",
                      color:
                        "#667085",
                      fontSize:
                        "13px",
                    }}
                  >
                    No payments recorded yet.
                  </div>

                ) : (

                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >

                    <table className="payment-history-table">

                      <thead>

                        <tr>

                          <th>
                            Payment
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Method
                          </th>

                          <th>
                            Amount
                          </th>

                          <th>
                            Reference
                          </th>

                          <th>
                            Action
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {payments.map(
                          (payment) => (

                            <tr
                              key={
                                payment.id
                              }
                            >

                              <td>
                                {
                                  payment.paymentNumber ||
                                  "-"
                                }
                              </td>


                              <td>
                                {formatDate(
                                  payment.paymentDate
                                )}
                              </td>


                              <td>

                                {String(
                                  payment.paymentMethod ||
                                    "other"
                                )
                                  .replace(
                                    /_/g,
                                    " "
                                  )
                                  .replace(
                                    /^./,
                                    (char) =>
                                      char.toUpperCase()
                                  )}

                              </td>


                              <td>

                                <strong>
                                  {formatCurrency(
                                    payment.amount
                                  )}
                                </strong>

                              </td>


                              <td>
                                {
                                  payment.referenceNumber ||
                                  "-"
                                }
                              </td>


                              <td>

                                <button
                                  type="button"
                                  className="payment-delete"
                                  onClick={() =>
                                    handleDeletePayment(
                                      payment
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

          </div>

        )}

    </>
  );
}