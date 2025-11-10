import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import "./MainPage.css";

function MainPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // Get user email
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      // Extract name from email (before @)
      const name = userEmail.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
    
    // Check if user is admin from localStorage
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    
    // Redirect admin to admin dashboard
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="main-page">
      <header className="main-header">
        <div className="header-content">
          <h1 className="main-title">Municipal Complaints System</h1>
          <p className="subtitle">Empowering citizens to improve their community</p>
        </div>
        <div className="user-actions">
          <span className="welcome-user">Welcome, {userName}!</span>
          <button className="logout-button" onClick={handleLogout}>
            <span className="button-icon">🚪</span>
            Logout
          </button>
        </div>
      </header>
      
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="card-icon">📝</div>
          <h2>Submit a Complaint</h2>
          <p>Report issues in your community like potholes, streetlight outages, or waste management problems.</p>
          <button 
            className="nav-button primary"
            onClick={() => navigate('/submit')}
          >
            Submit Complaint
          </button>
        </div>
        
        <div className="dashboard-card">
          <div className="card-icon">👁️</div>
          <h2>View Complaints</h2>
          <p>Check the status of your complaints or browse all public complaints in your area.</p>
          <button 
            className="nav-button secondary"
            onClick={() => navigate('/view')}
          >
            View Complaints
          </button>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-card">
          <div className="info-icon">📊</div>
          <h3>Real-time Tracking</h3>
          <p>Monitor the progress of your complaints and see when they're resolved.</p>
        </div>
        
        <div className="info-card">
          <div className="info-icon">👥</div>
          <h3>Community Verification</h3>
          <p>Help ensure accountability by verifying if issues are truly resolved.</p>
        </div>
        
        <div className="info-card">
          <div className="info-icon">📈</div>
          <h3>Transparency</h3>
          <p>View statistics and analytics about complaint resolution in your municipality.</p>
        </div>
      </div>
    </div>
  );
}

export default MainPage;