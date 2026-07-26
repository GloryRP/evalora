/**
 * Faculty Layout
 * Sidebar navigation for faculty users
 */
import { useState } from 'react';
import { Menu, LogOut, BookOpen, Calendar, ClipboardList, FileText } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

const FacultyLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: BookOpen },
    { label: 'My Duties', path: '/faculty/duties', icon: Calendar },
    { label: 'My Scripts', path: '/faculty/evaluations', icon: ClipboardList },
    { label: 'Question Papers', path: '/faculty/question-papers', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '260px',
          background: 'var(--color-navy)',
          color: 'white',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          overflowY: 'auto',
          overflowX: 'visible',
          zIndex: 100,
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
        }}
      >
        {/* Logo/Header */}
        <div style={{ padding: '24px 20px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 0, position: 'relative' }}>
          {/* Bell fixed top-right of sidebar */}
          <div style={{ position: 'absolute', top: '20px', right: '16px' }}>
            <NotificationBell />
          </div>

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingRight: '32px' }}>
            <BookOpen size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} strokeWidth={2} />
            <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>Evalora</span>
          </div>

          {/* User info */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '3px', lineHeight: 1.3 }}>Faculty Portal</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Welcome</div>
            <span style={{ display: 'inline-block', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'var(--color-gold)', color: 'var(--color-navy)', borderRadius: '4px' }}>
              FACULTY
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isActive ? '10px 9px 10px 9px' : '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-gold)' : '3px solid transparent',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              width: '100%',
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '260px', flex: 1, minHeight: 'auto', overflowY: 'auto' }}>
        {/* Page Content */}
        <div style={{ padding: '36px 40px 24px 40px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default FacultyLayout;
