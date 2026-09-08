import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/dashboard/Dashboard";
import Customers from "../pages/customers/Customers";
import Products from "../pages/products/Products";
import Vendors from "../pages/vendors/Vendors";
import Projects from "../pages/projects/Projects";
import PurchaseOrders from "../pages/purchase-orders/PurchaseOrders";
import Quotations from "../pages/quotations/Quotations";
import SalesOrders from "../pages/sales-orders/SalesOrders";
import Invoices from "../pages/invoices/Invoices";
import InvoiceForm from "../pages/invoices/InvoiceForm";
import Machines from "../pages/machines/Machines";
import Settings from "../pages/settings/Settings";
import Login from "../pages/auth/Login";

import ProtectedRoute from "./ProtectedRoute";

import Drawing from "../pages/machines/Drawing";

import Employee from "../pages/Employee";
function AppRoutes() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC ROUTE
          ====================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* ======================================================
          PROTECTED ROUTES
          ====================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/vendors"
          element={<Vendors />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/purchase-orders"
          element={<PurchaseOrders />}
        />

        <Route
          path="/quotations"
          element={<Quotations />}
        />

        <Route
          path="/sales-orders"
          element={<SalesOrders />}
        />

        {/* ==================================================
            INVOICES
            ================================================== */}

        <Route
          path="/invoices"
          element={<Invoices />}
        />

        <Route
          path="/invoices/new"
          element={<InvoiceForm />}
        />

        <Route
          path="/invoices/edit/:id"
          element={<InvoiceForm />}
        />

        {/* ==================================================
            MACHINES
            ================================================== */}

        <Route
          path="/machines"
          element={<Machines />}
        />


        <Route
  path="/drawings"
  element={<Drawing />}
/>

<Route
  path="/employees"
  element={<Employee />}
/>



        {/* ==================================================
            SETTINGS
            ================================================== */}

        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* ==================================================
            FALLBACK
            ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Route>

    </Routes>
  );
}

export default AppRoutes;