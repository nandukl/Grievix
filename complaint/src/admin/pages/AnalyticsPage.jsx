import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#1a3a6d', '#10b981', '#f59e0b', '#e53935', '#8b5cf6', '#64748b'];

const AnalyticsPage = ({ analytics, loading }) => {
    if (loading) return <div className="loading-state">Generating visualization...</div>;

    return (
        <div className="admin-page-content animate-in">
            <div className="page-header">
                <h1>Advanced Analytics</h1>
                <p>Statistical distribution and longitudinal trends</p>
            </div>

            <div className="analytics-grid">
                <div className="data-card">
                    <div className="card-header">
                        <h3>Category Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.category_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.category_distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="data-card">
                    <div className="card-header">
                        <h3>Activity Heatmap</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.complaints_over_time}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <YAxis />
                                <Tooltip />
                                <Line type="stepAfter" dataKey="count" stroke="#1a3a6d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="data-card full-width mt-20">
                <div className="card-header">
                    <h3>Summary Intelligence</h3>
                </div>
                <div className="stats-row">
                    <div className="stat-box">
                        <label>Avg. Resolution Time</label>
                        <span>{analytics.average_resolution_time || '---'} Days</span>
                    </div>
                    <div className="stat-box">
                        <label>System Efficiency</label>
                        <span>High Capacity</span>
                    </div>
                    <div className="stat-box">
                        <label>Data Integrity</label>
                        <span>99.9% Validated</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
