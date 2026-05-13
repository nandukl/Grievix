import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("user"); // "user" or "admin"
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email,
        password
      });

      const { token, role, fullName } = response.data;

      // Store common session info
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);
      localStorage.setItem("token", token);
      if (fullName) localStorage.setItem("userName", fullName);

      if (role === "admin") {
        // Fetch priority complaints for admin
        try {
          const activityResponse = await axios.get('http://localhost:5000/get_recent_activity', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const priorityActivities = activityResponse.data.filter(activity =>
            activity.type === "priority_complaint"
          );

          if (priorityActivities.length > 0) {
            localStorage.setItem("priorityComplaints", JSON.stringify(priorityActivities));
          }
        } catch (error) {
          console.error("Error checking for priority complaints:", error);
        }
        navigate("/admin");
      } else {
        // Regular user login
        navigate("/mainpage");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.error || "Login failed! Please check your credentials.";
      alert(errorMsg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">
            <span className="logo-accent">GRIEV</span>
            <span>IX</span>
          </h1>
          <p className="auth-subtitle">Login to your account</p>
        </div>

        <div className="auth-toggle">
          <button
            className={`toggle-btn ${loginType === "user" ? "active" : ""}`}
            onClick={() => setLoginType("user")}
          >
            User Login
          </button>
          <button
            className={`toggle-btn ${loginType === "admin" ? "active" : ""}`}
            onClick={() => setLoginType("admin")}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ marginBottom: "20px" }}>
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            Login as {loginType === "admin" ? "Administrator" : "User"}
          </button>
        </form>

        {loginType === "user" && (
          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </p>
        )}

        <p className="auth-footer-text">
          <Link to="/" className="auth-link">Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
