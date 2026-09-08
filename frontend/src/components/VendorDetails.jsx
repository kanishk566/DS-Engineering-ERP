function VendorDetails({ vendor, onClose }) {
  if (!vendor) {
    return null;
  }

  const vendorName =
    vendor.name ||
    "Unnamed Vendor";

  const vendorCode =
    vendor.vendorCode ||
    "-";

  const status =
    vendor.isActive === false
      ? "inactive"
      : "active";

  const initial =
    vendorName
      .charAt(0)
      .toUpperCase();

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
              <h3>{vendorName}</h3>

              <p>
                Vendor Details
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
            Vendor Information
          </div>


          <div className="details-grid">

            <div className="detail-item">
              <span>
                Vendor Name
              </span>

              <strong>
                {vendorName}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Vendor Code
              </span>

              <strong>
                {vendorCode}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Contact Person
              </span>

              <strong>
                {vendor.contactPerson ||
                  "-"}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Phone
              </span>

              <strong>
                {vendor.phone || "-"}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Email
              </span>

              <strong>
                {vendor.email || "-"}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                GST Number
              </span>

              <strong>
                {vendor.gstNumber || "-"}
              </strong>
            </div>


            <div className="detail-item">
              <span>
                Status
              </span>

              <strong>

                <span
                  className={`status-badge ${
                    status === "active"
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {status === "active"
                    ? "Active"
                    : "Inactive"}
                </span>

              </strong>
            </div>

          </div>


          <div className="details-section-title address-title">
            Address
          </div>


          <div className="customer-address">
            {vendor.address ||
              "No address available"}
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

export default VendorDetails;