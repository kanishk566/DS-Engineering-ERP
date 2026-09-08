import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api";

function Topbar({ onMenuClick }) {
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

  return (
    <header className="topbar">

      <div className="topbar-left">

        <button
          type="button"
          className="menu-button"
          aria-label="Toggle sidebar"
          aria-expanded="false"
          onClick={onMenuClick}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div>
          <h1>Dashboard</h1>

          <p>
            Welcome back, {userName}
          </p>
        </div>

      </div>

      <div className="topbar-right">

        <button
          type="button"
          className="notification-button"
          aria-label="Notifications"
        >
          🔔

          <span className="notification-badge">
            3
          </span>
        </button>

        <div className="topbar-user">

          <div className="topbar-avatar">
            {userInitial}
          </div>

          <div className="topbar-user-info">

            <strong>
              {userName}
            </strong>

            <span>
              {userRole}
            </span>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;