import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../services/api";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await getCurrentUser();

        if (result?.success) {
          setUser(result.data);
        }
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error,
        );
      }
    };

    loadUser();
  }, []);

  const userName = user?.name || "Admin User";
  const userRole = user?.role || "Administrator";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    onClose?.();

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside
      className={`sidebar ${
        isOpen ? "sidebar-open" : ""
      }`}
    >

      {/* ==================================================
          MOBILE CLOSE BUTTON
          ================================================== */}

      <button
        type="button"
        className="sidebar-close-button"
        aria-label="Close sidebar"
        onClick={onClose}
      >
        ×
      </button>


      {/* ==================================================
          LOGO
          ================================================== */}

      <div className="sidebar-logo">

        <div className="logo-box">
          DS
        </div>

        <div>
          <h2>DS Engineering</h2>
          <span>ERP System</span>
        </div>

      </div>


      {/* ==================================================
          NAVIGATION
          ================================================== */}

      <nav className="sidebar-nav">

        <div className="nav-section-title">
          MAIN MENU
        </div>


        {/* DASHBOARD */}

        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            ⌂
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>


        {/* CUSTOMERS */}

        <NavLink
          to="/customers"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            👥
          </span>

          <span>
            Customers
          </span>
        </NavLink>


        {/* PRODUCTS */}

        <NavLink
          to="/products"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            📦
          </span>

          <span>
            Products
          </span>
        </NavLink>


        {/* VENDORS */}

        <NavLink
          to="/vendors"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            🏢
          </span>

          <span>
            Vendors
          </span>
        </NavLink>


        {/* PROJECTS */}

        <NavLink
          to="/projects"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            📁
          </span>

          <span>
            Projects
          </span>
        </NavLink>


        {/* ==================================================
            BUSINESS
            ================================================== */}

        <div className="nav-section-title">
          BUSINESS
        </div>


        {/* PURCHASE ORDERS */}

        <NavLink
          to="/purchase-orders"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            🛒
          </span>

          <span>
            Purchase Orders
          </span>
        </NavLink>


        {/* QUOTATIONS */}

        <NavLink
          to="/quotations"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            📄
          </span>

          <span>
            Quotations
          </span>
        </NavLink>


        {/* SALES ORDERS */}

        <NavLink
          to="/sales-orders"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            💰
          </span>

          <span>
            Sales Orders
          </span>
        </NavLink>


        {/* INVOICES */}

        <NavLink
          to="/invoices"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            🧾
          </span>

          <span>
            Invoices
          </span>
        </NavLink>


        {/* ==================================================
            OPERATIONS
            ================================================== */}

        <div className="nav-section-title">
          OPERATIONS
        </div>


        {/* EMPLOYEES */}

        <NavLink
          to="/employees"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            👤
          </span>

          <span>
            Employees
          </span>
        </NavLink>


        {/* MACHINES */}

        <NavLink
          to="/machines"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            ⚙️
          </span>

          <span>
            Machines
          </span>
        </NavLink>


        {/* ==================================================
            SYSTEM
            ================================================== */}

        <div className="nav-section-title">
          SYSTEM
        </div>


        {/* SETTINGS */}

        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="nav-icon">
            ⚙
          </span>

          <span>
            Settings
          </span>
        </NavLink>

      </nav>


      {/* ==================================================
          USER / LOGOUT
          ================================================== */}

      <div className="sidebar-footer">

        <div className="user-avatar">
          {userInitial}
        </div>

        <div className="user-info">

          <strong>
            {userName}
          </strong>

          <span>
            {userRole}
          </span>

        </div>

        <button
          type="button"
          className="logout-button"
          title="Logout"
          onClick={handleLogout}
        >
          ↪
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;