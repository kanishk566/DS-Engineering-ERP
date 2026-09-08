const API_BASE_URL = "http://localhost:5000/api";

// ============================================================
// TOKEN HELPERS
// ============================================================

export function getToken() {
  return localStorage.getItem("erp_token");
}

export function saveToken(token) {
  localStorage.setItem("erp_token", token);
}

export function removeToken() {
  localStorage.removeItem("erp_token");
}


// ============================================================
// LOGIN
// ============================================================

export async function login(email, password) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Login failed",
    );
  }

  if (
    result.success &&
    result.data?.token
  ) {
    saveToken(result.data.token);
  }

  return result;
}


// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    removeToken();
    return null;
  }

  return result;
}


// ============================================================
// COMMON API REQUEST
// ============================================================

export async function apiRequest(
  endpoint,
  options = {},
) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "API request failed",
    );
  }

  return result;
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {
  removeToken();
}


// ============================================================
// CUSTOMER APIs
// ============================================================

export async function getCustomers() {
  return await apiRequest(
    "/customers",
  );
}

export async function createCustomer(
  customerData,
) {
  return await apiRequest(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify(
        customerData,
      ),
    },
  );
}

export async function updateCustomer(
  customerId,
  customerData,
) {
  return await apiRequest(
    `/customers/${customerId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        customerData,
      ),
    },
  );
}

export async function deleteCustomer(
  customerId,
) {
  return await apiRequest(
    `/customers/${customerId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// PRODUCT APIs
// ============================================================

export async function getProducts() {
  return await apiRequest(
    "/products",
  );
}

export async function createProduct(
  productData,
) {
  return await apiRequest(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(
        productData,
      ),
    },
  );
}

export async function updateProduct(
  productId,
  productData,
) {
  return await apiRequest(
    `/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        productData,
      ),
    },
  );
}

export async function deleteProduct(
  productId,
) {
  return await apiRequest(
    `/products/${productId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// VENDOR APIs
// ============================================================

export async function getVendors() {
  return await apiRequest(
    "/vendors",
  );
}

export async function createVendor(
  vendorData,
) {
  return await apiRequest(
    "/vendors",
    {
      method: "POST",
      body: JSON.stringify(
        vendorData,
      ),
    },
  );
}

export async function updateVendor(
  vendorId,
  vendorData,
) {
  return await apiRequest(
    `/vendors/${vendorId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        vendorData,
      ),
    },
  );
}

export async function deleteVendor(
  vendorId,
) {
  return await apiRequest(
    `/vendors/${vendorId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// PROJECT APIs
// ============================================================

export async function getProjects() {
  return await apiRequest(
    "/projects",
  );
}

export async function createProject(
  projectData,
) {
  return await apiRequest(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(
        projectData,
      ),
    },
  );
}

export async function updateProject(
  projectId,
  projectData,
) {
  return await apiRequest(
    `/projects/${projectId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        projectData,
      ),
    },
  );
}

export async function deleteProject(
  projectId,
) {
  return await apiRequest(
    `/projects/${projectId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// PURCHASE ORDER APIs
// ============================================================

export async function getPurchaseOrders() {
  return await apiRequest(
    "/purchase-orders",
  );
}

export async function getPurchaseOrder(
  purchaseOrderId,
) {
  return await apiRequest(
    `/purchase-orders/${purchaseOrderId}`,
  );
}

export async function createPurchaseOrder(
  purchaseOrderData,
) {
  return await apiRequest(
    "/purchase-orders",
    {
      method: "POST",
      body: JSON.stringify(
        purchaseOrderData,
      ),
    },
  );
}

export async function updatePurchaseOrder(
  purchaseOrderId,
  purchaseOrderData,
) {
  return await apiRequest(
    `/purchase-orders/${purchaseOrderId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        purchaseOrderData,
      ),
    },
  );
}

export async function deletePurchaseOrder(
  purchaseOrderId,
) {
  return await apiRequest(
    `/purchase-orders/${purchaseOrderId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// QUOTATION API
// ============================================================

export async function getQuotations() {
  return await apiRequest(
    "/quotations",
  );
}

export async function getQuotation(
  quotationId,
) {
  return await apiRequest(
    `/quotations/${quotationId}`,
  );
}

export async function createQuotation(
  quotationData,
) {
  return await apiRequest(
    "/quotations",
    {
      method: "POST",
      body: JSON.stringify(
        quotationData,
      ),
    },
  );
}

export async function updateQuotation(
  quotationId,
  quotationData,
) {
  return await apiRequest(
    `/quotations/${quotationId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        quotationData,
      ),
    },
  );
}

export async function deleteQuotation(
  quotationId,
) {
  return await apiRequest(
    `/quotations/${quotationId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// INVOICE APIs
// ============================================================

export async function getInvoices() {
  return await apiRequest(
    "/invoices",
  );
}

export async function getInvoice(
  invoiceId,
) {
  return await apiRequest(
    `/invoices/${invoiceId}`,
  );
}

export async function createInvoice(
  invoiceData,
) {
  return await apiRequest(
    "/invoices",
    {
      method: "POST",
      body: JSON.stringify(
        invoiceData,
      ),
    },
  );
}

export async function updateInvoice(
  invoiceId,
  invoiceData,
) {
  return await apiRequest(
    `/invoices/${invoiceId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        invoiceData,
      ),
    },
  );
}

export async function deleteInvoice(
  invoiceId,
) {
  return await apiRequest(
    `/invoices/${invoiceId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// INVOICE ITEM APIs
// ============================================================

export async function getInvoiceItems() {
  return await apiRequest(
    "/invoice-items",
  );
}

export async function getInvoiceItemsByInvoice(
  invoiceId,
) {
  return await apiRequest(
    `/invoice-items/invoice/${invoiceId}`,
  );
}

export async function getInvoiceItem(
  invoiceItemId,
) {
  return await apiRequest(
    `/invoice-items/${invoiceItemId}`,
  );
}

export async function createInvoiceItem(
  itemData,
) {
  return await apiRequest(
    "/invoice-items",
    {
      method: "POST",
      body: JSON.stringify(
        itemData,
      ),
    },
  );
}

export async function updateInvoiceItem(
  invoiceItemId,
  itemData,
) {
  return await apiRequest(
    `/invoice-items/${invoiceItemId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        itemData,
      ),
    },
  );
}

export async function deleteInvoiceItem(
  invoiceItemId,
) {
  return await apiRequest(
    `/invoice-items/${invoiceItemId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// PAYMENT APIs
// ============================================================

export async function getPayments() {
  return await apiRequest(
    "/payments",
  );
}

export async function getPayment(
  paymentId,
) {
  return await apiRequest(
    `/payments/${paymentId}`,
  );
}

export async function getPaymentsByInvoice(
  invoiceId,
) {
  return await apiRequest(
    `/payments/invoice/${invoiceId}`,
  );
}

export async function createPayment(
  paymentData,
) {
  return await apiRequest(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify(
        paymentData,
      ),
    },
  );
}

export async function updatePayment(
  paymentId,
  paymentData,
) {
  return await apiRequest(
    `/payments/${paymentId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        paymentData,
      ),
    },
  );
}

export async function deletePayment(
  paymentId,
) {
  return await apiRequest(
    `/payments/${paymentId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// SALES ORDER APIs
// ============================================================

export async function getSalesOrders() {
  return await apiRequest(
    "/sales-orders",
  );
}

export async function getSalesOrder(
  salesOrderId,
) {
  return await apiRequest(
    `/sales-orders/${salesOrderId}`,
  );
}

export async function createSalesOrder(
  salesOrderData,
) {
  return await apiRequest(
    "/sales-orders",
    {
      method: "POST",
      body: JSON.stringify(
        salesOrderData,
      ),
    },
  );
}

export async function updateSalesOrder(
  salesOrderId,
  salesOrderData,
) {
  return await apiRequest(
    `/sales-orders/${salesOrderId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        salesOrderData,
      ),
    },
  );
}

export async function deleteSalesOrder(
  salesOrderId,
) {
  return await apiRequest(
    `/sales-orders/${salesOrderId}`,
    {
      method: "DELETE",
    },
  );
}


// ============================================================
// SALES ORDER ITEM API
// ============================================================

export async function getSalesOrderItems() {
  return await apiRequest(
    "/sales-order-items",
  );
}

export async function getSalesOrderItemsBySalesOrder(
  salesOrderId,
) {
  return await apiRequest(
    `/sales-order-items/sales-order/${salesOrderId}`,
  );
}

export async function getSalesOrderItem(
  salesOrderItemId,
) {
  return await apiRequest(
    `/sales-order-items/${salesOrderItemId}`,
  );
}

export async function createSalesOrderItem(
  itemData,
) {
  return await apiRequest(
    "/sales-order-items",
    {
      method: "POST",
      body: JSON.stringify(
        itemData,
      ),
    },
  );
}

export async function updateSalesOrderItem(
  salesOrderItemId,
  itemData,
) {
  return await apiRequest(
    `/sales-order-items/${salesOrderItemId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        itemData,
      ),
    },
  );
}

export async function deleteSalesOrderItem(
  salesOrderItemId,
) {
  return await apiRequest(
    `/sales-order-items/${salesOrderItemId}`,
    {
      method: "DELETE",
    },
  );
}





// ============================================================
// MACHINE APIs
// ============================================================

export async function getMachines() {
  return await apiRequest(
    "/machines"
  );
}

export async function getMachine(machineId) {
  return await apiRequest(
    `/machines/${machineId}`
  );
}

export async function createMachine(machineData) {
  return await apiRequest(
    "/machines",
    {
      method: "POST",
      body: JSON.stringify(machineData),
    }
  );
}

export async function updateMachine(
  machineId,
  machineData
) {
  return await apiRequest(
    `/machines/${machineId}`,
    {
      method: "PUT",
      body: JSON.stringify(machineData),
    }
  );
}

export async function deleteMachine(machineId) {
  return await apiRequest(
    `/machines/${machineId}`,
    {
      method: "DELETE",
    }
  );
}





// ============================================================
// DRAWING APIs
// ============================================================

export async function getDrawings() {
  return await apiRequest(
    "/drawings",
  );
}

export async function getDrawing(
  drawingId,
) {
  return await apiRequest(
    `/drawings/${drawingId}`,
  );
}

export async function getDrawingsByMachine(
  machineId,
) {
  return await apiRequest(
    `/drawings/machine/${machineId}`,
  );
}

export async function getDrawingsByProject(
  projectId,
) {
  return await apiRequest(
    `/drawings/project/${projectId}`,
  );
}

export async function createDrawing(
  drawingData,
) {
  return await apiRequest(
    "/drawings",
    {
      method: "POST",
      body: JSON.stringify(
        drawingData,
      ),
    },
  );
}

export async function updateDrawing(
  drawingId,
  drawingData,
) {
  return await apiRequest(
    `/drawings/${drawingId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        drawingData,
      ),
    },
  );
}

export async function deleteDrawing(
  drawingId,
) {
  return await apiRequest(
    `/drawings/${drawingId}`,
    {
      method: "DELETE",
    },
  );
}





// ============================================================
// DRAWING REVISION APIs
// ============================================================

export async function getDrawingRevisions(
  drawingId,
) {
  return await apiRequest(
    `/drawings/${drawingId}/revisions`,
  );
}

export async function getDrawingRevision(
  drawingId,
  revisionId,
) {
  return await apiRequest(
    `/drawings/${drawingId}/revisions/${revisionId}`,
  );
}

export async function createDrawingRevision(
  drawingId,
  revisionData,
) {
  return await apiRequest(
    `/drawings/${drawingId}/revisions`,
    {
      method: "POST",
      body: JSON.stringify(
        revisionData,
      ),
    },
  );
}

export async function deleteDrawingRevision(
  drawingId,
  revisionId,
) {
  return await apiRequest(
    `/drawings/${drawingId}/revisions/${revisionId}`,
    {
      method: "DELETE",
    },
  );
}