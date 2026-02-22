import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Code2, Timer, Bookmark,
  BarChart3, User, LogOut, Menu, X, Zap, Bell, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/questions', icon: BookOpen, label: 'Questions' },
  { to: '/mocktest', icon: Timer, label: 'Mock Tests' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Interview Prep';

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Zap size={18} color="white" />
            </div>
            <div className="logo-text">
              Prep<span>Forge</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} className="nav-icon" />
              {label}
              {label === 'Mock Tests' && (
                <span className="nav-badge" style={{ background: 'var(--orange)', fontSize: '9px' }}>NEW</span>
              )}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: '16px' }}>Account</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <User size={17} />
            Profile
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 8px', marginBottom: '8px'
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button className="nav-item btn-full" onClick={handleLogout} style={{ color: 'var(--red)' }}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="menu-toggle"
            >
              <Menu size={20} />
            </button>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Syne, sans-serif' }}>{currentPage}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '5px 12px', fontSize: '12px',
              color: 'var(--yellow)'
            }}>
              <Zap size={12} fill="currentColor" />
              {user?.streak || 0} day streak
            </div>
            <button className="btn btn-ghost btn-icon">
              <Bell size={18} />
            </button>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: 'white',
              cursor: 'pointer'
            }} onClick={() => navigate('/profile')}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #menu-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}