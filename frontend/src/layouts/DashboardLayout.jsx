import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className={`dashboard-layout ${
        sidebarOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={handleCloseSidebar}
        />
      )}

      <div className="dashboard-main">
        <Topbar
          onMenuClick={handleToggleSidebar}
        />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;