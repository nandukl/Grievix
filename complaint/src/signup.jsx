import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

  const handleSignup = (e) => {
    e.preventDefault();

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Get existing users or create empty array
    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
    
    // Check if email already exists
    if (existingUsers.some(user => user.email === formData.email)) {
      alert("Email already registered! Please use a different email.");
      return;
    }
    
    // Add new user to array
    existingUsers.push(formData);
    
    // Save updated users array to localStorage
    localStorage.setItem("users", JSON.stringify(existingUsers));
    
    alert("Signup successful! Please log in.");
    navigate("/login");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #1a3a6d 0%, #2e5a99 100%)",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "15px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        width: "100%",
        maxWidth: "900px",
        padding: "40px",
        position: "relative"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ 
            color: "#1a3a6d", 
            fontSize: "32px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <span style={{ color: "#4fc3f7" }}>GRIEV</span>
            <span>IX</span>
          </h1>
          <p style={{ color: "#666", fontSize: "18px" }}>Create your account</p>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
            {/* Left Side - Personal Details */}
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: "#1a3a6d", 
                marginBottom: "20px", 
                paddingBottom: "10px", 
                borderBottom: "2px solid #f0f4f8" 
              }}>
                Personal Information
              </h3>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Enter your full name" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Create a password" 
                    required 
                    onChange={handleChange} 
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "border 0.3s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                    onBlur={(e) => e.target.style.borderColor = "#ddd"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#666",
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    placeholder="Confirm your password" 
                    required 
                    onChange={handleChange} 
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "border 0.3s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                    onBlur={(e) => e.target.style.borderColor = "#ddd"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#666",
                      cursor: "pointer"
                    }}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Address Details */}
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: "#1a3a6d", 
                marginBottom: "20px", 
                paddingBottom: "10px", 
                borderBottom: "2px solid #f0f4f8" 
              }}>
                Address Information
              </h3>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Residential Address
                </label>
                <input 
                  type="text" 
                  name="address" 
                  placeholder="Enter your full address" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  District
                </label>
                <input 
                  type="text" 
                  name="district" 
                  placeholder="Enter your district" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Pincode
                </label>
                <input 
                  type="text" 
                  name="pincode" 
                  placeholder="Enter your pincode" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  textAlign: "left", 
                  marginBottom: "8px", 
                  fontWeight: "500", 
                  color: "#333" 
                }}>
                  Phone Number
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  placeholder="Enter your phone number" 
                  required 
                  onChange={handleChange} 
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
            </div>
          </div>

          {/* Sign Up Button */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button 
              type="submit" 
              style={{
                padding: "15px 40px",
                backgroundColor: "#1a3a6d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#2e5a99"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#1a3a6d"}
            >
              Create Account
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "25px" }}>
          Already have an account? <Link to="/login" style={{ color: "#1a3a6d", fontWeight: "600", textDecoration: "none" }}>Login</Link>
        </p>
        <p style={{ textAlign: "center" }}>
          <Link to="/" style={{ color: "#1a3a6d", fontWeight: "600", textDecoration: "none" }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;