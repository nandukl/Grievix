import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const DepartmentPerformance = ({ performance, loading }) => {
    if (loading) return <div className="loading-state">Fetching department metrics...</div>;

    return (
        <div className="admin-page-content animate-in">
            <div className="page-header">
                <h1>Departmental Insights</h1>
                <p>Operational efficiency by municipal division</p>
            </div>

            <div className="data-card full-width">
                <div className="card-header">
                    <h3>Throughput Comparison</h3>
                </div>
                <div className="chart-container" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} interval={0} />
                            <YAxis />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="resolved_count" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                            <Bar dataKey="pending_count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="performance-list mt-20">
                <div className="kpi-grid">
                    {performance.map(dept => (
                        <div key={dept.department} className="mini-card">
                            <h4>{dept.department}</h4>
                            <div className="mini-stat">
                                <span>Success Rate: </span>
                                <strong style={{ color: '#10b981' }}>
                                    {((dept.resolved_count / (dept.resolved_count + dept.pending_count || 1)) * 100).toFixed(0)}%
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DepartmentPerformance;
