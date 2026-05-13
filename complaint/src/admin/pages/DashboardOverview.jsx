import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const KPICard = ({ title, value, icon, color, trend }) => (
    <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
        </div>
        <div className="kpi-info">
            <h3>{value}</h3>
            <p>{title}</p>
            {trend && (
                <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% since last week
                </span>
            )}
        </div>
    </div>
);

const DashboardOverview = ({ analytics, loading }) => {
    if (loading) return <div className="loading-state">Loading Analytics...</div>;

    const total = analytics.total_complaints || 0;
    const resolvedPct = total > 0 ? ((analytics.resolved_count / total) * 100).toFixed(1) : 0;
    const pendingPct = total > 0 ? ((analytics.pending_count / total) * 100).toFixed(1) : 0;

    return (
        <div className="admin-page-content animate-in">
            <div className="page-header">
                <h1>Governance Overview</h1>
                <p>Real-time metrics and system health</p>
            </div>

            <div className="kpi-grid">
                <KPICard
                    title="Total Complaints"
                    value={total}
                    icon="📂"
                    color="#1a3a6d"
                />
                <KPICard
                    title="Emergencies"
                    value={analytics.emergency_count || 0}
                    icon="🚨"
                    color="#e53935"
                />
                <KPICard
                    title="Resolved Rate"
                    value={`${resolvedPct}%`}
                    icon="✅"
                    color="#10b981"
                />
                <KPICard
                    title="Pending Impact"
                    value={`${pendingPct}%`}
                    icon="⏳"
                    color="#f59e0b"
                />
            </div>

            <div className="overview-charts">
                <div className="data-card full-width">
                    <div className="card-header">
                        <h3>Submission Trend</h3>
                        <p>Last 30 days activity</p>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.complaints_over_time}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#1a3a6d"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#1a3a6d' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
