function CustomerDetails({ customer, onClose }) {
  if (!customer) {
    return null;
  }

  const name =
    customer.companyName ||
    customer.name ||
    "Unnamed Customer";

  const initial =
    name.charAt(0).toUpperCase();

  const status =
    customer.status || "active";

  return (
    <div className="customer-form-overlay">
      <div className="customer-details-modal">

        {/* HEADER */}
        <div className="customer-form-header">
          <div className="customer-details-title">
            <div className="customer-details-avatar">
              {initial}
            </div>

            <div>
              <h3>{name}</h3>

              <p>
                Customer Details
              </p>
            </div>
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


        {/* CONTENT */}
        <div className="customer-details-content">

          <div className="details-section-title">
            Business Information
          </div>

          <div className="details-grid">

            <div className="detail-item">
              <span>Customer Code</span>
              <strong>
                {customer.customerCode || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Status</span>

              <strong>
                <span
                  className={`status-badge ${
                    status === "active"
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </span>
              </strong>
            </div>

            <div className="detail-item">
              <span>Email Address</span>
              <strong>
                {customer.email || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Phone Number</span>
              <strong>
                {customer.phone ||
                  customer.mobile ||
                  "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>City</span>
              <strong>
                {customer.city || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>State</span>
              <strong>
                {customer.state || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>GST Number</span>
              <strong>
                {customer.gstNumber || "-"}
              </strong>
            </div>

          </div>


          {/* ADDRESS */}
          <div className="details-section-title address-title">
            Address
          </div>

          <div className="customer-address">
            {customer.address || "No address available"}
          </div>

        </div>


        {/* FOOTER */}
        <div className="customer-details-footer">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
}

export default CustomerDetails;