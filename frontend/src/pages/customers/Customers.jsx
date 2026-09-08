import { useEffect, useMemo, useState } from "react";

import {
  getCustomers,
  updateCustomer,
  deleteCustomer,
} from "../../services/api";

import CustomerForm from "../../components/CustomerForm";
import CustomerDetails from "../../components/CustomerDetails";
import CustomerEdit from "../../components/CustomerEdit";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCustomerForm, setShowCustomerForm] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [selectedEditCustomer, setSelectedEditCustomer] =
    useState(null);

  const [updatingCustomer, setUpdatingCustomer] =
    useState(false);

  const [deletingCustomerId, setDeletingCustomerId] =
    useState(null);


  /* =====================================================
     LOAD CUSTOMERS
  ===================================================== */

  useEffect(() => {
    loadCustomers();
  }, []);


  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const result = await getCustomers();

      if (result?.success) {
        setCustomers(result.data || []);
      } else {
        setCustomers([]);

        setError(
          result?.message ||
            "Failed to load customers",
        );
      }
    } catch (err) {
      console.error(
        "Failed to load customers:",
        err,
      );

      setError(
        err.message ||
          "Failed to load customers",
      );
    } finally {
      setLoading(false);
    }
  }


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name =
        customer.companyName ||
        customer.name ||
        "";

      const code =
        customer.customerCode || "";

      const email =
        customer.email || "";

      const phone =
        customer.phone ||
        customer.mobile ||
        "";

      const city =
        customer.city || "";

      return (
        name
          .toLowerCase()
          .includes(query) ||
        code
          .toLowerCase()
          .includes(query) ||
        email
          .toLowerCase()
          .includes(query) ||
        phone
          .toLowerCase()
          .includes(query) ||
        city
          .toLowerCase()
          .includes(query)
      );
    });
  }, [customers, search]);


  /* =====================================================
     UPDATE CUSTOMER
  ===================================================== */

  async function handleUpdateCustomer(
    customerData,
  ) {
    if (!selectedEditCustomer?.id) {
      return;
    }

    try {
      setUpdatingCustomer(true);
      setError("");

      const result =
        await updateCustomer(
          selectedEditCustomer.id,
          customerData,
        );

      if (result?.success) {
        setCustomers(
          (previousCustomers) =>
            previousCustomers.map(
              (customer) =>
                customer.id ===
                selectedEditCustomer.id
                  ? {
                      ...customer,
                      ...(result.data ||
                        customerData),
                    }
                  : customer,
            ),
        );

        setSelectedEditCustomer(null);
      } else {
        setError(
          result?.message ||
            "Failed to update customer",
        );
      }
    } catch (err) {
      console.error(
        "Failed to update customer:",
        err,
      );

      setError(
        err.message ||
          "Failed to update customer",
      );
    } finally {
      setUpdatingCustomer(false);
    }
  }


  /* =====================================================
     DELETE CUSTOMER
  ===================================================== */

  async function handleDeleteCustomer(
    customer,
  ) {
    if (!customer?.id) {
      return;
    }

    const customerName =
      customer.companyName ||
      customer.name ||
      "this customer";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${customerName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCustomerId(customer.id);
      setError("");

      const result =
        await deleteCustomer(
          customer.id,
        );

      if (result?.success) {
        setCustomers(
          (previousCustomers) =>
            previousCustomers.filter(
              (item) =>
                item.id !== customer.id,
            ),
        );

        if (
          selectedCustomer?.id ===
          customer.id
        ) {
          setSelectedCustomer(null);
        }

        if (
          selectedEditCustomer?.id ===
          customer.id
        ) {
          setSelectedEditCustomer(null);
        }
      } else {
        setError(
          result?.message ||
            "Failed to delete customer",
        );
      }
    } catch (err) {
      console.error(
        "Failed to delete customer:",
        err,
      );

      setError(
        err.message ||
          "Failed to delete customer",
      );
    } finally {
      setDeletingCustomerId(null);
    }
  }


  return (
    <div className="customers-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">

        <div>
          <h2>
            Customers
          </h2>

          <p>
            Manage your customers and their
            business information.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowCustomerForm(true)
          }
        >
          + Add Customer
        </button>

      </div>


      {/* =================================================
          CUSTOMER CARD
      ================================================= */}

      <div className="data-card">

        {/* CARD HEADER */}

        <div className="data-card-header">

          <div>

            <h3>
              Customer List
            </h3>

            <p>
              {filteredCustomers.length} of{" "}
              {customers.length} registered
              customers
            </p>

          </div>


          <div className="search-box">

            <input
              type="text"
              placeholder="Search customers..."
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
              Loading customers...
            </h3>

            <p>
              Please wait while customer data
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
              Unable to load customers
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={loadCustomers}
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
          customers.length > 0 &&
          filteredCustomers.length === 0 && (

            <div className="empty-state">

              <div className="empty-state-icon">
                🔍
              </div>

              <h3>
                No customers found
              </h3>

              <p>
                No customers match your search.
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
          customers.length === 0 && (

            <div className="empty-state">

              <div className="empty-state-icon">
                👥
              </div>

              <h3>
                No customers found
              </h3>

              <p>
                Customer data will appear here
                once customers are added.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowCustomerForm(true)
                }
              >
                + Add Customer
              </button>

            </div>
          )}


        {/* =================================================
            CUSTOMER TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredCustomers.length > 0 && (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Customer
                    </th>

                    <th>
                      Code
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      City
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

                  {filteredCustomers.map(
                    (customer) => {

                      const name =
                        customer.companyName ||
                        customer.name ||
                        "Unnamed Customer";

                      const initial =
                        name
                          .charAt(0)
                          .toUpperCase();

                      const status =
                        customer.status ||
                        "active";

                      const isDeleting =
                        deletingCustomerId ===
                        customer.id;


                      return (
                        <tr
                          key={customer.id}
                        >

                          {/* CUSTOMER */}

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
                                  Customer
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* CODE */}

                          <td>

                            <span className="code-badge">
                              {customer.customerCode ||
                                "-"}
                            </span>

                          </td>


                          {/* CONTACT */}

                          <td>
                            {customer.phone ||
                              customer.mobile ||
                              "-"}
                          </td>


                          {/* EMAIL */}

                          <td>
                            {customer.email ||
                              "-"}
                          </td>


                          {/* CITY */}

                          <td>
                            {customer.city ||
                              "-"}
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
                                onClick={() =>
                                  setSelectedCustomer(
                                    customer,
                                  )
                                }
                                disabled={isDeleting}
                              >
                                👁
                              </button>


                              {/* EDIT */}

                              <button
                                type="button"
                                className="action-button edit"
                                title="Edit"
                                onClick={() =>
                                  setSelectedEditCustomer(
                                    customer,
                                  )
                                }
                                disabled={isDeleting}
                              >
                                ✏
                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="action-button delete"
                                title="Delete"
                                onClick={() =>
                                  handleDeleteCustomer(
                                    customer,
                                  )
                                }
                                disabled={isDeleting}
                              >
                                {isDeleting
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
          filteredCustomers.length > 0 && (

            <div className="table-footer">

              <span>

                Showing{" "}

                <strong>
                  1–{filteredCustomers.length}
                </strong>{" "}

                of{" "}

                <strong>
                  {filteredCustomers.length}
                </strong>{" "}

                customers

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
          ADD CUSTOMER MODAL
      ================================================= */}

      {showCustomerForm && (
        <CustomerForm
          onClose={() =>
            setShowCustomerForm(false)
          }
          onSuccess={() => {
            setShowCustomerForm(false);
            loadCustomers();
          }}
        />
      )}


      {/* =================================================
          VIEW CUSTOMER MODAL
      ================================================= */}

      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() =>
            setSelectedCustomer(null)
          }
        />
      )}


      {/* =================================================
          EDIT CUSTOMER MODAL
      ================================================= */}

      {selectedEditCustomer && (
        <CustomerEdit
          customer={selectedEditCustomer}
          onClose={() =>
            setSelectedEditCustomer(null)
          }
          onSave={handleUpdateCustomer}
          loading={updatingCustomer}
        />
      )}

    </div>
  );
}

export default Customers;