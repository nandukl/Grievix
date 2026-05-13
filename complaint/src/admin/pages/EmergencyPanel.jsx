import React from 'react';

const EmergencyPanel = ({ complaints, loading, onViewDetails }) => {
    const emergencies = complaints.filter(c => c.is_emergency).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const getTimeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    if (loading) return <div className="loading-state">Monitoring emergency signals...</div>;

    return (
        <div className="admin-page-content animate-in">
            <div className="page-header">
                <h1 className="text-emergency">🚨 Emergency Control Center</h1>
                <p>Active critical situations requiring immediate response</p>
            </div>

            <div className="emergency-grid">
                {emergencies.length === 0 ? (
                    <div className="empty-state-large">
                        <div className="empty-icon">🛡️</div>
                        <h2>System Secure</h2>
                        <p>No active emergencies detected in the grid.</p>
                    </div>
                ) : (
                    emergencies.map(e => (
                        <div key={e._id} className="emergency-alert-card animate-pulse-border">
                            <div className="alert-header">
                                <span className="time-badge">{getTimeSince(e.timestamp)}</span>
                                <span className="priority-tag">CRITICAL</span>
                            </div>
                            <div className="alert-body">
                                <h3>{e.category}</h3>
                                <p className="complaint-text">{e.complaint}</p>
                                <div className="location-info">📍 {e.location || 'Location tracking active'}</div>
                            </div>
                            <div className="alert-footer">
                                <button className="emergency-btn-main" onClick={() => onViewDetails(e)}>Deploy Response / View Details</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmergencyPanel;
