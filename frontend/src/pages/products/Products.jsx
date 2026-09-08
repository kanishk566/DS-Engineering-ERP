import { useEffect, useMemo, useState } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/api";

import ProductForm from "../../components/ProductForm";
import ProductDetails from "../../components/ProductDetails";
import ProductEdit from "../../components/ProductEdit";


function Products() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedEditProduct, setSelectedEditProduct] =
    useState(null);

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [deletingProductId, setDeletingProductId] =
    useState(null);


  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  useEffect(() => {
    loadProducts();
  }, []);


  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const result = await getProducts();

      if (result?.success) {
        setProducts(result.data || []);
      } else {
        setProducts([]);

        setError(
          result?.message ||
            "Failed to load products",
        );
      }
    } catch (err) {
      console.error(
        "Failed to load products:",
        err,
      );

      setError(
        err.message ||
          "Failed to load products",
      );
    } finally {
      setLoading(false);
    }
  }


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const name =
        product.name ||
        product.productName ||
        "";

      const code =
        product.productCode ||
        product.code ||
        "";

      const category =
        product.category ||
        "";

      const unit =
        product.unit ||
        "";

      const description =
        product.description ||
        "";

      return (
        name
          .toLowerCase()
          .includes(query) ||
        code
          .toLowerCase()
          .includes(query) ||
        category
          .toLowerCase()
          .includes(query) ||
        unit
          .toLowerCase()
          .includes(query) ||
        description
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);


  /* =====================================================
     CREATE PRODUCT
  ===================================================== */

  async function handleCreateProduct(
    productData,
  ) {
    try {
      setSavingProduct(true);
      setError("");

      const result =
        await createProduct(
          productData,
        );

      if (result?.success) {
        setShowProductForm(false);

        await loadProducts();
      } else {
        setError(
          result?.message ||
            "Failed to create product",
        );
      }
    } catch (err) {
      console.error(
        "Failed to create product:",
        err,
      );

      setError(
        err.message ||
          "Failed to create product",
      );
    } finally {
      setSavingProduct(false);
    }
  }


  /* =====================================================
     UPDATE PRODUCT
  ===================================================== */

  async function handleUpdateProduct(
    productData,
  ) {
    if (!selectedEditProduct?.id) {
      return;
    }

    try {
      setSavingProduct(true);
      setError("");

      const result =
        await updateProduct(
          selectedEditProduct.id,
          productData,
        );

      if (result?.success) {
        setProducts(
          (previousProducts) =>
            previousProducts.map(
              (product) =>
                product.id ===
                selectedEditProduct.id
                  ? {
                      ...product,
                      ...(result.data ||
                        productData),
                    }
                  : product,
            ),
        );

        setSelectedEditProduct(null);
      } else {
        setError(
          result?.message ||
            "Failed to update product",
        );
      }
    } catch (err) {
      console.error(
        "Failed to update product:",
        err,
      );

      setError(
        err.message ||
          "Failed to update product",
      );
    } finally {
      setSavingProduct(false);
    }
  }


  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  async function handleDeleteProduct(
    product,
  ) {
    if (!product?.id) {
      return;
    }

    const productName =
      product.name ||
      product.productName ||
      "this product";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProductId(product.id);
      setError("");

      const result =
        await deleteProduct(
          product.id,
        );

      if (result?.success) {
        setProducts(
          (previousProducts) =>
            previousProducts.filter(
              (item) =>
                item.id !== product.id,
            ),
        );

        if (
          selectedProduct?.id ===
          product.id
        ) {
          setSelectedProduct(null);
        }

        if (
          selectedEditProduct?.id ===
          product.id
        ) {
          setSelectedEditProduct(null);
        }
      } else {
        setError(
          result?.message ||
            "Failed to delete product",
        );
      }
    } catch (err) {
      console.error(
        "Failed to delete product:",
        err,
      );

      setError(
        err.message ||
          "Failed to delete product",
      );
    } finally {
      setDeletingProductId(null);
    }
  }


  /* =====================================================
     FORMAT PRICE
  ===================================================== */

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
    <div className="products-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">

        <div>
          <h2>
            Products
          </h2>

          <p>
            Manage your products, pricing and
            inventory information.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowProductForm(true)
          }
        >
          + Add Product
        </button>

      </div>


      {/* =================================================
          PRODUCT CARD
      ================================================= */}

      <div className="data-card">

        <div className="data-card-header">

          <div>
            <h3>
              Product List
            </h3>

            <p>
              {filteredProducts.length} of{" "}
              {products.length} registered
              products
            </p>
          </div>


          <div className="search-box">

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="empty-state">

            <div className="empty-state-icon">
              ⏳
            </div>

            <h3>
              Loading products...
            </h3>

            <p>
              Please wait while product data
              is being loaded.
            </p>

          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="empty-state">

            <div className="empty-state-icon">
              ⚠️
            </div>

            <h3>
              Unable to load products
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadProducts}
            >
              Try Again
            </button>

          </div>
        )}


        {/* =================================================
            NO SEARCH RESULTS
        ================================================= */}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (

            <div className="empty-state">

              <div className="empty-state-icon">
                🔍
              </div>

              <h3>
                No products found
              </h3>

              <p>
                No products match your search.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setSearch("")
                }
              >
                Clear Search
              </button>

            </div>
          )}


        {/* =================================================
            EMPTY DATABASE
        ================================================= */}

        {!loading &&
          !error &&
          products.length === 0 && (

            <div className="empty-state">

              <div className="empty-state-icon">
                📦
              </div>

              <h3>
                No products found
              </h3>

              <p>
                Product data will appear here
                once products are added.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowProductForm(true)
                }
              >
                + Add Product
              </button>

            </div>
          )}


        {/* =================================================
            PRODUCT TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Code
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Unit
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="actions-column">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredProducts.map(
                    (product) => {

                      const name =
                        product.name ||
                        product.productName ||
                        "Unnamed Product";

                      const initial =
                        name
                          .charAt(0)
                          .toUpperCase();

                      const status =
                        product.status ||
                        "active";

                      const deleting =
                        deletingProductId ===
                        product.id;


                      return (
                        <tr
                          key={product.id}
                        >

                          {/* PRODUCT */}

                          <td>

                            <div className="table-customer">

                              <div className="table-avatar">
                                {initial}
                              </div>

                              <div>

                                <strong>
                                  {name}
                                </strong>

                                <span>
                                  {product.description ||
                                    product.category ||
                                    "Product"}
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* CODE */}

                          <td>

                            <span className="code-badge">
                              {product.productCode ||
                                product.code ||
                                "-"}
                            </span>

                          </td>


                          {/* CATEGORY */}

                          <td>
                            {product.category ||
                              "-"}
                          </td>


                          {/* UNIT */}

                          <td>
                            {product.unit ||
                              "-"}
                          </td>


                          {/* PRICE */}

                          <td>
                            {formatPrice(
                              product.unitPrice ??
                                product.price,
                            )}
                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={`status-badge ${
                                status ===
                                "active"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {status
                                .charAt(0)
                                .toUpperCase() +
                                status.slice(1)}
                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="table-actions">

                              {/* VIEW */}

                              <button
                                type="button"
                                className="action-button view"
                                title="View"
                                disabled={deleting}
                                onClick={() =>
                                  setSelectedProduct(
                                    product,
                                  )
                                }
                              >
                                👁
                              </button>


                              {/* EDIT */}

                              <button
                                type="button"
                                className="action-button edit"
                                title="Edit"
                                disabled={deleting}
                                onClick={() =>
                                  setSelectedEditProduct(
                                    product,
                                  )
                                }
                              >
                                ✏
                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="action-button delete"
                                title="Delete"
                                disabled={deleting}
                                onClick={() =>
                                  handleDeleteProduct(
                                    product,
                                  )
                                }
                              >
                                {deleting
                                  ? "⏳"
                                  : "🗑"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>
          )}


        {/* =================================================
            TABLE FOOTER
        ================================================= */}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (

            <div className="table-footer">

              <span>

                Showing{" "}

                <strong>
                  1–{filteredProducts.length}
                </strong>{" "}

                of{" "}

                <strong>
                  {filteredProducts.length}
                </strong>{" "}

                products

              </span>


              <div className="pagination">

                <button
                  type="button"
                  className="pagination-button active"
                >
                  1
                </button>

              </div>

            </div>
          )}

      </div>


      {/* =================================================
          ADD PRODUCT MODAL
      ================================================= */}

      {showProductForm && (
        <ProductForm
          onClose={() =>
            setShowProductForm(false)
          }
          onSave={handleCreateProduct}
          loading={savingProduct}
        />
      )}


      {/* =================================================
          VIEW PRODUCT MODAL
      ================================================= */}

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      )}


      {/* =================================================
          EDIT PRODUCT MODAL
      ================================================= */}

      {selectedEditProduct && (
        <ProductEdit
          product={selectedEditProduct}
          onClose={() =>
            setSelectedEditProduct(null)
          }
          onSave={handleUpdateProduct}
          loading={savingProduct}
        />
      )}

    </div>
  );
}

export default Products;