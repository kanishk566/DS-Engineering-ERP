import { useState } from "react";

function ProductForm({
  onClose,
  onSave,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    productCode: "",
    description: "",
    unit: "PCS",
    unitPrice: "",
    isActive: true,
  });

  const [error, setError] = useState("");


  /* =====================================================
     HANDLE INPUT
  ===================================================== */

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }


  /* =====================================================
     HANDLE STATUS
  ===================================================== */

  function handleStatusChange(event) {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      isActive: value === "active",
    }));

    setError("");
  }


  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError(
        "Product name is required.",
      );
      return;
    }

    if (!formData.productCode.trim()) {
      setError(
        "Product code is required.",
      );
      return;
    }

    if (
      formData.unitPrice === "" ||
      formData.unitPrice === null
    ) {
      setError(
        "Product price is required.",
      );
      return;
    }

    const price = Number(
      formData.unitPrice,
    );

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setError(
        "Please enter a valid product price.",
      );
      return;
    }

    if (onSave) {
      try {
        await onSave({
          productCode:
            formData.productCode.trim(),

          name:
            formData.name.trim(),

          description:
            formData.description.trim() ||
            null,

          unit:
            formData.unit || null,

          unitPrice:
            formData.unitPrice,

          isActive:
            formData.isActive,
        });
      } catch (err) {
        setError(
          err.message ||
            "Failed to save product.",
        );
      }
    }
  }


  return (
    <div className="customer-form-overlay">

      <div className="customer-details-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-form-header">

          <div>
            <h3>
              Add Product
            </h3>

            <p>
              Add a new product to your
              product catalogue.
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


        {/* =================================================
            FORM
        ================================================= */}

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


          {/* PRODUCT INFORMATION */}

          <div className="form-section-title">
            Product Information
          </div>


          <div className="form-grid">

            {/* PRODUCT NAME */}

            <div className="form-group">

              <label htmlFor="product-name">
                Product Name *
              </label>

              <input
                id="product-name"
                name="name"
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>


            {/* PRODUCT CODE */}

            <div className="form-group">

              <label htmlFor="product-code">
                Product Code *
              </label>

              <input
                id="product-code"
                name="productCode"
                type="text"
                placeholder="e.g. PROD-001"
                value={formData.productCode}
                onChange={handleChange}
                required
              />

            </div>


            {/* UNIT */}

            <div className="form-group">

              <label htmlFor="product-unit">
                Unit
              </label>

              <select
                id="product-unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="PCS">
                  PCS
                </option>

                <option value="KG">
                  KG
                </option>

                <option value="MTR">
                  MTR
                </option>

                <option value="LTR">
                  LTR
                </option>

                <option value="SET">
                  SET
                </option>

                <option value="BOX">
                  BOX
                </option>

                <option value="NOS">
                  NOS
                </option>
              </select>

            </div>


            {/* PRICE */}

            <div className="form-group">

              <label htmlFor="product-price">
                Price *
              </label>

              <input
                id="product-price"
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter product price"
                value={formData.unitPrice}
                onChange={handleChange}
                required
              />

            </div>


            {/* STATUS */}

            <div className="form-group">

              <label htmlFor="product-status">
                Status
              </label>

              <select
                id="product-status"
                value={
                  formData.isActive
                    ? "active"
                    : "inactive"
                }
                onChange={
                  handleStatusChange
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

            </div>


            {/* DESCRIPTION */}

            <div className="form-group full-width">

              <label htmlFor="product-description">
                Description
              </label>

              <textarea
                id="product-description"
                name="description"
                rows="4"
                placeholder="Enter product description"
                value={
                  formData.description
                }
                onChange={handleChange}
              />

            </div>

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

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
                : "Save Product"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ProductForm;