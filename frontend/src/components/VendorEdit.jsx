import { useEffect, useState } from "react";

function VendorEdit({
  vendor,
  onClose,
  onSave,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    vendorCode: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    isActive: true,
  });

  const [error, setError] = useState("");

  // ============================================================
  // LOAD VENDOR DATA
  // ============================================================

  useEffect(() => {
    if (!vendor) return;

    setFormData({
      name: vendor.name || "",
      vendorCode: vendor.vendorCode || "",
      contactPerson: vendor.contactPerson || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      gstNumber: vendor.gstNumber || "",
      isActive: vendor.isActive !== false,
    });

    setError("");
  }, [vendor]);

  // ============================================================
  // INPUT CHANGE
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
  // STATUS CHANGE
  // ============================================================

  function handleStatusChange(event) {
    setFormData((previous) => ({
      ...previous,
      isActive: event.target.value === "active",
    }));

    setError("");
  }

  // ============================================================
  // SUBMIT
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
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(formData.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (onSave) {
      try {
        await onSave({
          name: formData.name.trim(),

          vendorCode:
            formData.vendorCode.trim(),

          contactPerson:
            formData.contactPerson.trim() || null,

          phone:
            formData.phone.trim() || null,

          email:
            formData.email.trim() || null,

          address:
            formData.address.trim() || null,

          gstNumber:
            formData.gstNumber.trim() || null,

          isActive: formData.isActive,
        });
      } catch (err) {
        setError(
          err?.message ||
            "Failed to update vendor.",
        );
      }
    }
  }

  if (!vendor) {
    return null;
  }

  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="customer-form-header">

          <div>
            <h3>
              Edit Vendor
            </h3>

            <p>
              Update vendor information.
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

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

          {/* ERROR */}

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

              <label htmlFor="edit-vendor-name">
                Vendor Name *
              </label>

              <input
                id="edit-vendor-name"
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

              <label htmlFor="edit-vendor-code">
                Vendor Code *
              </label>

              <input
                id="edit-vendor-code"
                name="vendorCode"
                type="text"
                placeholder="e.g. V001"
                value={formData.vendorCode}
                onChange={handleChange}
                required
              />

            </div>

            {/* CONTACT PERSON */}

            <div className="form-group">

              <label htmlFor="edit-vendor-contact">
                Contact Person
              </label>

              <input
                id="edit-vendor-contact"
                name="contactPerson"
                type="text"
                placeholder="Enter contact person"
                value={formData.contactPerson}
                onChange={handleChange}
              />

            </div>

            {/* PHONE */}

            <div className="form-group">

              <label htmlFor="edit-vendor-phone">
                Phone
              </label>

              <input
                id="edit-vendor-phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="edit-vendor-email">
                Email
              </label>

              <input
                id="edit-vendor-email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />

            </div>

            {/* GST */}

            <div className="form-group">

              <label htmlFor="edit-vendor-gst">
                GST Number
              </label>

              <input
                id="edit-vendor-gst"
                name="gstNumber"
                type="text"
                placeholder="Enter GST number"
                value={formData.gstNumber}
                onChange={handleChange}
              />

            </div>

            {/* STATUS */}

            <div className="form-group">

              <label htmlFor="edit-vendor-status">
                Status
              </label>

              <select
                id="edit-vendor-status"
                value={
                  formData.isActive
                    ? "active"
                    : "inactive"
                }
                onChange={handleStatusChange}
              >

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </div>

            {/* ADDRESS */}

            <div className="form-group full-width">

              <label htmlFor="edit-vendor-address">
                Address
              </label>

              <textarea
                id="edit-vendor-address"
                name="address"
                rows="4"
                placeholder="Enter vendor address"
                value={formData.address}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

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
                ? "Updating..."
                : "Update Vendor"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default VendorEdit;