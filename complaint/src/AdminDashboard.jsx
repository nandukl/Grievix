import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [noteText, setNoteText] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [departments] = useState([
    "Water Department",
    "Road Department",
    "Sanitation Department",
    "Electricity Department",
    "Drainage Department",
    "General Department"
  ]);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000';
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    navigate('/login');
  };
  
  useEffect(() => {
    // Check if user is logged in and is admin
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get_complaints`, {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sort: 'highest_priority',
          per_page: 20,
          include_resolved: 'true'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.complaints) {
        setComplaints(response.data.complaints);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection and try again.');
      } else {
        setError('Failed to load complaints. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await axios.post(`${API_URL}/update_status`, {
        complaintId,
        status: newStatus
      });
      
      // Update local state
      setComplaints(complaints.map(complaint => {
        if (complaint._id === complaintId) {
          return { ...complaint, status: newStatus };
        }
        return complaint;
      }));
      
      // If we're updating the selected complaint, update that too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus });
      }
      
      // Refresh analytics on the public view page by calling the refresh endpoint
      try {
        await axios.get(`${API_URL}/get_analytics`);
      } catch (analyticsErr) {
        console.error('Error refreshing analytics:', analyticsErr);
      }
      
      // Refresh recent activity
      fetchRecentActivity();
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update complaint status. Please try again.');
    }
  };

  const assignToDepartment = async (complaintId, department) => {
    try {
      await axios.post(`${API_URL}/assign_department`, {
        complaintId,
        department
      });
      
      // Update local state
      setComplaints(complaints.map(complaint => {
        if (complaint._id === complaintId) {
          return { ...complaint, assigned_department: department };
        }
        return complaint;
      }));
      
      // If we're updating the selected complaint, update that too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, assigned_department: department });
      }
      
      // Refresh recent activity
      fetchRecentActivity();
      
    } catch (error) {
      console.error('Error assigning department:', error);
      alert('Failed to assign department. Please try again.');
    }
  };

  const saveAdminNote = async (complaintId, noteText) => {
    try {
      await axios.post(`${API_URL}/save_admin_note`, {
        complaintId,
        noteText
      });
      
      // Update local state
      setComplaints(complaints.map(complaint => {
        if (complaint._id === complaintId) {
          const newNote = {
            text: noteText,
            timestamp: new Date().toISOString(),
            admin: "Administrator"
          };
          return { 
            ...complaint, 
            admin_notes: [...(complaint.admin_notes || []), newNote]
          };
        }
        return complaint;
      }));
      
      // If we're updating the selected complaint, update that too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const newNote = {
          text: noteText,
          timestamp: new Date().toISOString(),
          admin: "Administrator"
        };
        setSelectedComplaint({ 
          ...selectedComplaint, 
          admin_notes: [...(selectedComplaint.admin_notes || []), newNote]
        });
      }
      
      alert('Admin note saved successfully!');
      setNoteText(''); // Clear the note text field
      
      // Refresh recent activity
      fetchRecentActivity();
      
    } catch (error) {
      console.error('Error saving admin note:', error);
      alert('Failed to save admin note. Please try again.');
    }
  };

  const handleComplaintSelect = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const filteredComplaints = complaints.filter(complaint => {
    // First apply status filter
    if (statusFilter !== 'all' && complaint.status !== statusFilter) {
      return false;
    }
    
    // Then apply search filter if there is a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        complaint.complaint.toLowerCase().includes(query) ||
        complaint.category.toLowerCase().includes(query) ||
        (complaint.location && complaint.location.toLowerCase().includes(query)) ||
        (complaint.assigned_department && complaint.assigned_department.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'var(--success-color)';
      case 'in_progress': return 'var(--warning-color)';
      case 'new': 
      default: return 'var(--info-color)';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Water Issues': return '#2196F3';
      case 'Road Issues': return '#F44336';
      case 'Garbage Issues': return '#4CAF50';
      case 'Electricity': return '#FF9800';
      case 'Drainage Issues': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  const [analytics, setAnalytics] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    new: 0,
    categoryCounts: {},
    departmentCounts: {}
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_analytics`, { timeout: 5000 });
      if (response.data) {
        setAnalytics({
          total: response.data.total_complaints || 0,
          resolved: response.data.resolved_count || 0,
          inProgress: 0, // We'll calculate this from the resolved and total
          new: 0, // We'll calculate this from the resolved and total
          categoryCounts: response.data.category_counts || {},
          departmentCounts: {} // This would need to be calculated separately
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Calculate analytics data from complaints (for department counts)
  const calculateLocalAnalytics = () => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const newComplaints = complaints.filter(c => c.status === 'new').length;
    
    // Category distribution
    const categoryCounts = {};
    complaints.forEach(complaint => {
      categoryCounts[complaint.category] = (categoryCounts[complaint.category] || 0) + 1;
    });
    
    // Department distribution
    const departmentCounts = {};
    complaints.forEach(complaint => {
      const dept = complaint.assigned_department || 'Unassigned';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });
    
    return {
      total,
      resolved,
      inProgress,
      new: newComplaints,
      categoryCounts,
      departmentCounts
    };
  };

  const localAnalytics = calculateLocalAnalytics();

  // Fetch analytics when component mounts
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Render status chart
  const renderStatusChart = () => {
    const newCount = analytics.new;
    const inProgress = analytics.inProgress;
    const resolved = analytics.resolved;
    const total = newCount + inProgress + resolved;
    
    if (total === 0) return null;
    
    return (
      <div className="chart-container">
        <h3>Complaint Status Distribution</h3>
        <div className="chart-bars">
          <div className="chart-bar">
            <div className="bar-label">New</div>
            <div className="bar-container">
              <div 
                className="bar" 
                style={{ 
                  width: `${(newCount / total) * 100}%`,
                  backgroundColor: 'var(--info-color)'
                }}
              ></div>
            </div>
            <div className="bar-value">{newCount}</div>
          </div>
          <div className="chart-bar">
            <div className="bar-label">In Progress</div>
            <div className="bar-container">
              <div 
                className="bar" 
                style={{ 
                  width: `${(inProgress / total) * 100}%`,
                  backgroundColor: 'var(--warning-color)'
                }}
              ></div>
            </div>
            <div className="bar-value">{inProgress}</div>
          </div>
          <div className="chart-bar">
            <div className="bar-label">Resolved</div>
            <div className="bar-container">
              <div 
                className="bar" 
                style={{ 
                  width: `${(resolved / total) * 100}%`,
                  backgroundColor: 'var(--success-color)'
                }}
              ></div>
            </div>
            <div className="bar-value">{resolved}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render category chart
  const renderCategoryChart = () => {
    const categories = Object.keys(analytics.categoryCounts);
    
    if (categories.length === 0) return null;
    
    const maxCount = Math.max(...Object.values(analytics.categoryCounts));
    
    return (
      <div className="chart-container">
        <h3>Complaints by Category</h3>
        <div className="chart-bars">
          {categories.map(category => (
            <div className="chart-bar" key={category}>
              <div className="bar-label">{category}</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${(analytics.categoryCounts[category] / maxCount) * 100}%`,
                    backgroundColor: getCategoryColor(category)
                  }}
                ></div>
              </div>
              <div className="bar-value">{analytics.categoryCounts[category]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render department chart
  const renderDepartmentChart = () => {
    const departments = Object.keys(analytics.departmentCounts);
    
    if (departments.length === 0) return null;
    
    const maxCount = Math.max(...Object.values(analytics.departmentCounts));
    
    return (
      <div className="chart-container">
        <h3>Complaints by Department</h3>
        <div className="chart-bars">
          {departments.map(dept => (
            <div className="chart-bar" key={dept}>
              <div className="bar-label">{dept}</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${(analytics.departmentCounts[dept] / maxCount) * 100}%`,
                    backgroundColor: `hsl(${(analytics.departmentCounts[dept] * 10)}, 70%, 50%)`
                  }}
                ></div>
              </div>
              <div className="bar-value">{analytics.departmentCounts[dept]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const autoAssignDepartment = (complaintId, category) => {
    let department = "General Department";
    
    // Auto-assign based on category
    if (category.includes("Water")) {
      department = "Water Department";
    } else if (category.includes("Road")) {
      department = "Road Department";
    } else if (category.includes("Garbage")) {
      department = "Sanitation Department";
    } else if (category.includes("Electricity")) {
      department = "Electricity Department";
    } else if (category.includes("Drainage")) {
      department = "Drainage Department";
    }
    
    assignToDepartment(complaintId, department);
    alert(`Complaint automatically assigned to ${department}`);
    
    // Refresh recent activity
    fetchRecentActivity();
  };

  // Add a function to refresh analytics
  const refreshAnalytics = async () => {
    try {
      // In a real implementation, you might want to broadcast this to other components
      // For now, we'll just log that analytics were refreshed
      console.log('Analytics refreshed');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_recent_activity`, { timeout: 5000 });
      if (response.data) {
        // Transform the data to match our UI format
        const activity = response.data.map(item => ({
          id: item._id,
          icon: getActivityIcon(item.type),
          message: item.message,
          time: item.time_ago || 'Recently'
        }));
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Fallback to static data if API fails
      const fallbackActivity = [
        {
          id: 1,
          icon: '🆕',
          message: 'New complaint submitted in Water Issues category',
          time: '2 minutes ago'
        },
        {
          id: 2,
          icon: '✅',
          message: 'Complaint #ABC123 marked as resolved',
          time: '15 minutes ago'
        },
        {
          id: 3,
          icon: '🏢',
          message: '5 complaints auto-assigned to Road Department',
          time: '1 hour ago'
        }
      ];
      setRecentActivity(fallbackActivity);
    }
  };

  // Get appropriate icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_complaint': return '🆕';
      case 'status_update': return '✅';
      case 'department_assignment': return '🏢';
      case 'admin_note': return '📝';
      default: return '🕒';
    }
  };

  // Fetch recent activity when component mounts
  useEffect(() => {
    fetchRecentActivity();
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔧 Grievix Admin Dashboard</h1>
          <p className="header-subtitle">Manage and track all municipal complaints</p>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="button-icon">🚪</span>
            Logout
          </button>
        </div>
      </header>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'assign' ? 'active' : ''}`} 
          onClick={() => setActiveTab('assign')}
        >
          🏢 Assign Department
        </button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="search-filter">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-icon">🔍</button>
            </div>
            <div className="status-filters">
              <button 
                className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${statusFilter === 'new' ? 'active' : ''}`}
                onClick={() => setStatusFilter('new')}
              >
                New
              </button>
              <button 
                className={`filter-button ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </button>
              <button 
                className={`filter-button ${statusFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('resolved')}
              >
                Resolved
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="complaints-list">
              <h2>📋 Prioritized Complaints</h2>
              
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading complaints...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">📭</div>
                  <p>No complaints found matching your criteria</p>
                </div>
              ) : (
                filteredComplaints.map(complaint => (
                  <div 
                    key={complaint._id} 
                    className={`complaint-item ${selectedComplaint && selectedComplaint._id === complaint._id ? 'selected' : ''}`}
                    onClick={() => handleComplaintSelect(complaint)}
                  >
                    <div className="complaint-header">
                      <div 
                        className="complaint-category" 
                        style={{ backgroundColor: getCategoryColor(complaint.category) }}
                      >
                        {complaint.category}
                      </div>
                      <div 
                        className="complaint-status"
                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                      >
                        {complaint.status === 'new' ? 'New' : 
                         complaint.status === 'in_progress' ? 'In Progress' : 
                         'Resolved'}
                      </div>
                    </div>
                    <div className="complaint-preview">
                      <p>{complaint.complaint.substring(0, 100)}...</p>
                    </div>
                    <div className="complaint-meta">
                      <span className="priority-score">
                        ⭐ {complaint.priority_score || 5}
                      </span>
                      <span className="votes">
                        👍 {complaint.votes || 0}
                      </span>
                    </div>
                    {complaint.assigned_department && (
                      <div className="assigned-department">
                        🏢 {complaint.assigned_department}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'assign' && (
            <div className="assign-department-sidebar">
              <h2>🏢 Unassigned Complaints</h2>
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading complaints...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              ) : filteredComplaints.filter(c => !c.assigned_department).length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">✅</div>
                  <p>All complaints have been assigned to departments</p>
                </div>
              ) : (
                filteredComplaints.filter(c => !c.assigned_department).map(complaint => (
                  <div 
                    key={complaint._id} 
                    className="complaint-item"
                    onClick={() => handleComplaintSelect(complaint)}
                  >
                    <div className="complaint-header">
                      <div 
                        className="complaint-category" 
                        style={{ backgroundColor: getCategoryColor(complaint.category) }}
                      >
                        {complaint.category}
                      </div>
                    </div>
                    <div className="complaint-preview">
                      <p>{complaint.complaint.substring(0, 100)}...</p>
                    </div>
                    <button 
                      className="auto-assign-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        autoAssignDepartment(complaint._id, complaint.category);
                      }}
                    >
                      Auto-Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="dashboard-main">
          {selectedComplaint ? (
            <div className="complaint-detail">
              <div className="detail-header">
                <div className="header-info">
                  <h2>📄 Complaint Details</h2>
                  <p className="complaint-id">ID: {selectedComplaint._id}</p>
                </div>
                <div className="detail-actions">
                  <div className="action-group">
                    <label>Status:</label>
                    <select 
                      value={selectedComplaint.status || 'new'}
                      onChange={(e) => updateComplaintStatus(selectedComplaint._id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  
                  <div className="action-group">
                    <label>Department:</label>
                    <select 
                      value={selectedComplaint.assigned_department || ''}
                      onChange={(e) => assignToDepartment(selectedComplaint._id, e.target.value)}
                    >
                      <option value="">Assign Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="detail-content">
                <div className="detail-section">
                  <h3>🏷️ Category</h3>
                  <p className="category-badge" style={{ backgroundColor: getCategoryColor(selectedComplaint.category) }}>
                    {selectedComplaint.category}
                  </p>
                </div>
                
                <div className="detail-section">
                  <h3>📝 Description</h3>
                  <p className="complaint-description">{selectedComplaint.complaint}</p>
                </div>
                
                {selectedComplaint.has_photo && (
                  <div className="detail-section">
                    <h3>📸 Photo Evidence</h3>
                    <div className="detail-photo">
                      <img 
                        src={`${API_URL}/photos/${selectedComplaint.photo_path}`} 
                        alt="Complaint evidence" 
                        onClick={() => window.open(`${API_URL}/photos/${selectedComplaint.photo_path}`, '_blank')}
                      />
                    </div>
                  </div>
                )}
                
                {selectedComplaint.location && (
                  <div className="detail-section">
                    <h3>📍 Location</h3>
                    <p className="location-text">{selectedComplaint.location}</p>
                    <div className="map-placeholder">
                      <p>🗺️ Map view would be displayed here</p>
                      <button 
                        className="map-button"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedComplaint.location)}`, '_blank')}
                      >
                        View on Google Maps
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="detail-section">
                  <h3>📊 Metadata</h3>
                  <div className="metadata-grid">
                    <div className="metadata-item">
                      <span className="metadata-label">Submitted</span>
                      <span className="metadata-value">
                        {new Date(selectedComplaint.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Priority Score</span>
                      <span className="metadata-value">{selectedComplaint.priority_score || 5}/10</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Votes</span>
                      <span className="metadata-value">{selectedComplaint.votes || 0}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Prediction Source</span>
                      <span className="metadata-value">{selectedComplaint.prediction_source || 'AI Model'}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Assigned Department</span>
                      <span className="metadata-value">{selectedComplaint.assigned_department || 'Not assigned'}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Submitted By</span>
                      <span className="metadata-value">{selectedComplaint.submitted_by || 'Anonymous'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>💬 Public Comments ({selectedComplaint.comments?.length || 0})</h3>
                  {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                    <div className="comments-list">
                      {selectedComplaint.comments.map((comment, idx) => (
                        <div key={idx} className="comment">
                          <div className="comment-header">
                            <span className="comment-author">{comment.user || 'Anonymous'}</span>
                            <span className="comment-date">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-comments">No public comments yet.</p>
                  )}
                </div>
                
                <div className="detail-section">
                  <h3>📝 Admin Notes</h3>
                  <div className="notes-section">
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add administrative notes about this complaint..."
                      className="admin-notes"
                      rows={4}
                    ></textarea>
                    <button 
                      className="save-notes"
                      onClick={() => saveAdminNote(selectedComplaint._id, noteText)}
                    >
                      Save Note
                    </button>
                    
                    {/* Display existing admin notes */}
                    {selectedComplaint.admin_notes && selectedComplaint.admin_notes.length > 0 && (
                      <div className="admin-notes-history">
                        <h4>Previous Notes</h4>
                        {selectedComplaint.admin_notes.map((note, idx) => (
                          <div key={idx} className="admin-note-item">
                            <div className="admin-note-header">
                              <span className="admin-name">{note.admin || 'Administrator'}</span>
                              <span className="note-date">
                                {new Date(note.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="admin-note-text">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="analytics-dashboard">
              <h2>📈 Analytics Overview</h2>
              
              <div className="analytics-grid">
                <div className="analytics-card total-complaints">
                  <div className="card-icon">📋</div>
                  <h3>Total Complaints</h3>
                  <div className="analytics-value">{analytics.total}</div>
                </div>
                
                <div className="analytics-card pending-complaints">
                  <div className="card-icon">⏳</div>
                  <h3>Pending</h3>
                  <div className="analytics-value">{analytics.new + analytics.inProgress}</div>
                </div>
                
                <div className="analytics-card resolved-complaints">
                  <div className="card-icon">✅</div>
                  <h3>Resolved</h3>
                  <div className="analytics-value">{analytics.resolved}</div>
                </div>
                
                <div className="analytics-card departments">
                  <div className="card-icon">🏢</div>
                  <h3>Departments</h3>
                  <div className="analytics-value">{Object.keys(analytics.departmentCounts).length}</div>
                </div>
              </div>
              
              <div className="charts-container">
                {renderStatusChart()}
                {renderCategoryChart()}
                {renderDepartmentChart()}
              </div>
              
              <div className="recent-activity">
                <h3>🕒 Recent Activity</h3>
                <div className="activity-list">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <p>{activity.message}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;