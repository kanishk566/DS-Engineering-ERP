import { useLocation } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import AppRoutes from "./routes/AppRoutes";

import "./App.css";

function App() {
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <AppRoutes />;
  }

  return (
    <DashboardLayout>
      <AppRoutes />
    </DashboardLayout>
  );
}

export default App;