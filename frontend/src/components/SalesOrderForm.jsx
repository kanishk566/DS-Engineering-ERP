import { useEffect, useMemo, useState } from "react";

import {
  createSalesOrder,
  updateSalesOrder,
  getSalesOrderItemsBySalesOrder,
  createSalesOrderItem,
  updateSalesOrderItem,
  deleteSalesOrderItem,
} from "../services/api";


function SalesOrderForm({
  salesOrder = null,
  customers = [],
  quotations = [],
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(salesOrder);


  // ============================================================
  // DATE FORMATTER
  // ============================================================

  function formatDateForInput(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  // ============================================================
  // INITIAL SALES ORDER FORM
  // ============================================================

  const getInitialForm = () => ({
    salesOrderNumber:
      salesOrder?.salesOrderNumber ||
      salesOrder?.salesOrder ||
      salesOrder?.orderNumber ||
      `SO-${new Date().getFullYear()}-001`,

    salesOrderCode:
      salesOrder?.salesOrderCode ||
      salesOrder?.code ||
      "",

    customerId:
      salesOrder?.customerId
        ? String(salesOrder.customerId)
        : "",

    quotationId:
      salesOrder?.quotationId
        ? String(salesOrder.quotationId)
        : "",

    orderDate:
      formatDateForInput(
        salesOrder?.orderDate
      ) ||
      formatDateForInput(
        salesOrder?.date
      ) ||
      "",

    deliveryDate:
      formatDateForInput(
        salesOrder?.deliveryDate
      ) ||
      formatDateForInput(
        salesOrder?.expectedDelivery
      ) ||
      "",

    status:
      salesOrder?.status ||
      "draft",

    subtotal:
      salesOrder?.subtotal !== undefined &&
      salesOrder?.subtotal !== null
        ? String(salesOrder.subtotal)
        : "",

    taxAmount:
      salesOrder?.taxAmount !== undefined &&
      salesOrder?.taxAmount !== null
        ? String(salesOrder.taxAmount)
        : "",

    totalAmount:
      salesOrder?.totalAmount !== undefined &&
      salesOrder?.totalAmount !== null
        ? String(salesOrder.totalAmount)
        : "",

    remarks:
      salesOrder?.remarks ||
      salesOrder?.notes ||
      "",
  });


  // ============================================================
  // STATES
  // ============================================================

  const [form, setForm] = useState(
    getInitialForm
  );

  const [items, setItems] = useState([]);

  const [deletedItemIds, setDeletedItemIds] =
    useState([]);

  const [itemsLoading, setItemsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);


  // ============================================================
  // RESET FORM WHEN SALES ORDER CHANGES
  // ============================================================

  useEffect(() => {
    setForm(getInitialForm());

    setItems([]);

    setDeletedItemIds([]);

    setError("");
  }, [salesOrder]);


  // ============================================================
  // LOAD SALES ORDER ITEMS IN EDIT MODE
  // ============================================================

  useEffect(() => {
    let active = true;

    async function loadItems() {
      if (!isEdit || !salesOrder?.id) {
        setItems([]);
        return;
      }

      try {
        setItemsLoading(true);

        const result =
          await getSalesOrderItemsBySalesOrder(
            salesOrder.id
          );

        if (!active) {
          return;
        }

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Failed to load sales order items."
          );
        }

        const loadedItems =
          Array.isArray(result.data)
            ? result.data
            : [];

        setItems(
          loadedItems.map((item) => ({
            id: item.id,

            salesOrderId:
              item.salesOrderId,

            itemName:
              item.itemName || "",

            description:
              item.description || "",

            quantity:
              item.quantity !== undefined &&
              item.quantity !== null
                ? String(item.quantity)
                : "1",

            unit:
              item.unit || "",

            unitPrice:
              item.unitPrice !== undefined &&
              item.unitPrice !== null
                ? String(item.unitPrice)
                : "0",

            totalPrice:
              item.totalPrice !== undefined &&
              item.totalPrice !== null
                ? String(item.totalPrice)
                : "0",
          }))
        );
      } catch (err) {
        console.error(
          "LOAD SALES ORDER ITEMS ERROR:",
          err
        );

        if (active) {
          setError(
            err?.message ||
              "Failed to load sales order items."
          );
        }
      } finally {
        if (active) {
          setItemsLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      active = false;
    };
  }, [isEdit, salesOrder?.id]);


  // ============================================================
  // HANDLE MAIN FORM INPUT
  // ============================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }


  // ============================================================
  // ITEM TOTAL CALCULATOR
  // ============================================================

  function calculateItemTotal(
    quantity,
    unitPrice
  ) {
    const qty =
      Number(quantity) || 0;

    const price =
      Number(unitPrice) || 0;

    return (
      qty * price
    ).toFixed(2);
  }


  // ============================================================
  // ITEMS SUBTOTAL
  // ============================================================

  const itemsSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        return (
          sum +
          (
            Number(item.totalPrice) ||
            0
          )
        );
      },
      0
    );
  }, [items]);


  // ============================================================
  // ADD ITEM
  // ============================================================

  function handleAddItem() {
    const newItem = {
      id: null,

      salesOrderId:
        salesOrder?.id || null,

      itemName: "",

      description: "",

      quantity: "1",

      unit: "Nos",

      unitPrice: "0",

      totalPrice: "0",
    };

    setItems((previous) => [
      ...previous,
      newItem,
    ]);

    setError("");
  }


  // ============================================================
  // UPDATE ITEM FIELD
  // ============================================================

  function handleItemChange(
    index,
    field,
    value
  ) {
    setItems((previous) =>
      previous.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          const updatedItem = {
            ...item,
            [field]: value,
          };

          if (
            field === "quantity" ||
            field === "unitPrice"
          ) {
            updatedItem.totalPrice =
              calculateItemTotal(
                field === "quantity"
                  ? value
                  : item.quantity,

                field === "unitPrice"
                  ? value
                  : item.unitPrice
              );
          }

          return updatedItem;
        }
      )
    );

    if (error) {
      setError("");
    }
  }


  // ============================================================
  // DELETE ITEM FROM FORM
  // ============================================================

  function handleRemoveItem(index) {
    const item =
      items[index];

    if (
      item?.id !== null &&
      item?.id !== undefined
    ) {
      setDeletedItemIds(
        (previous) => [
          ...previous,
          item.id,
        ]
      );
    }

    setItems(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );

    setError("");
  }


  // ============================================================
  // AUTO UPDATE SUBTOTAL
  // ============================================================

useEffect(() => {
  setForm((previous) => {
    const nextSubtotal =
      itemsSubtotal.toFixed(2);

    if (
      previous.subtotal === nextSubtotal
    ) {
      return previous;
    }

    return {
      ...previous,
      subtotal: nextSubtotal,
    };
  });
}, [itemsSubtotal]);


  // ============================================================
  // CALCULATED GRAND TOTAL
  // ============================================================

  const calculatedTotal = useMemo(() => {
    const subtotal =
      Number(form.subtotal) || 0;

    const tax =
      Number(form.taxAmount) || 0;

    return (
      subtotal + tax
    );
  }, [
    form.subtotal,
    form.taxAmount,
  ]);


  // ============================================================
  // UPDATE TOTAL
  // ============================================================

  useEffect(() => {
    setForm((previous) => {
      const nextTotal =
        calculatedTotal.toFixed(2);

      if (
        previous.totalAmount ===
        nextTotal
      ) {
        return previous;
      }

      return {
        ...previous,
        totalAmount:
          nextTotal,
      };
    });
  }, [calculatedTotal]);


  // ============================================================
  // VALIDATION
  // ============================================================

  function validateForm() {
    if (
      !form.salesOrderNumber.trim()
    ) {
      return "Sales Order Number is required.";
    }

    if (!form.customerId) {
      return "Please select a customer.";
    }

    if (!form.orderDate) {
      return "Order Date is required.";
    }

    if (
      form.deliveryDate &&
      form.orderDate >
        form.deliveryDate
    ) {
      return "Delivery Date cannot be before Order Date.";
    }

    const subtotal =
      Number(form.subtotal);

    const taxAmount =
      Number(form.taxAmount);

    if (
      form.subtotal !== "" &&
      Number.isNaN(subtotal)
    ) {
      return "Please enter a valid subtotal.";
    }

    if (
      form.taxAmount !== "" &&
      Number.isNaN(taxAmount)
    ) {
      return "Please enter a valid tax amount.";
    }

    if (
      subtotal < 0 ||
      taxAmount < 0
    ) {
      return "Amount cannot be negative.";
    }


    // ----------------------------------------------------------
    // ITEM VALIDATION
    // ----------------------------------------------------------

    for (
      let index = 0;
      index < items.length;
      index++
    ) {
      const item =
        items[index];

      if (
        !item.itemName ||
        !item.itemName.trim()
      ) {
        return `Item ${index + 1}: Item Name is required.`;
      }

      const quantity =
        Number(item.quantity);

      const unitPrice =
        Number(item.unitPrice);

      if (
        Number.isNaN(quantity) ||
        quantity <= 0
      ) {
        return `Item ${index + 1}: Quantity must be greater than 0.`;
      }

      if (
        Number.isNaN(unitPrice) ||
        unitPrice < 0
      ) {
        return `Item ${index + 1}: Unit Price cannot be negative.`;
      }
    }

    return "";
  }


  // ============================================================
  // SAVE ITEMS
  // ============================================================

  async function saveItems(
    salesOrderId
  ) {
    // ----------------------------------------------------------
    // DELETE REMOVED EXISTING ITEMS
    // ----------------------------------------------------------

    for (
      const itemId of deletedItemIds
    ) {
      await deleteSalesOrderItem(
        itemId
      );
    }


    // ----------------------------------------------------------
    // CREATE / UPDATE CURRENT ITEMS
    // ----------------------------------------------------------

    for (
      const item of items
    ) {
      const payload = {
        salesOrderId:
          Number(salesOrderId),

        itemName:
          item.itemName.trim(),

        description:
          item.description?.trim() ||
          null,

        quantity:
          Number(item.quantity) || 0,

        unit:
          item.unit?.trim() ||
          null,

        unitPrice:
          Number(item.unitPrice) || 0,

        totalPrice:
          Number(item.totalPrice) || 0,
      };


      if (
        item.id !== null &&
        item.id !== undefined
      ) {
        const result =
          await updateSalesOrderItem(
            item.id,
            payload
          );

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Failed to update sales order item."
          );
        }
      } else {
        const result =
          await createSalesOrderItem(
            payload
          );

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Failed to create sales order item."
          );
        }
      }
    }
  }


  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }


    try {
      setSaving(true);


      // --------------------------------------------------------
      // SALES ORDER PAYLOAD
      // --------------------------------------------------------

      const payload = {
        salesOrderNumber:
          form.salesOrderNumber.trim(),

        salesOrderCode:
          form.salesOrderCode.trim() ||
          null,

        customerId:
          Number(form.customerId),

        quotationId:
          form.quotationId
            ? Number(form.quotationId)
            : null,

        orderDate:
          form.orderDate
            ? `${form.orderDate}T00:00:00Z`
            : null,

        deliveryDate:
          form.deliveryDate
            ? `${form.deliveryDate}T00:00:00Z`
            : null,

        status:
          form.status,

        subtotal:
          Number(form.subtotal) || 0,

        taxAmount:
          Number(form.taxAmount) || 0,

        totalAmount:
          Number(form.totalAmount) ||
          calculatedTotal,

        notes:
          form.remarks.trim() ||
          null,
      };


      // --------------------------------------------------------
      // CREATE / UPDATE SALES ORDER
      // --------------------------------------------------------

      let result;

      if (
        isEdit &&
        salesOrder?.id
      ) {
        result =
          await updateSalesOrder(
            salesOrder.id,
            payload
          );
      } else {
        result =
          await createSalesOrder(
            payload
          );
      }


      // --------------------------------------------------------
      // SALES ORDER RESPONSE CHECK
      // --------------------------------------------------------

      if (!result?.success) {
        throw new Error(
          result?.message ||
            `Failed to ${
              isEdit
                ? "update"
                : "create"
            } sales order.`
        );
      }


      // --------------------------------------------------------
      // GET SAVED SALES ORDER ID
      // --------------------------------------------------------

      const savedSalesOrder =
        result?.data;

      const savedSalesOrderId =
        savedSalesOrder?.id ||
        salesOrder?.id;


      if (!savedSalesOrderId) {
        throw new Error(
          "Sales Order was saved, but its ID could not be found."
        );
      }


      // --------------------------------------------------------
      // SAVE SALES ORDER ITEMS
      // --------------------------------------------------------

      await saveItems(
        savedSalesOrderId
      );


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (onSuccess) {
        await onSuccess(
          result
        );
      }

    } catch (err) {
      console.error(
        "SALES ORDER SAVE ERROR:",
        err
      );

      setError(
        err?.message ||
          `Failed to ${
            isEdit
              ? "update"
              : "create"
          } sales order.`
      );
    } finally {
      setSaving(false);
    }
  }


  // ============================================================
  // CUSTOMER LABEL
  // ============================================================

  function getCustomerLabel(
    customer
  ) {
    const name =
      customer?.name ||
      customer?.companyName ||
      "Customer";

    const code =
      customer?.customerCode ||
      customer?.code;

    return code
      ? `${name} (${code})`
      : name;
  }


  // ============================================================
  // QUOTATION LABEL
  // ============================================================

  function getQuotationLabel(
    quotation
  ) {
    return (
      quotation?.quotationNumber ||
      quotation?.quotationNo ||
      quotation?.number ||
      quotation?.quotation ||
      `Quotation #${quotation?.id}`
    );
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="sales-order-form-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose?.();
        }
      }}
    >

      <div className="sales-order-form-modal">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="sales-order-form-header">

          <div>
            <h2>
              {isEdit
                ? "Edit Sales Order"
                : "Create Sales Order"}
            </h2>

            <p>
              {isEdit
                ? "Update sales order information and items."
                : "Add a new sales order with items to the system."}
            </p>
          </div>


          <button
            type="button"
            className="sales-order-form-close"
            onClick={onClose}
            disabled={saving}
            title="Close"
          >
            ×
          </button>

        </div>


        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="sales-order-form"
        >

          <div className="sales-order-form-body">

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="sales-order-form-error">
                {error}
              </div>
            )}


            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div className="sales-order-form-section">

              <h3>
                Basic Information
              </h3>


              <div className="sales-order-form-grid">

                {/* SALES ORDER NUMBER */}

                <div className="sales-order-form-group">

                  <label>
                    Sales Order Number
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="salesOrderNumber"
                    value={
                      form.salesOrderNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="SO-2026-001"
                    disabled={saving}
                  />

                </div>


                {/* SALES ORDER CODE */}

                <div className="sales-order-form-group">

                  <label>
                    Sales Order Code
                  </label>

                  <input
                    type="text"
                    name="salesOrderCode"
                    value={
                      form.salesOrderCode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="SO-001"
                    disabled={saving}
                  />

                </div>


                {/* CUSTOMER */}

                <div className="sales-order-form-group">

                  <label>
                    Customer
                    <span>*</span>
                  </label>

                  <select
                    name="customerId"
                    value={
                      form.customerId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="">
                      Select Customer
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {getCustomerLabel(
                            customer
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* QUOTATION */}

                <div className="sales-order-form-group">

                  <label>
                    Quotation
                  </label>

                  <select
                    name="quotationId"
                    value={
                      form.quotationId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="">
                      Select Quotation
                    </option>

                    {quotations.map(
                      (quotation) => (
                        <option
                          key={
                            quotation.id
                          }
                          value={
                            quotation.id
                          }
                        >
                          {getQuotationLabel(
                            quotation
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* ORDER DATE */}

                <div className="sales-order-form-group">

                  <label>
                    Order Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="orderDate"
                    value={
                      form.orderDate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />

                </div>


                {/* DELIVERY DATE */}

                <div className="sales-order-form-group">

                  <label>
                    Delivery Date
                  </label>

                  <input
                    type="date"
                    name="deliveryDate"
                    value={
                      form.deliveryDate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />

                </div>


                {/* STATUS */}

                <div className="sales-order-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="draft">
                      Draft
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* ==================================================
                SALES ORDER ITEMS
            ================================================== */}

            <div className="sales-order-form-section">

              <div className="sales-order-items-header">

                <div>
                  <h3>
                    Sales Order Items
                  </h3>

                  <p>
                    Add products or services included in this sales order.
                  </p>
                </div>


                <button
                  type="button"
                  className="sales-order-add-item-button"
                  onClick={
                    handleAddItem
                  }
                  disabled={saving}
                >
                  + Add Item
                </button>

              </div>


              {itemsLoading ? (

                <div className="sales-order-items-loading">
                  Loading items...
                </div>

              ) : items.length === 0 ? (

                <div className="sales-order-items-empty">

                  <div className="sales-order-items-empty-icon">
                    +
                  </div>

                  <strong>
                    No items added
                  </strong>

                  <span>
                    Click "Add Item" to add items to this sales order.
                  </span>

                </div>

              ) : (

                <div className="sales-order-items-list">

                  {items.map(
                    (item, index) => (

                      <div
                        className="sales-order-item-card"
                        key={
                          item.id ??
                          `new-${index}`
                        }
                      >

                        <div className="sales-order-item-card-header">

                          <strong>
                            Item {index + 1}
                          </strong>

                          <button
                            type="button"
                            className="sales-order-item-remove"
                            onClick={() =>
                              handleRemoveItem(
                                index
                              )
                            }
                            disabled={saving}
                          >
                            Remove
                          </button>

                        </div>


                        <div className="sales-order-item-grid">

                          {/* ITEM NAME */}

                          <div className="sales-order-form-group sales-order-item-name">

                            <label>
                              Item Name
                              <span>*</span>
                            </label>

                            <input
                              type="text"
                              value={
                                item.itemName
                              }
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "itemName",
                                  event.target.value
                                )
                              }
                              placeholder="Enter item name"
                              disabled={saving}
                            />

                          </div>


                          {/* DESCRIPTION */}

                          <div className="sales-order-form-group sales-order-item-description">

                            <label>
                              Description
                            </label>

                            <input
                              type="text"
                              value={
                                item.description
                              }
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="Item description"
                              disabled={saving}
                            />

                          </div>


                          {/* QUANTITY */}

                          <div className="sales-order-form-group">

                            <label>
                              Quantity
                              <span>*</span>
                            </label>

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                item.quantity
                              }
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  event.target.value
                                )
                              }
                              disabled={saving}
                            />

                          </div>


                          {/* UNIT */}

                          <div className="sales-order-form-group">

                            <label>
                              Unit
                            </label>

                            <input
                              type="text"
                              value={
                                item.unit
                              }
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "unit",
                                  event.target.value
                                )
                              }
                              placeholder="Nos"
                              disabled={saving}
                            />

                          </div>


                          {/* UNIT PRICE */}

                          <div className="sales-order-form-group">

                            <label>
                              Unit Price
                              <span>*</span>
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.unitPrice
                              }
                              onChange={(event) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  event.target.value
                                )
                              }
                              placeholder="0.00"
                              disabled={saving}
                            />

                          </div>


                          {/* TOTAL PRICE */}

                          <div className="sales-order-form-group">

                            <label>
                              Total Price
                            </label>

                            <input
                              type="number"
                              value={
                                item.totalPrice
                              }
                              readOnly
                              className="sales-order-item-total-input"
                            />

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}


              {items.length > 0 && (
                <div className="sales-order-items-summary">

                  <span>
                    Items Subtotal
                  </span>

                  <strong>
                    ₹{" "}
                    {itemsSubtotal.toFixed(2)}
                  </strong>

                </div>
              )}

            </div>


            {/* ==================================================
                AMOUNT DETAILS
            ================================================== */}

            <div className="sales-order-form-section">

              <h3>
                Amount Details
              </h3>


              <div className="sales-order-form-grid">

                {/* SUBTOTAL */}

                <div className="sales-order-form-group">

                  <label>
                    Subtotal
                  </label>

                  <input
                    type="number"
                    name="subtotal"
                    value={
                      form.subtotal
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    readOnly={
                      items.length > 0
                    }
                    className={
                      items.length > 0
                        ? "sales-order-calculated-input"
                        : ""
                    }
                    disabled={saving}
                  />

                  <small>
                    {items.length > 0
                      ? "Automatically calculated from items."
                      : "Add items to calculate subtotal automatically."}
                  </small>

                </div>


                {/* TAX */}

                <div className="sales-order-form-group">

                  <label>
                    Tax Amount
                  </label>

                  <input
                    type="number"
                    name="taxAmount"
                    value={
                      form.taxAmount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={saving}
                  />

                </div>


                {/* TOTAL */}

                <div className="sales-order-form-group">

                  <label>
                    Total Amount
                  </label>

                  <input
                    type="number"
                    name="totalAmount"
                    value={
                      form.totalAmount
                    }
                    readOnly
                    className="sales-order-total-input"
                  />

                  <small>
                    Automatically calculated from subtotal + tax.
                  </small>

                </div>

              </div>

            </div>


            {/* ==================================================
                ADDITIONAL INFORMATION
            ================================================== */}

            <div className="sales-order-form-section">

              <h3>
                Additional Information
              </h3>


              <div className="sales-order-form-group full-width">

                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={
                    form.remarks
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter any additional remarks..."
                  rows="5"
                  disabled={saving}
                />

              </div>

            </div>

          </div>


          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="sales-order-form-footer">

            <button
              type="button"
              className="sales-order-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="sales-order-submit-button"
              disabled={
                saving ||
                itemsLoading
              }
            >

              {saving
                ? "Saving..."
                : isEdit
                ? "Update Sales Order"
                : "Create Sales Order"}

            </button>

          </div>

        </form>

      </div>


      {/* ========================================================
          CSS
      ======================================================== */}

      <style>{`

        /* ======================================================
           OVERLAY
        ====================================================== */

        .sales-order-form-overlay {
          position: fixed;
          inset: 0;
          z-index: 11000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(15, 23, 42, 0.60);

          backdrop-filter:
            blur(5px);

          overflow-y: auto;
        }


        /* ======================================================
           MODAL
        ====================================================== */

        .sales-order-form-modal {
          width: 100%;
          max-width: 1000px;

          max-height:
            calc(100vh - 40px);

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: #ffffff;

          border-radius: 16px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.30);
        }


        /* ======================================================
           HEADER
        ====================================================== */

        .sales-order-form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding:
            24px 26px;

          border-bottom:
            1px solid #e5eaf0;

          flex-shrink: 0;
        }


        .sales-order-form-header h2 {
          margin: 0;

          color: #0f172a;

          font-size: 21px;

          font-weight: 700;
        }


        .sales-order-form-header p {
          margin:
            6px 0 0;

          color: #64748b;

          font-size: 13px;
        }


        .sales-order-form-close {
          width: 38px;
          height: 38px;

          min-width: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #dbe3ec;

          border-radius: 9px;

          background: #ffffff;

          color: #64748b;

          font-size: 24px;

          line-height: 1;

          cursor: pointer;
        }


        .sales-order-form-close:hover {
          background: #f8fafc;

          color: #0f172a;
        }


        .sales-order-form-close:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* ======================================================
           FORM
        ====================================================== */

        .sales-order-form {
          display: flex;
          flex-direction: column;

          min-height: 0;

          flex: 1;
        }


        .sales-order-form-body {
          padding:
            24px 26px;

          overflow-y: auto;
        }


        /* ======================================================
           ERROR
        ====================================================== */

        .sales-order-form-error {
          margin-bottom: 20px;

          padding:
            12px 14px;

          border:
            1px solid #fecaca;

          border-radius: 9px;

          background: #fff1f2;

          color: #dc2626;

          font-size: 13px;

          line-height: 1.5;
        }


        /* ======================================================
           SECTION
        ====================================================== */

        .sales-order-form-section {
          margin-bottom: 28px;

          padding-bottom: 24px;

          border-bottom:
            1px solid #e5eaf0;
        }


        .sales-order-form-section:last-child {
          margin-bottom: 0;

          padding-bottom: 0;

          border-bottom: none;
        }


        .sales-order-form-section h3 {
          margin:
            0 0 16px;

          color: #0f172a;

          font-size: 14px;

          font-weight: 700;
        }


        /* ======================================================
           GRID
        ====================================================== */

        .sales-order-form-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap:
            18px 20px;
        }


        /* ======================================================
           GROUP
        ====================================================== */

        .sales-order-form-group {
          min-width: 0;

          display: flex;
          flex-direction: column;
        }


        .sales-order-form-group.full-width {
          grid-column: 1 / -1;
        }


        .sales-order-form-group label {
          margin-bottom: 7px;

          color: #334155;

          font-size: 12px;

          font-weight: 600;
        }


        .sales-order-form-group label span {
          margin-left: 3px;

          color: #ef4444;
        }


        /* ======================================================
           INPUTS
        ====================================================== */

        .sales-order-form-group input,
        .sales-order-form-group select,
        .sales-order-form-group textarea {
          width: 100%;

          box-sizing: border-box;

          border:
            1px solid #d3dce7;

          border-radius: 9px;

          background: #ffffff;

          color: #1e293b;

          font-family: inherit;

          font-size: 13px;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }


        .sales-order-form-group input,
        .sales-order-form-group select {
          height: 44px;

          padding:
            0 13px;
        }


        .sales-order-form-group textarea {
          min-height: 120px;

          padding:
            12px 13px;

          resize: vertical;

          line-height: 1.5;
        }


        .sales-order-form-group input::placeholder,
        .sales-order-form-group textarea::placeholder {
          color: #94a3b8;
        }


        .sales-order-form-group input:focus,
        .sales-order-form-group select:focus,
        .sales-order-form-group textarea:focus {
          border-color:
            #2563eb;

          box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, 0.10);
        }


        .sales-order-form-group input:disabled,
        .sales-order-form-group select:disabled,
        .sales-order-form-group textarea:disabled {
          background: #f8fafc;

          cursor: not-allowed;

          opacity: 0.8;
        }


        /* ======================================================
           TOTAL INPUT
        ====================================================== */

        .sales-order-total-input {
          background:
            #eff6ff !important;

          border-color:
            #bfdbfe !important;

          color:
            #2563eb !important;

          font-weight: 700;
        }


        .sales-order-calculated-input {
          background:
            #f8fafc !important;

          border-color:
            #cbd5e1 !important;

          color:
            #334155 !important;

          font-weight: 600;
        }


        .sales-order-form-group small {
          margin-top: 6px;

          color: #94a3b8;

          font-size: 10px;

          line-height: 1.4;
        }


        /* ======================================================
           ITEMS HEADER
        ====================================================== */

        .sales-order-items-header {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          margin-bottom: 18px;
        }


        .sales-order-items-header h3 {
          margin:
            0 0 5px;
        }


        .sales-order-items-header p {
          margin: 0;

          color: #64748b;

          font-size: 11px;
        }


        .sales-order-add-item-button {
          height: 40px;

          padding:
            0 16px;

          border: none;

          border-radius: 9px;

          background:
            #2563eb;

          color:
            #ffffff;

          font-family: inherit;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          white-space: nowrap;
        }


        .sales-order-add-item-button:hover {
          background:
            #1d4ed8;
        }


        .sales-order-add-item-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* ======================================================
           ITEMS EMPTY
        ====================================================== */

        .sales-order-items-empty {
          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          min-height: 150px;

          padding: 25px;

          border:
            1px dashed #cbd5e1;

          border-radius: 12px;

          background:
            #f8fafc;

          text-align: center;
        }


        .sales-order-items-empty-icon {
          width: 38px;
          height: 38px;

          display: flex;

          align-items: center;
          justify-content: center;

          margin-bottom: 9px;

          border-radius: 50%;

          background:
            #dbeafe;

          color:
            #2563eb;

          font-size: 20px;

          font-weight: 700;
        }


        .sales-order-items-empty strong {
          color:
            #334155;

          font-size: 13px;
        }


        .sales-order-items-empty span {
          margin-top: 4px;

          color:
            #94a3b8;

          font-size: 11px;
        }


        /* ======================================================
           ITEMS LOADING
        ====================================================== */

        .sales-order-items-loading {
          padding: 30px;

          border-radius: 12px;

          background:
            #f8fafc;

          color:
            #64748b;

          text-align: center;

          font-size: 12px;
        }


        /* ======================================================
           ITEMS LIST
        ====================================================== */

        .sales-order-items-list {
          display: flex;

          flex-direction: column;

          gap: 14px;
        }


        /* ======================================================
           ITEM CARD
        ====================================================== */

        .sales-order-item-card {
          padding: 16px;

          border:
            1px solid #dbe3ec;

          border-radius: 12px;

          background:
            #ffffff;

          box-shadow:
            0 3px 12px
            rgba(15, 23, 42, 0.04);
        }


        .sales-order-item-card-header {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 15px;

          padding-bottom: 11px;

          border-bottom:
            1px solid #edf1f5;
        }


        .sales-order-item-card-header strong {
          color:
            #0f172a;

          font-size: 13px;
        }


        .sales-order-item-remove {
          border: none;

          background:
            transparent;

          color:
            #dc2626;

          font-family: inherit;

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;
        }


        .sales-order-item-remove:hover {
          text-decoration: underline;
        }


        .sales-order-item-remove:disabled {
          opacity: 0.5;

          cursor: not-allowed;
        }


        /* ======================================================
           ITEM GRID
        ====================================================== */

        .sales-order-item-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap:
            15px 16px;
        }


        .sales-order-item-name {
          grid-column:
            span 2;
        }


        .sales-order-item-description {
          grid-column:
            span 2;
        }


        .sales-order-item-total-input {
          background:
            #f0fdf4 !important;

          border-color:
            #bbf7d0 !important;

          color:
            #15803d !important;

          font-weight: 700;
        }


        /* ======================================================
           ITEMS SUMMARY
        ====================================================== */

        .sales-order-items-summary {
          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 25px;

          margin-top: 15px;

          padding:
            14px 16px;

          border-radius: 9px;

          background:
            #f8fafc;

          color:
            #475569;

          font-size: 12px;
        }


        .sales-order-items-summary strong {
          color:
            #0f172a;

          font-size: 14px;
        }


        /* ======================================================
           FOOTER
        ====================================================== */

        .sales-order-form-footer {
          display: flex;

          justify-content: flex-end;

          align-items: center;

          gap: 10px;

          padding:
            15px 26px;

          border-top:
            1px solid #e5eaf0;

          background: #ffffff;

          flex-shrink: 0;
        }


        .sales-order-cancel-button,
        .sales-order-submit-button {
          height: 42px;

          padding:
            0 20px;

          border-radius: 9px;

          font-family: inherit;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;
        }


        .sales-order-cancel-button {
          border:
            1px solid #d6dee8;

          background:
            #ffffff;

          color:
            #334155;
        }


        .sales-order-cancel-button:hover {
          background:
            #f8fafc;
        }


        .sales-order-submit-button {
          border: none;

          background:
            #2563eb;

          color:
            #ffffff;
        }


        .sales-order-submit-button:hover {
          background:
            #1d4ed8;
        }


        .sales-order-cancel-button:disabled,
        .sales-order-submit-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 850px) {

          .sales-order-item-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }


          .sales-order-item-name,
          .sales-order-item-description {
            grid-column:
              span 2;
          }

        }


        @media (max-width: 700px) {

          .sales-order-form-overlay {
            padding: 10px;

            align-items: flex-start;
          }


          .sales-order-form-modal {
            max-height:
              calc(100vh - 20px);

            border-radius: 12px;
          }


          .sales-order-form-header {
            padding:
              18px;
          }


          .sales-order-form-body {
            padding:
              18px;
          }


          .sales-order-form-footer {
            padding:
              14px 18px;
          }


          .sales-order-form-grid {
            grid-template-columns:
              1fr;

            gap: 16px;
          }


          .sales-order-form-group.full-width {
            grid-column: auto;
          }


          .sales-order-items-header {
            align-items: flex-start;

            flex-direction: column;
          }


          .sales-order-add-item-button {
            width: 100%;
          }


          .sales-order-item-grid {
            grid-template-columns:
              1fr;
          }


          .sales-order-item-name,
          .sales-order-item-description {
            grid-column:
              auto;
          }

        }


        @media (max-width: 500px) {

          .sales-order-form-footer {
            flex-direction:
              column-reverse;

            align-items:
              stretch;
          }


          .sales-order-cancel-button,
          .sales-order-submit-button {
            width: 100%;
          }

        }

      `}</style>

    </div>
  );
}


export default SalesOrderForm;