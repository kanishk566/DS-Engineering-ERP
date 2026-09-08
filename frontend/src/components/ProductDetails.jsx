function ProductDetails({
  product,
  onClose,
}) {
  if (!product) {
    return null;
  }

  const name =
    product.name ||
    product.productName ||
    "Unnamed Product";

  const initial =
    name.charAt(0).toUpperCase();

  const status =
    product.isActive === false
      ? "inactive"
      : "active";


  function formatPrice(price) {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return "-";
    }

    const numericPrice =
      Number(price);

    if (Number.isNaN(numericPrice)) {
      return `₹${price}`;
    }

    return `₹${numericPrice.toLocaleString(
      "en-IN",
    )}`;
  }


  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-form-header">

          <div className="customer-details-title">

            <div className="customer-details-avatar">
              {initial}
            </div>

            <div>

              <h3>
                {name}
              </h3>

              <p>
                Product Details
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


        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="customer-details-content">

          <div className="details-section-title">
            Product Information
          </div>


          <div className="details-grid">

            {/* PRODUCT CODE */}

            <div className="detail-item">

              <span>
                Product Code
              </span>

              <strong>
                {product.productCode ||
                  product.code ||
                  "-"}
              </strong>

            </div>


            {/* STATUS */}

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
                  {status
                    .charAt(0)
                    .toUpperCase() +
                    status.slice(1)}
                </span>

              </strong>

            </div>


            {/* UNIT */}

            <div className="detail-item">

              <span>
                Unit
              </span>

              <strong>
                {product.unit || "-"}
              </strong>

            </div>


            {/* PRICE */}

            <div className="detail-item">

              <span>
                Unit Price
              </span>

              <strong>
                {formatPrice(
                  product.unitPrice ??
                    product.price,
                )}
              </strong>

            </div>


          </div>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="details-section-title address-title">
            Description
          </div>


          <div className="customer-address">

            {product.description ||
              "No description available"}

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

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

export default ProductDetails;