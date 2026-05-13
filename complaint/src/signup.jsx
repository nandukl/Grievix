import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    district: "",
    pincode: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/register', formData);

      alert("Signup successful! You can now log in.");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.error || "Signup failed! Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "800px" }}>
        <div className="auth-header">
          <h1 className="auth-logo">
            <span className="logo-accent">GRIEV</span>
            <span>IX</span>
          </h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form onSubmit={handleSignup}>
          <div className="auth-grid">
            {/* Left Side - Personal Details */}
            <div>
              <h3 style={{ color: "#1a3a6d", marginBottom: "15px", borderBottom: "2px solid #f0f4f8", paddingBottom: "5px" }}>Personal Info</h3>

              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full name"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div className="password-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    required
                    onChange={handleChange}
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

              <div className="auth-form-group">
                <label className="auth-label">Confirm Password</label>
                <div className="password-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm"
                    required
                    onChange={handleChange}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Address Details */}
            <div>
              <h3 style={{ color: "#1a3a6d", marginBottom: "15px", borderBottom: "2px solid #f0f4f8", paddingBottom: "5px" }}>Address Info</h3>

              <div className="auth-form-group">
                <label className="auth-label">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">District</label>
                <input
                  type="text"
                  name="district"
                  placeholder="District"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone number"
                  required
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </div>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Login</Link>
        </p>
        <p className="auth-footer-text">
          <Link to="/" className="auth-link">Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
