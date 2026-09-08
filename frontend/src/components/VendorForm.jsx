import { useState } from "react";

function VendorForm({ onClose, onSave, loading = false }) {
  const [formData, setFormData] = useState({
    vendorCode: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
  });

  const [error, setError] = useState("");

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Vendor name is required.");
      return;
    }

    if (!formData.vendorCode.trim()) {
      setError("Vendor code is required.");
      return;
    }

    if (formData.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(formData.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (onSave) {
      try {
        await onSave({
          vendorCode: formData.vendorCode.trim(),
          name: formData.name.trim(),
          contactPerson:
            formData.contactPerson.trim() || null,
          email:
            formData.email.trim() || null,
          phone:
            formData.phone.trim() || null,
          address:
            formData.address.trim() || null,
          gstNumber:
            formData.gstNumber.trim() || null,
        });
      } catch (err) {
        setError(
          err.message || "Failed to create vendor.",
        );
      }
    }
  }

  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="customer-form-header">

          <div>
            <h3>Add Vendor</h3>

            <p>
              Add a new vendor to your supplier catalogue.
            </p>
          </div>

          <button
            type="button"
            className="form-close-button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>

        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-section-title">
            Vendor Information
          </div>

          <div className="form-grid">

            {/* VENDOR NAME */}

            <div className="form-group">

              <label htmlFor="vendor-name">
                Vendor Name *
              </label>

              <input
                id="vendor-name"
                name="name"
                type="text"
                placeholder="Enter vendor name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>

            {/* VENDOR CODE */}

            <div className="form-group">

              <label htmlFor="vendor-code">
                Vendor Code *
              </label>

              <input
                id="vendor-code"
                name="vendorCode"
                type="text"
                placeholder="e.g. VEND-001"
                value={formData.vendorCode}
                onChange={handleChange}
                required
              />

            </div>

            {/* CONTACT PERSON */}

            <div className="form-group">

              <label htmlFor="vendor-contact-person">
                Contact Person
              </label>

              <input
                id="vendor-contact-person"
                name="contactPerson"
                type="text"
                placeholder="Enter contact person"
                value={formData.contactPerson}
                onChange={handleChange}
              />

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="vendor-email">
                Email
              </label>

              <input
                id="vendor-email"
                name="email"
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={handleChange}
              />

            </div>

            {/* PHONE */}

            <div className="form-group">

              <label htmlFor="vendor-phone">
                Phone
              </label>

              <input
                id="vendor-phone"
                name="phone"
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />

            </div>

            {/* GST NUMBER */}

            <div className="form-group">

              <label htmlFor="vendor-gst">
                GST Number
              </label>

              <input
                id="vendor-gst"
                name="gstNumber"
                type="text"
                placeholder="Enter GST number"
                value={formData.gstNumber}
                onChange={handleChange}
              />

            </div>

            {/* ADDRESS */}

            <div className="form-group full-width">

              <label htmlFor="vendor-address">
                Address
              </label>

              <textarea
                id="vendor-address"
                name="address"
                rows="4"
                placeholder="Enter vendor address"
                value={formData.address}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="customer-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Vendor"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default VendorForm;