import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      await login(email, password);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.message || "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo">
          <div className="login-logo-box">DS</div>

          <div>
            <h1>DS Engineering</h1>
            <span>ERP System</span>
          </div>
        </div>

        {/* HEADING */}
        <div className="login-heading">
          <h2>Welcome Back</h2>
          <p>
            Sign in to access your ERP dashboard.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <span>DS Engineering ERP</span>
          <span>•</span>
          <span>Secure Access</span>
        </div>

      </div>
    </div>
  );
}

export default Login;