import React from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "15px 40px", 
        backgroundColor: "#1a3a6d", 
        color: "white", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: "28px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
          <span style={{ color: "#4fc3f7" }}>GRIEV</span>
          <span>IX</span>
        </div>
        <div>
          <button onClick={() => navigate("/login")} style={buttonStyle}>Login</button>
          <button onClick={() => navigate("/signup")} style={buttonStyle}>Sign Up</button>
        </div>
      </header>

      {/* Hero Section */}
      <div style={heroSectionStyle}>
        <h1 style={heroTitleStyle}>Transforming Municipal Governance</h1>
        <p style={heroDescriptionStyle}>
          Empowering citizens to report, track, and resolve community issues with transparency and accountability
        </p>
        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/signup")} style={ctaButtonStyle}>Get Started</button>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: "60px 20px", backgroundColor: "#f8f9fa" }}>
        <h2 style={{ textAlign: "center", fontSize: "32px", marginBottom: "10px", color: "#1a3a6d" }}>Why Choose Grievix?</h2>
        <p style={{ textAlign: "center", fontSize: "18px", color: "#666", marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px" }}>
          A smarter way to engage with your local government and improve your community
        </p>
        <div style={featuresContainerStyle}>
          {features.map((feature, index) => (
            <div key={index} style={featureCardStyle}>
              <div style={featureIconStyle}>
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>{index + 1}</span>
              </div>
              <h3 style={{ marginBottom: "10px", color: "#1a3a6d" }}>{feature.title}</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={infoSectionStyle}>
        <h2 style={{ textAlign: "center", fontSize: "32px", marginBottom: "10px", color: "#1a3a6d" }}>How It Works</h2>
        <p style={{ textAlign: "center", fontSize: "18px", color: "#666", marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px" }}>
          Participating in municipal governance has never been easier
        </p>
        <div style={infoContainerStyle}>
          {infoSections.map((info, index) => (
            <div key={index} style={infoCardStyle}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#4fc3f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1a3a6d"
              }}>
                {index + 1}
              </div>
              <h3 style={{ marginBottom: "15px", color: "#1a3a6d" }}>{info.title}</h3>
              <p style={{ lineHeight: "1.6", color: "#555" }}>{info.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: "60px 20px", backgroundColor: "#1a3a6d", color: "white", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "40px" }}>Making a Difference in Communities</h2>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "40px" }}>
          <div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4fc3f7" }}>10K+</div>
            <div style={{ fontSize: "18px", marginTop: "10px" }}>Issues Reported</div>
          </div>
          <div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4fc3f7" }}>85%</div>
            <div style={{ fontSize: "18px", marginTop: "10px" }}>Resolution Rate</div>
          </div>
          <div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4fc3f7" }}>5K+</div>
            <div style={{ fontSize: "18px", marginTop: "10px" }}>Active Citizens</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: "80px 20px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "20px", color: "#1a3a6d" }}>Ready to Make a Change?</h2>
        <p style={{ fontSize: "18px", color: "#666", marginBottom: "30px", maxWidth: "700px", margin: "0 auto 30px" }}>
          Join thousands of citizens who are already improving their communities with Grievix
        </p>
        <button onClick={() => navigate("/signup")} style={{...ctaButtonStyle, padding: "15px 40px", fontSize: "18px"}}>Create Your Account</button>
      </div>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: "#0d1b2a", 
        color: "white", 
        padding: "40px 20px", 
        textAlign: "center",
        fontSize: "14px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
            <span style={{ color: "#4fc3f7" }}>GRIEV</span>
            <span>IX</span>
          </div>
          <p style={{ marginBottom: "20px", color: "#aaa" }}>
            Empowering citizens to create better communities through transparent governance
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginBottom: "20px" }}>
            <a href="#" style={{ color: "#4fc3f7", textDecoration: "none" }}>Home</a>
            <a href="#" style={{ color: "#4fc3f7", textDecoration: "none" }}>About</a>
            <a href="#" style={{ color: "#4fc3f7", textDecoration: "none" }}>Contact</a>
            <a href="#" style={{ color: "#4fc3f7", textDecoration: "none" }}>Privacy Policy</a>
          </div>
          <div style={{ borderTop: "1px solid #333", paddingTop: "20px", color: "#777" }}>
            © {new Date().getFullYear()} Grievix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const buttonStyle = {
  marginRight: "10px",
  padding: "10px 20px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  backgroundColor: "transparent",
  color: "white",
  borderRadius: "5px",
  border: "1px solid white",
  transition: "all 0.3s ease"
};

const heroSectionStyle = {
  padding: "100px 20px",
  background: "linear-gradient(135deg, #1a3a6d 0%, #2e5a99 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  color: "white"
};

const heroTitleStyle = {
  fontSize: "48px",
  maxWidth: "800px",
  fontWeight: "bold",
  marginBottom: "20px"
};

const heroDescriptionStyle = {
  fontSize: "20px",
  maxWidth: "800px",
  marginTop: "10px",
  lineHeight: "1.6",
  marginBottom: "20px"
};

const ctaButtonStyle = {
  padding: "12px 30px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  backgroundColor: "#4fc3f7",
  color: "#1a3a6d",
  borderRadius: "30px",
  fontWeight: "bold",
  transition: "all 0.3s ease",
  border: "2px solid #4fc3f7"
};

const infoSectionStyle = {
  padding: "60px 20px"
};

const infoContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "30px",
  marginTop: "20px",
  flexWrap: "wrap",
  maxWidth: "1200px",
  margin: "0 auto"
};

const infoCardStyle = {
  backgroundColor: "white",
  padding: "30px 25px",
  borderRadius: "10px",
  color: "#333",
  width: "320px",
  textAlign: "center",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease"
};

const featuresContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "25px",
  flexWrap: "wrap",
  maxWidth: "1200px",
  margin: "0 auto"
};

const featureCardStyle = {
  backgroundColor: "white",
  padding: "30px 25px",
  borderRadius: "10px",
  width: "250px",
  textAlign: "center",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
};

const featureIconStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  backgroundColor: "#e3f2fd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px",
  color: "#1a3a6d"
};

export default Home;