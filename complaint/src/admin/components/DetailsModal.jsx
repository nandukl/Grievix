import React, { useState } from 'react';

const DetailsModal = ({ complaint, onClose, onUpdateStatus, API_URL }) => {
    const [note, setNote] = useState(complaint.admin_note || '');

    if (!complaint) return null;

    return (
        <div className="priority-alert-overlay" onClick={onClose}>
            <div className="modern-popup large-popup" onClick={e => e.stopPropagation()}>
                <div className="alert-header">
                    <div className="header-label">
                        <h2>Grievance Details</h2>
                        <span className="case-id">#{complaint._id}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="modal-grid">
                        <div className="modal-left">
                            <section className="modal-section">
                                <label>Description</label>
                                <div className="content-box">
                                    {complaint.complaint}
                                </div>
                            </section>

                            <section className="modal-section">
                                <label>Evidence</label>
                                {complaint.has_photo ? (
                                    <div className="evidence-well">
                                        <img
                                            src={`${API_URL}/uploads/${complaint.photo_path}`}
                                            alt="Grievance Evidence"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Evidence+Available'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="no-evidence">No visual evidence provided.</div>
                                )}
                            </section>
                        </div>

                        <div className="modal-right">
                            <section className="modal-section">
                                <label>Administrative Note</label>
                                <textarea
                                    className="admin-textarea"
                                    placeholder="Add internal observations..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                ></textarea>
                                <button className="save-note-btn" onClick={() => onUpdateStatus(complaint._id, complaint.status, note)}>
                                    Update observations
                                </button>
                            </section>

                            <section className="modal-section meta-list">
                                <div className="meta-row">
                                    <span>Location:</span>
                                    <strong>{complaint.location || 'Not provided'}</strong>
                                </div>
                                <div className="meta-row">
                                    <span>Priority:</span>
                                    <strong className={`priority-${Math.floor(complaint.priority_score)}`}>{complaint.priority_score?.toFixed(1)}</strong>
                                </div>
                                <div className="meta-row">
                                    <span>Sentiment:</span>
                                    <strong>{(complaint.sentiment_score * 100).toFixed(0)}% Impact</strong>
                                </div>
                                <div className="meta-row">
                                    <span>Submission:</span>
                                    <strong>{new Date(complaint.timestamp).toLocaleString()}</strong>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="quick-actions">
                        <button className="action-btn-green" onClick={() => onUpdateStatus(complaint._id, 'resolved', note)}>Resolution Complete</button>
                        <button className="action-btn-blue" onClick={() => onUpdateStatus(complaint._id, 'in_progress', note)}>Mark In-Progress</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
