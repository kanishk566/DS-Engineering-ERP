import { useEffect, useState } from "react";

function ProductEdit({
  product,
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
     LOAD PRODUCT DATA
  ===================================================== */

  useEffect(() => {
    if (product) {
      setFormData({
        name:
          product.name ||
          product.productName ||
          "",

        productCode:
          product.productCode ||
          product.code ||
          "",

        description:
          product.description ||
          "",

        unit:
          product.unit ||
          "PCS",

        unitPrice:
          product.unitPrice ??
          product.price ??
          "",

        isActive:
          product.isActive ??
          product.status === "active" ??
          true,
      });
    }
  }, [product]);


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
    setFormData((previous) => ({
      ...previous,
      isActive:
        event.target.value === "active",
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
            "Failed to update product.",
        );
      }
    }
  }


  if (!product) {
    return null;
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
              Edit Product
            </h3>

            <p>
              Update product information.
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

              <label htmlFor="edit-product-name">
                Product Name *
              </label>

              <input
                id="edit-product-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>


            {/* PRODUCT CODE */}

            <div className="form-group">

              <label htmlFor="edit-product-code">
                Product Code *
              </label>

              <input
                id="edit-product-code"
                name="productCode"
                type="text"
                value={
                  formData.productCode
                }
                onChange={handleChange}
                required
              />

            </div>


            {/* UNIT */}

            <div className="form-group">

              <label htmlFor="edit-product-unit">
                Unit
              </label>

              <select
                id="edit-product-unit"
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

              <label htmlFor="edit-product-price">
                Price *
              </label>

              <input
                id="edit-product-price"
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={
                  formData.unitPrice
                }
                onChange={handleChange}
                required
              />

            </div>


            {/* STATUS */}

            <div className="form-group">

              <label htmlFor="edit-product-status">
                Status
              </label>

              <select
                id="edit-product-status"
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

              <label htmlFor="edit-product-description">
                Description
              </label>

              <textarea
                id="edit-product-description"
                name="description"
                rows="4"
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
                ? "Updating..."
                : "Update Product"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ProductEdit;