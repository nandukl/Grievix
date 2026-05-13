import React from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';
import "./home.css";

const Home = () => {
  const navigate = useNavigate();

  const infoSections = [
    {
      title: "Report Issues",
      description: "Easily report municipal problems like potholes, streetlight outages, waste management issues, and more. Upload photos and details for faster resolution."
    },
    {
      title: "Track Progress",
      description: "Monitor the status of your complaints in real-time. Get notified about updates and see exactly how your local government is addressing your concerns."
    },
    {
      title: "Community Verification",
      description: "Help ensure accountability by verifying if issues are truly resolved. Your community votes help escalate unresolved problems to the right authorities."
    }
  ];

  const features = [
    {
      title: "Real-time Updates",
      description: "Stay informed with live progress tracking of your complaints"
    },
    {
      title: "Transparency",
      description: "View all public complaints and their resolution status"
    },
    {
      title: "Community Power",
      description: "Collective verification ensures issues don't get ignored"
    },
    {
      title: "Government Accountability",
      description: "Escalation system ensures unresolved issues get attention"
    }
  ];

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="logo">
          <span className="logo-accent">GRIEV</span>
          <span>IX</span>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate("/login")} className="header-btn">Login</button>
          <button onClick={() => navigate("/signup")} className="header-btn">Sign Up</button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Transforming Municipal Governance</h1>
        <p className="hero-description">
          Empowering citizens to report, track, and resolve community issues with transparency and accountability
        </p>
        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/signup")} className="cta-btn">Get Started</button>
        </div>
      </div>

      {/* Features Section */}
      <div className="section-padding bg-light">
        <h2 className="section-title">Why Choose Grievix?</h2>
        <p className="section-subtitle">
          A smarter way to engage with your local government and improve your community
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-circle">
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>{index + 1}</span>
              </div>
              <h3>{feature.title}</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="section-padding">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          Participating in municipal governance has never been easier
        </p>
        <div className="info-grid">
          {infoSections.map((info, index) => (
            <div key={index} className="info-card">
              <div className="number-circle">
                {index + 1}
              </div>
              <h3>{info.title}</h3>
              <p style={{ lineHeight: "1.6", color: "#555" }}>{info.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <h2 style={{ fontSize: "32px", marginBottom: "40px" }}>Making a Difference in Communities</h2>
        <div className="stats-grid">
          <div>
            <div className="stat-number">10K+</div>
            <div className="stat-label">Issues Reported</div>
          </div>
          <div>
            <div className="stat-number">85%</div>
            <div className="stat-label">Resolution Rate</div>
          </div>
          <div>
            <div className="stat-number">5K+</div>
            <div className="stat-label">Active Citizens</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="final-cta">
        <h2 className="section-title">Ready to Make a Change?</h2>
        <p className="section-subtitle">
          Join thousands of citizens who are already improving their communities with Grievix
        </p>
        <button onClick={() => navigate("/signup")} className="cta-btn" style={{ padding: "15px 40px", fontSize: "18px" }}>Create Your Account</button>
      </div>

      {/* Footer */}
      {/* Mobile QR Section */}
      <section className="mobile-access">
        <div className="mobile-content">
          <div className="mobile-text">
            <h2>Access on the Go</h2>
            <p>Scan this QR code to open Grievix on your mobile device. Report issues instantly from the location of the incident.</p>
            <div className="mobile-badges">
              <div className="badge">📱 Mobile Optimized</div>
              <div className="badge">📍 Live GPS</div>
              <div className="badge">📸 Camera Uploads</div>
            </div>
          </div>
          <div className="mobile-qr-card">
            <QRCodeCanvas
              value={window.location.href}
              size={180}
              level={"H"}
              includeMargin={true}
            />
            <p className="qr-label">Scan to open on Mobile</p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="footer-logo">
            <span className="logo-accent">GRIEV</span>
            <span>IX</span>
          </div>
          <p style={{ marginBottom: "20px", color: "#aaa" }}>
            Empowering citizens to create better communities through transparent governance
          </p>
          <div className="footer-links">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="footer-bottom">
            © {new Date().getFullYear()} Grievix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
