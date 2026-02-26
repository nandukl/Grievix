import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("user"); // "user" or "admin"
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loginType === "admin") {
      // Admin login - hardcoded for demo
      if (email === "admin@grievix.com" && password === "admin123") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", "admin");
        
        // Check for priority complaints if this is an admin login
        try {
          const response = await axios.get('http://localhost:5000/get_recent_activity');
          const activities = response.data;
          
          // Check if there are any priority complaints in recent activity
          const priorityActivities = activities.filter(activity => 
            activity.type === "priority_complaint"
          );
          
          if (priorityActivities.length > 0) {
            // Store the priority complaints in localStorage to show on dashboard
            localStorage.setItem("priorityComplaints", JSON.stringify(priorityActivities));
          }
        } catch (error) {
          console.error("Error checking for priority complaints:", error);
        }
        
        navigate("/admin");
      } else {
        alert("Invalid admin credentials!");
      }
      return;
    }

    // Regular user login
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      alert("Invalid email or password!");
      return;
    }

    // Save logged-in user session
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", "user"); // Explicitly set role as user

    // Navigate to dashboard
    navigate("/mainpage");
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
        maxWidth: "450px",
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
          <p style={{ color: "#666", fontSize: "18px" }}>Login to your account</p>
        </div>
        
        <div style={{
          display: "flex",
          marginBottom: "30px",
          backgroundColor: "#f0f4f8",
          borderRadius: "30px",
          padding: "5px"
        }}>
          <button 
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "30px",
              backgroundColor: loginType === "user" ? "#1a3a6d" : "transparent",
              color: loginType === "user" ? "white" : "#666",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => setLoginType("user")}
          >
            User Login
          </button>
          <button 
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "30px",
              backgroundColor: loginType === "admin" ? "#1a3a6d" : "transparent",
              color: loginType === "admin" ? "white" : "#666",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => setLoginType("admin")}
          >
            Admin Login
          </button>
        </div>
        
        <form onSubmit={handleLogin} style={{ marginBottom: "20px" }}>
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
              placeholder="Enter your email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{
                width: "100%",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border 0.3s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4fc3f7"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>
          
          <div style={{ marginBottom: "25px" }}>
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
                placeholder="Enter your password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{
                  width: "100%",
                  padding: "15px",
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
          
          <button 
            type="submit" 
            style={{
              width: "100%",
              padding: "15px",
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
            Login as {loginType === "admin" ? "Administrator" : "User"}
          </button>
        </form>
        
        {loginType === "user" && (
          <p style={{ textAlign: "center", marginBottom: "15px" }}>
            Don't have an account? <Link to="/signup" style={{ color: "#1a3a6d", fontWeight: "600", textDecoration: "none" }}>Sign Up</Link>
          </p>
        )}
        
        <p style={{ textAlign: "center" }}>
          <Link to="/" style={{ color: "#1a3a6d", fontWeight: "600", textDecoration: "none" }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;