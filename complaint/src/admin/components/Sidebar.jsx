import React from 'react';

const Sidebar = ({ activeView, setView, isCollapsed, toggleSidebar, onLogout }) => {
    const NavItem = ({ id, icon, label }) => (
        <div
            className={`nav-item ${activeView === id ? 'active' : ''}`}
            onClick={() => setView(id)}
        >
            <span className="nav-icon">{icon}</span>
            {!isCollapsed && <span className="nav-text">{label}</span>}
            {activeView === id && !isCollapsed && <div className="active-indicator"></div>}
        </div>
    );

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <div className="logo-icon">G</div>
                    {!isCollapsed && <span className="logo-text">GRIEVIX</span>}
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavItem id="overview" icon="📊" label="Overview" />
                <NavItem id="complaints" icon="📋" label="Complaints" />
                <NavItem id="emergency" icon="🚨" label="Emergency" />
                <NavItem id="analytics" icon="📈" label="Analytics" />
                <NavItem id="performance" icon="🏢" label="Departments" />
                <NavItem id="settings" icon="⚙️" label="Settings" />
            </nav>

            <div className="sidebar-footer">
                <div className="nav-item logout" onClick={onLogout}>
                    <span className="nav-icon">🚪</span>
                    {!isCollapsed && <span className="nav-text">Logout</span>}
                </div>
                <button className="collapse-toggle" onClick={toggleSidebar}>
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
