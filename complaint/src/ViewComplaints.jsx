import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewComplaints.css';

function ViewComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [priorityComplaints, setPriorityComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommentId, setExpandedCommentId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [filterByUser, setFilterByUser] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalComplaints: 0,
    categoryCounts: {},
    resolvedCount: 0,
    pendingCount: 0
  });
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000';
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      // Get categories first
      const categoriesRes = await axios.get(`${API_URL}/get_categories`);
      setCategories(categoriesRes.data);
      
      // Fetch high priority complaints separately (excluding resolved complaints)
      const priorityResponse = await axios.get(`${API_URL}/get_complaints`, {
        params: {
          sort: 'highest_priority',
          per_page: 5,
          page: 1,
          status: 'new,in_progress' // Exclude resolved complaints
        },
        timeout: 10000
      });
      
      if (priorityResponse.data && priorityResponse.data.complaints) {
        // Check if user has voted on each priority complaint
        const priorityComplaintsWithVoteStatus = priorityResponse.data.complaints.map(complaint => ({
          ...complaint,
          userVoted: userEmail && complaint.voters && complaint.voters.includes(userEmail)
        }));
        setPriorityComplaints(priorityComplaintsWithVoteStatus);
      }

      // Fetch analytics data
      try {
        const analyticsResponse = await axios.get(`${API_URL}/get_analytics`, { timeout: 5000 });
        if (analyticsResponse.data) {
          setAnalytics({
            totalComplaints: analyticsResponse.data.total_complaints || 0,
            categoryCounts: analyticsResponse.data.category_counts || {},
            resolvedCount: analyticsResponse.data.resolved_count || 0,
            pendingCount: analyticsResponse.data.pending_count || 0
          });
        }
      } catch (analyticsErr) {
        console.error('Error fetching analytics:', analyticsErr);
        // Continue with complaint loading even if analytics fails
      }
      
      // Then get regular complaints
      const complaintsRes = await axios.get(`${API_URL}/get_complaints`, {
        params: {
          category: selectedCategory,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          sort: sortBy,
          search: searchQuery || undefined,
          per_page: ITEMS_PER_PAGE,
          submitted_by: filterByUser ? userEmail : undefined
        },
        timeout: 10000
      });
      
      if (complaintsRes.data && complaintsRes.data.complaints) {
        // Check if user has voted on each complaint
        const complaintsWithVoteStatus = complaintsRes.data.complaints.map(complaint => ({
          ...complaint,
          userVoted: userEmail && complaint.voters && complaint.voters.includes(userEmail)
        }));
        
        setComplaints(complaintsWithVoteStatus);
        setTotalPages(Math.ceil(complaintsRes.data.total / ITEMS_PER_PAGE));
        setCurrentPage(page);
      } else {
        setComplaints([]);
        setTotalPages(1);
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

  // Add a function to refresh analytics
  const refreshAnalytics = async () => {
    try {
      const analyticsResponse = await axios.get(`${API_URL}/get_analytics`, { timeout: 5000 });
      if (analyticsResponse.data) {
        setAnalytics({
          totalComplaints: analyticsResponse.data.total_complaints || 0,
          categoryCounts: analyticsResponse.data.category_counts || {},
          resolvedCount: analyticsResponse.data.resolved_count || 0,
          pendingCount: analyticsResponse.data.pending_count || 0
        });
      }
    } catch (analyticsErr) {
      console.error('Error fetching analytics:', analyticsErr);
    }
  };

  // Refresh analytics when complaints change
  useEffect(() => {
    if (showAnalytics) {
      refreshAnalytics();
    }
  }, [complaints, showAnalytics]);

  // Also refresh analytics when a complaint status changes
  useEffect(() => {
    if (showAnalytics) {
      refreshAnalytics();
    }
  }, [priorityComplaints, showAnalytics]);

  useEffect(() => {
    fetchComplaints(1);
  }, [selectedCategory, statusFilter, sortBy, searchQuery, filterByUser, userEmail]);

  const handleVote = async (complaintId, voteType) => {
    // Find the complaint to check its status
    const complaint = [...complaints, ...priorityComplaints].find(c => c._id === complaintId);
    
    // Prevent voting on resolved complaints
    if (complaint && complaint.status === 'resolved') {
      alert('Cannot vote on resolved complaints.');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/vote_complaint`, {
        complaintId,
        voteType, // 'upvote' or 'downvote'
        userEmail // Pass the user's email to track their vote
      });
      
      // Update the local state to reflect the vote
      setComplaints(complaints.map(complaint => {
        if (complaint._id === complaintId) {
          return {
            ...complaint,
            votes: voteType === 'upvote' 
              ? complaint.votes + 1 
              : complaint.votes - 1,
            userVoted: true
          };
        }
        return complaint;
      }));
      
      // Also update priority complaints if this complaint is in that list
      setPriorityComplaints(priorityComplaints.map(complaint => {
        if (complaint._id === complaintId) {
          return {
            ...complaint,
            votes: voteType === 'upvote' 
              ? complaint.votes + 1 
              : complaint.votes - 1,
            userVoted: true
          };
        }
        return complaint;
      }));
      
      // Refresh analytics if they are being shown
      if (showAnalytics) {
        refreshAnalytics();
      }
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      }
    }
  };

  const handleAddComment = async (complaintId) => {
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/add_comment`, {
        complaintId,
        comment: newComment
      });
      
      // Update the local state with the new comment
      setComplaints(complaints.map(complaint => {
        if (complaint._id === complaintId) {
          return {
            ...complaint,
            comments: [...(complaint.comments || []), {
              text: newComment,
              timestamp: new Date().toISOString(),
              user: userEmail || 'Anonymous User'
            }]
          };
        }
        return complaint;
      }));
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (complaintId) => {
    setExpandedCommentId(expandedCommentId === complaintId ? null : complaintId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'var(--success-color)';
      case 'in_progress': return 'var(--warning-color)';
      case 'new': 
      default: return 'var(--info-color)';
    }
  };

  const getSeverityColor = (priorityScore) => {
    if (priorityScore >= 8) return '#ff4444'; // High severity - red
    if (priorityScore >= 6) return '#ffaa00'; // Medium severity - orange
    if (priorityScore >= 4) return '#00aa00'; // Low severity - green
    return '#4444ff'; // Very low severity - blue
  };

  const shareComplaint = (complaint) => {
    if (navigator.share) {
      navigator.share({
        title: `Complaint: ${complaint.category}`,
        text: complaint.complaint.substring(0, 100) + '...',
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${complaint.category}: ${complaint.complaint.substring(0, 100)}...`);
      alert('Complaint details copied to clipboard!');
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const closeComplaintView = () => {
    setSelectedComplaint(null);
  };

  const filteredComplaints = selectedCategory === 'All' 
    ? complaints 
    : complaints.filter(c => c.category === selectedCategory);

  return (
    <div className="view-page">
      <header className="view-header">
        <div className="header-content">
          <h1>Public Complaints Dashboard</h1>
          <p className="header-subtitle">View and engage with community complaints</p>
        </div>
        <button className="back-button" onClick={() => navigate('/mainpage')}>
          ← Back to Home
        </button>
      </header>

      <div className="dashboard-controls">
        <div className="analytics-toggle">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`toggle-button ${showAnalytics ? "active" : ""}`}
          >
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
        </div>
        
        <div className="user-filter">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={filterByUser}
              onChange={(e) => setFilterByUser(e.target.checked)}
            />
            <span className="checkmark"></span>
            Show My Complaints Only
          </label>
        </div>
      </div>
      
      {showAnalytics && (
        <div className="analytics-section">
          <h2>Complaints Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="card-icon">📊</div>
              <h3>Total Complaints</h3>
              <p className="analytics-number">{analytics.totalComplaints}</p>
            </div>
            <div className="analytics-card">
              <div className="card-icon">✅</div>
              <h3>Resolved</h3>
              <p className="analytics-number">{analytics.resolvedCount}</p>
            </div>
            <div className="analytics-card">
              <div className="card-icon">⏳</div>
              <h3>Pending</h3>
              <p className="analytics-number">{analytics.pendingCount}</p>
            </div>
          </div>
          <div className="category-distribution">
            <h3>Category Distribution</h3>
            <div className="category-bars">
              {Object.entries(analytics.categoryCounts).map(([category, count]) => (
                <div key={category} className="category-bar-container">
                  <div className="category-name">{category}</div>
                  <div className="category-bar-wrapper">
                    <div 
                      className="category-bar" 
                      style={{width: `${(count / analytics.totalComplaints) * 100}%`}}
                    ></div>
                  </div>
                  <div className="category-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {priorityComplaints.length > 0 && (
        <div className="priority-complaints-section">
          <h2>High Priority Complaints</h2>
          <div className="priority-complaints-list">
            {priorityComplaints.map((complaint) => (
              <div key={complaint._id} className="priority-complaint-card">
                <div className="priority-header">
                  <div className="priority-badge">🔥 High Priority</div>
                  <div className="priority-score">Score: {complaint.priority_score}/10</div>
                </div>
                <h3>{complaint.category}</h3>
                <p>{complaint.complaint}</p>
                <div className="priority-complaint-footer">
                  <span className="status-badge" style={{
                    backgroundColor: getStatusColor(complaint.status)
                  }}>
                    {complaint.status === 'new' ? 'New' : 
                     complaint.status === 'in_progress' ? 'In Progress' : 
                     'Resolved'}
                  </span>
                  <div className="priority-actions">
                    <button 
                      onClick={() => handleVote(complaint._id, 'upvote')}
                      className={`vote-button ${complaint.userVoted ? 'voted' : ''}`}
                      disabled={complaint.userVoted}
                    >
                      👍 <span>{complaint.votes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button">
            🔍
          </button>
        </div>

        <div className="filter-options">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_votes">Most Votes</option>
              <option value="highest_priority">Highest Priority</option>
            </select>
          </div>
        </div>
        
        {selectedComplaint && (
          <div className="view-complaint-section">
            <button className="view-complaint-button" onClick={closeComplaintView}>
              ← Back to Complaints
            </button>
          </div>
        )}
      </div>

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
          <h3>No complaints found</h3>
          <p>Be the first to submit a complaint in this category</p>
          <button className="primary-button" onClick={() => navigate('/submit')}>Submit a New Complaint</button>
        </div>
      ) : (
        <>
          <div className="complaints-list">
            {filteredComplaints.map((complaint) => (
              <div key={complaint._id} className="complaint-card" onClick={() => setSelectedComplaint(complaint)}>
                <div className="complaint-header">
                  <div className="complaint-category" style={{
                    backgroundColor: complaint.category === 'Water Issues' ? '#2196F3' :
                                    complaint.category === 'Road Issues' ? '#F44336' :
                                    complaint.category === 'Garbage Issues' ? '#4CAF50' :
                                    complaint.category === 'Electricity' ? '#FF9800' :
                                    complaint.category === 'Drainage Issues' ? '#9C27B0' : '#607D8B'
                  }}>
                    {complaint.category}
                  </div>
                  <div className="complaint-status" style={{
                    backgroundColor: getStatusColor(complaint.status)
                  }}>
                    {complaint.status === 'new' ? 'New' : 
                     complaint.status === 'in_progress' ? 'In Progress' : 
                     'Resolved'}
                  </div>
                </div>
                
                <div className="complaint-summary">
                  <h3>{complaint.complaint.substring(0, 60)}...</h3>
                  <p>{complaint.complaint.substring(0, 120)}...</p>
                  <div className="summary-meta">
                    <span className="complaint-date">
                      {new Date(complaint.timestamp).toLocaleDateString()}
                    </span>
                    <span className="complaint-submitter">
                      by {complaint.submitted_by}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => fetchComplaints(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                className="pagination-button"
                onClick={() => fetchComplaints(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          
          {selectedComplaint && (
            <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedComplaint(null)}>×</button>
                <div className="modal-header">
                  <div className="complaint-category" style={{
                    backgroundColor: selectedComplaint.category === 'Water Issues' ? '#2196F3' :
                                    selectedComplaint.category === 'Road Issues' ? '#F44336' :
                                    selectedComplaint.category === 'Garbage Issues' ? '#4CAF50' :
                                    selectedComplaint.category === 'Electricity' ? '#FF9800' :
                                    selectedComplaint.category === 'Drainage Issues' ? '#9C27B0' : '#607D8B'
                  }}>
                    {selectedComplaint.category}
                  </div>
                  <div className="complaint-status" style={{
                    backgroundColor: getStatusColor(selectedComplaint.status)
                  }}>
                    {selectedComplaint.status === 'new' ? 'New' : 
                     selectedComplaint.status === 'in_progress' ? 'In Progress' : 
                     'Resolved'}
                  </div>
                </div>
                
                <div className="modal-body">
                  <h2>{selectedComplaint.complaint}</h2>
                  
                  {selectedComplaint.has_photo && (
                    <div className="complaint-image">
                      <img 
                        src={`${API_URL}/photos/${selectedComplaint.photo_path}`} 
                        alt="Complaint evidence" 
                        onClick={() => window.open(`${API_URL}/photos/${selectedComplaint.photo_path}`, '_blank')}
                      />
                    </div>
                  )}
                  
                  {selectedComplaint.location && (
                    <div className="complaint-location">
                      <span className="location-icon">📍</span> {selectedComplaint.location}
                      <button 
                        className="map-button"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedComplaint.location)}`, '_blank')}
                      >
                        View on Map
                      </button>
                    </div>
                  )}
                  
                  {/* Voting section */}
                  <div className="voting-section">
                    <h3>Vote for this complaint</h3>
                    <div className="vote-buttons">
                      <button 
                        onClick={() => handleVote(selectedComplaint._id, 'upvote')}
                        className={`vote-button ${selectedComplaint.userVoted ? 'voted' : ''}`}
                        disabled={selectedComplaint.userVoted}
                      >
                        👍 Upvote <span>({selectedComplaint.votes || 0})</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments section */}
                  <div className="comments-section">
                    <h3>Comments ({selectedComplaint.comments?.length || 0})</h3>
                    
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
                      <p className="no-comments">No comments yet. Be the first to comment!</p>
                    )}
                    
                    {/* Display admin notes if they exist */}
                    {selectedComplaint.admin_notes && selectedComplaint.admin_notes.length > 0 && (
                      <div className="admin-notes-section">
                        <h4>Official Updates</h4>
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
                    
                    <div className="add-comment">
                      <textarea
                        placeholder="Add your comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      ></textarea>
                      <button className="primary-button" onClick={() => handleAddComment(selectedComplaint._id)}>
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ViewComplaints;