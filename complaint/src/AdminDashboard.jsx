import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// Modular Components
import Sidebar from './admin/components/Sidebar';
import DetailsModal from './admin/components/DetailsModal';

// Pages
import DashboardOverview from './admin/pages/DashboardOverview';
import ComplaintManagement from './admin/pages/ComplaintManagement';
import EmergencyPanel from './admin/pages/EmergencyPanel';
import AnalyticsPage from './admin/pages/AnalyticsPage';
import DepartmentPerformance from './admin/pages/DepartmentPerformance';

const API_URL = "http://localhost:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('adminTheme') === 'dark');

  // Data State
  const [complaints, setComplaints] = useState([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState({});
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [complaintsRes, analyticsRes, performanceRes, activityRes] = await Promise.all([
        axios.get(`${API_URL}/get_complaints`, { headers }),
        axios.get(`${API_URL}/admin_analytics`, { headers }),
        axios.get(`${API_URL}/department_performance`, { headers }),
        axios.get(`${API_URL}/get_recent_activity`, { headers })
      ]);

      setComplaints(complaintsRes.data.complaints || []);
      setAdvancedAnalytics(analyticsRes.data);
      setDeptPerformance(performanceRes.data);
      const acts = Array.isArray(activityRes.data) ? activityRes.data : [];
      setNotifications(acts);
      setLoading(false);
    } catch (err) {
      console.error('Data Sync Failure:', err);
      // If unauthorized, redirect to login
      if (err.response?.status === 401) navigate('/login');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAllData, 120000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleUpdateStatus = async (id, status, adminNote = null) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/update_status`, {
        complaintId: id,
        status,
        adminNote // Backend needs to support this but we send it anyway
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setSelectedComplaint(null);
      fetchAllData();
    } catch (err) {
      alert('Operation failed. Connection to governance server lost.');
    }
  };

  const handleAssignDept = async (id, department) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/assign_department`, {
        complaintId: id,
        department
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      fetchAllData();
    } catch (err) {
      alert('Department assignment failed.');
    }
  };

  const onLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // UI Theme toggle
  useEffect(() => {
    document.body.className = isDarkMode ? 'admin-dark-theme' : 'admin-light-theme';
    localStorage.setItem('adminTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className={`admin-app-container ${isSidebarCollapsed ? 'sidebar-min' : ''}`}>
      <Sidebar
        activeView={view}
        setView={setView}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={onLogout}
      />

      <main className="admin-main-view">
        <header className="admin-top-bar">
          <div className="system-status">
            <span className="pulse-dot"></span> System Live: Municipal Grid Online
          </div>
          <div className="top-bar-actions">
            <div className="notifications-wrapper" onMouseLeave={() => setShowNotifications(false)}>
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔 {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <h4>Recent Activity</h4>
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No recent activity</p>
                  ) : (
                    <ul>
                      {notifications.map((n, idx) => (
                        <li key={idx} className={n.type === 'priority_complaint' ? 'urgent-notification' : ''}>
                          <strong>{n.type.replace('_', ' ').toUpperCase()}</strong>
                          <span>{n.message}</span>
                          <small>{n.time_ago || new Date(n.timestamp).toLocaleTimeString()}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="admin-profile">
              <div className="avatar">A</div>
              <span className="profile-name">System Administrator</span>
            </div>
          </div>
        </header>

        <section className="admin-viewport">
          {view === 'overview' && <DashboardOverview analytics={advancedAnalytics} loading={loading} />}
          {view === 'complaints' && (
            <ComplaintManagement
              complaints={complaints}
              loading={loading}
              onViewDetails={setSelectedComplaint}
              onUpdateStatus={handleUpdateStatus}
              onAssignDept={handleAssignDept}
            />
          )}
          {view === 'emergency' && (
            <EmergencyPanel
              complaints={complaints}
              loading={loading}
              onViewDetails={setSelectedComplaint}
            />
          )}
          {view === 'analytics' && <AnalyticsPage analytics={advancedAnalytics} loading={loading} />}
          {view === 'performance' && <DepartmentPerformance performance={deptPerformance} loading={loading} />}
          {view === 'settings' && (
            <div className="admin-page-content">
              <h1>System Settings</h1>
              <p>Governance configuration panel - Restricted area.</p>
            </div>
          )}
        </section>
      </main>

      {selectedComplaint && (
        <DetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdateStatus={handleUpdateStatus}
          API_URL={API_URL}
        />
      )}
    </div>
  );
};

export default AdminDashboard;