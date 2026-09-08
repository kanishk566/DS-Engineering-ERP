import { useEffect, useState } from "react";

function CustomerEdit({
  customer,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    customerCode: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    address: "",
    gstNumber: "",
    status: "active",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName:
          customer.companyName ||
          customer.name ||
          "",
        customerCode:
          customer.customerCode || "",
        email: customer.email || "",
        phone:
          customer.phone ||
          customer.mobile ||
          "",
        city: customer.city || "",
        state: customer.state || "",
        address: customer.address || "",
        gstNumber:
          customer.gstNumber || "",
        status:
          customer.status || "active",
      });
    }
  }, [customer]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (onSave) {
      onSave({
        ...formData,
        name: formData.companyName,
      });
    }
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="customer-form-overlay">
      <div className="customer-details-modal">

        {/* HEADER */}
        <div className="customer-form-header">
          <div>
            <h3>Edit Customer</h3>

            <p>
              Update customer business information.
            </p>
          </div>

          <button
            type="button"
            className="form-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>


        {/* FORM */}
        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section-title">
            Basic Information
          </div>


          <div className="form-grid">

            {/* COMPANY NAME */}
            <div className="form-group">
              <label htmlFor="edit-companyName">
                Company Name *
              </label>

              <input
                id="edit-companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>


            {/* CUSTOMER CODE */}
            <div className="form-group">
              <label htmlFor="edit-customerCode">
                Customer Code *
              </label>

              <input
                id="edit-customerCode"
                name="customerCode"
                type="text"
                value={formData.customerCode}
                onChange={handleChange}
                required
              />
            </div>


            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="edit-email">
                Email Address
              </label>

              <input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>


            {/* PHONE */}
            <div className="form-group">
              <label htmlFor="edit-phone">
                Phone Number
              </label>

              <input
                id="edit-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>


            {/* CITY */}
            <div className="form-group">
              <label htmlFor="edit-city">
                City
              </label>

              <input
                id="edit-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
              />
            </div>


            {/* STATE */}
            <div className="form-group">
              <label htmlFor="edit-state">
                State
              </label>

              <input
                id="edit-state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
              />
            </div>


            {/* GST */}
            <div className="form-group">
              <label htmlFor="edit-gstNumber">
                GST Number
              </label>

              <input
                id="edit-gstNumber"
                name="gstNumber"
                type="text"
                value={formData.gstNumber}
                onChange={handleChange}
              />
            </div>


            {/* STATUS */}
            <div className="form-group">
              <label htmlFor="edit-status">
                Status
              </label>

              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
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
              <label htmlFor="edit-address">
                Address
              </label>

              <textarea
                id="edit-address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

          </div>


          {/* ACTIONS */}
          <div className="customer-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Update Customer
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default CustomerEdit;