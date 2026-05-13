import React, { useState } from 'react';

const ComplaintManagement = ({
    complaints,
    loading,
    onViewDetails,
    onUpdateStatus,
    onAssignDept,
    onAddNote
}) => {
    const [filters, setFilters] = useState({
        search: '',
        category: 'All',
        status: 'All',
        emergency: false,
        sortBy: 'newest'
    });

    if (loading) return <div className="loading-state">Syncing grievance repository...</div>;

    const filtered = complaints.filter(c => {
        const complaintText = c.complaint || '';
        const id = c._id || '';
        const matchesSearch = complaintText.toLowerCase().includes(filters.search.toLowerCase()) || id.includes(filters.search);
        const matchesCategory = filters.category === 'All' || c.category === filters.category;
        const matchesStatus = filters.status === 'All' || c.status === filters.status;
        const matchesEmergency = !filters.emergency || c.is_emergency;
        return matchesSearch && matchesCategory && matchesStatus && matchesEmergency;
    }).sort((a, b) => {
        if (filters.sortBy === 'emergency') return (b.is_emergency ? 1 : 0) - (a.is_emergency ? 1 : 0);
        if (filters.sortBy === 'priority') return b.priority_score - a.priority_score;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return (
        <div className="admin-page-content animate-in">
            <div className="page-header">
                <h1>Complaint Management</h1>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search ID or description..."
                        className="search-input"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                        <option value="All">All Categories</option>
                        <option value="Water Issues">Water</option>
                        <option value="Road Issues">Roads</option>
                        <option value="Garbage Issues">Garbage</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Drainage Issues">Drainage</option>
                    </select>
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="All">All Status</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
                        <option value="newest">Newest First</option>
                        <option value="emergency">Emergency First</option>
                        <option value="priority">High Priority</option>
                    </select>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={filters.emergency}
                            onChange={(e) => setFilters({ ...filters, emergency: e.target.checked })}
                        />
                        <span>Emergencies Only</span>
                    </label>
                </div>
            </div>

            <div className="data-card no-padding">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Dept</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="6" className="empty-row">No complaints found.</td></tr>
                        ) : (
                            filtered.map(c => (
                                <tr key={c._id} className={c.is_emergency ? 'emergency-row' : ''}>
                                    <td><span className={`status-badge status-${c.status}`}>{c.status}</span></td>
                                    <td>
                                        <div className="complaint-truncate">
                                            {c.is_emergency && <span className="pulse-icon">🚨</span>}
                                            {c.complaint}
                                        </div>
                                    </td>
                                    <td>{c.category}</td>
                                    <td><strong style={{ color: c.priority_score > 7 ? '#e53935' : '#444' }}>{c.priority_score?.toFixed(1)}</strong></td>
                                    <td>
                                        <select
                                            className="inline-select"
                                            value={c.assigned_department || ''}
                                            onChange={(e) => onAssignDept(c._id, e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            <option value="Water Dept">Water</option>
                                            <option value="Public Works">Public Works</option>
                                            <option value="Sanitation">Sanitation</option>
                                            <option value="Electrical">Electrical</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" title="View Details" onClick={() => onViewDetails(c)}>👁️</button>
                                            <button className="icon-btn" title="Quick Resolve" onClick={() => onUpdateStatus(c._id, 'resolved')}>✅</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintManagement;
