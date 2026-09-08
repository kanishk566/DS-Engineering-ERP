import { useEffect, useMemo, useState } from "react";

import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../../services/api";

import VendorForm from "../../components/VendorForm";
import VendorDetails from "../../components/VendorDetails";
import VendorEdit from "../../components/VendorEdit";

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ADD MODAL
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);

  // VIEW MODAL
  const [selectedVendor, setSelectedVendor] = useState(null);

  // EDIT MODAL
  const [selectedEditVendor, setSelectedEditVendor] =
    useState(null);

  const [updatingVendor, setUpdatingVendor] =
    useState(false);

  // ============================================================
  // LOAD VENDORS
  // ============================================================

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const result = await getVendors();

      setVendors(result.data || []);
    } catch (err) {
      setError(
        err.message || "Failed to load vendors."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD WHEN PAGE OPENS
  // ============================================================

  useEffect(() => {
    loadVendors();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredVendors = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return vendors;
    }

    return vendors.filter((vendor) => {
      return (
        String(vendor.name || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.vendorCode || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.contactPerson || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.email || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.phone || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.address || "")
          .toLowerCase()
          .includes(searchText) ||

        String(vendor.gstNumber || "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [vendors, search]);

  // ============================================================
  // CREATE VENDOR
  // ============================================================

  async function handleCreateVendor(vendorData) {
    try {
      setSavingVendor(true);
      setError("");

      await createVendor(vendorData);

      setShowVendorForm(false);

      await loadVendors();
    } catch (err) {
      throw err;
    } finally {
      setSavingVendor(false);
    }
  }

  // ============================================================
  // UPDATE VENDOR
  // ============================================================

  async function handleUpdateVendor(
    vendorId,
    vendorData
  ) {
    try {
      setUpdatingVendor(true);
      setError("");

      await updateVendor(
        vendorId,
        vendorData
      );

      // Close edit modal
      setSelectedEditVendor(null);

      // Refresh list
      await loadVendors();
    } catch (err) {
      throw err;
    } finally {
      setUpdatingVendor(false);
    }
  }

  // ============================================================
  // DELETE VENDOR
  // ============================================================

  async function handleDeleteVendor(vendor) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${vendor.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteVendor(vendor.id);

      setVendors((previousVendors) =>
        previousVendors.filter(
          (item) => item.id !== vendor.id
        )
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete vendor."
      );
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="vendors-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h2>Vendors</h2>

          <p>
            Manage your vendors and supplier information.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowVendorForm(true)
          }
        >
          + Add Vendor
        </button>

      </div>

      {/* ======================================================
          VENDOR CARD
      ====================================================== */}

      <div className="data-card">

        {/* CARD HEADER */}

        <div className="data-card-header">

          <div>
            <h3>Vendor List</h3>

            <p>
              {loading
                ? "Loading vendors..."
                : `${filteredVendors.length} of ${vendors.length} registered vendors`}
            </p>
          </div>

          <div className="search-box">

            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

        </div>

        {/* ERROR */}

        {error && !loading && (
          <div
            style={{
              margin: "15px 20px",
              padding: "12px 15px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="table-wrapper">

          <table className="data-table">

            <thead>

              <tr>

                <th>Vendor</th>

                <th>Code</th>

                <th>Contact</th>

                <th>Email</th>

                <th>City</th>

                <th>Status</th>

                <th className="actions-column">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading && (
                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    Loading vendors...
                  </td>

                </tr>
              )}

              {/* EMPTY */}

              {!loading &&
                !error &&
                filteredVendors.length === 0 && (
                  <tr>

                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                      }}
                    >
                      {search
                        ? "No vendors match your search."
                        : "No vendors found."}
                    </td>

                  </tr>
                )}

              {/* DATA */}

              {!loading &&
                filteredVendors.map((vendor) => {

                  const vendorName =
                    vendor.name ||
                    "Unnamed Vendor";

                  const initial =
                    vendorName
                      .charAt(0)
                      .toUpperCase();

                  const status =
                    vendor.isActive === false
                      ? "inactive"
                      : "active";

                  return (
                    <tr
                      key={vendor.id}
                    >

                      {/* VENDOR */}

                      <td>

                        <div className="table-customer">

                          <div className="table-avatar">
                            {initial}
                          </div>

                          <div>

                            <strong>
                              {vendorName}
                            </strong>

                            <span>
                              {vendor.contactPerson ||
                                "Vendor"}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* CODE */}

                      <td>

                        <span className="code-badge">
                          {vendor.vendorCode ||
                            "-"}
                        </span>

                      </td>

                      {/* CONTACT */}

                      <td>
                        {vendor.phone || "-"}
                      </td>

                      {/* EMAIL */}

                      <td>
                        {vendor.email || "-"}
                      </td>

                      {/* ADDRESS */}

                      <td>
                        {vendor.address || "-"}
                      </td>

                      {/* STATUS */}

                      <td>

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

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="table-actions">

                          {/* ============================
                              VIEW
                          ============================ */}

                          <button
                            type="button"
                            className="action-button view"
                            title="View"
                            onClick={() =>
                              setSelectedVendor(
                                vendor
                              )
                            }
                          >
                            👁
                          </button>

                          {/* ============================
                              EDIT
                          ============================ */}

                          <button
                            type="button"
                            className="action-button edit"
                            title="Edit"
                            onClick={() =>
                              setSelectedEditVendor(
                                vendor
                              )
                            }
                          >
                            ✏
                          </button>

                          {/* ============================
                              DELETE
                          ============================ */}

                          <button
                            type="button"
                            className="action-button delete"
                            title="Delete"
                            onClick={() =>
                              handleDeleteVendor(
                                vendor
                              )
                            }
                          >
                            🗑
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

            </tbody>

          </table>

        </div>

        {/* ====================================================
            TABLE FOOTER
        ==================================================== */}

        <div className="table-footer">

          <span>

            Showing{" "}

            <strong>
              {filteredVendors.length}
            </strong>{" "}

            of{" "}

            <strong>
              {vendors.length}
            </strong>{" "}

            vendors

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

      </div>

      {/* ========================================================
          ADD VENDOR MODAL
      ======================================================== */}

      {showVendorForm && (
        <VendorForm
          onClose={() =>
            setShowVendorForm(false)
          }
          onSave={handleCreateVendor}
          loading={savingVendor}
        />
      )}

      {/* ========================================================
          VIEW VENDOR MODAL
      ======================================================== */}

      {selectedVendor && (
        <VendorDetails
          vendor={selectedVendor}
          onClose={() =>
            setSelectedVendor(null)
          }
        />
      )}

      {/* ========================================================
          EDIT VENDOR MODAL
      ======================================================== */}

      {selectedEditVendor && (
        <VendorEdit
          vendor={selectedEditVendor}
          onClose={() =>
            setSelectedEditVendor(null)
          }
          onSave={(vendorData) =>
            handleUpdateVendor(
              selectedEditVendor.id,
              vendorData
            )
          }
          loading={updatingVendor}
        />
      )}

    </div>
  );
}

export default Vendors;