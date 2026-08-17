/**
 * AdminLayout Component
 * Dark navy sidebar with gold accents for active items
 */
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  LogOut,
  Menu,
  X,
  Award,
  FileText,
  User,
} from 'lucide-react';
import { useState } from 'react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: GraduationCap },
    { path: '/admin/faculty', label: 'Faculty', icon: Users },
    { path: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { path: '/admin/departments', label: 'Departments', icon: Building2 },
    { path: '/admin/halls', label: 'Halls', icon: Building2 },
    { path: '/admin/exams', label: 'Exams', icon: FileText },
    { path: '/admin/grading-scheme', label: 'Grading Scheme', icon: Award },
    { path: '/admin/institution', label: 'Institution Settings', icon: Building2 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div style={{ padding: '24px 20px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 0, position: 'relative' }}>
        {/* Bell fixed top-right of sidebar */}
        <div style={{ position: 'absolute', top: '20px', right: '16px' }}>
          <NotificationBell />
        </div>

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingRight: '32px' }}>
          <GraduationCap size={18} style={{ color: 'white', flexShrink: 0 }} strokeWidth={2} />
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>Evalora</span>
        </div>

        {/* User info */}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '3px', lineHeight: 1.3 }}>{user?.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>{user?.username}</div>
          <span style={{ display: 'inline-block', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'var(--color-gold)', color: 'var(--color-navy)', borderRadius: '4px' }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} style={{ marginBottom: '4px' }}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
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
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                    cursor: 'pointer'
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
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1E3A5F] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-[#C9A227]" />
          <span className="text-white font-display font-bold text-lg">Evalora</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside style={{ 
        width: '260px',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'var(--color-navy)',
        overflowY: 'auto',
        overflowX: 'visible',
        zIndex: 100,
        boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
      }} className="hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={{ 
            width: '260px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            backgroundColor: 'var(--color-navy)',
            overflowY: 'auto',
            overflowX: 'visible',
            zIndex: 50
          }} className="lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main style={{ marginLeft: '260px', minHeight: 'calc(100vh - 0px)', backgroundColor: 'var(--color-bg)', padding: '36px 40px 24px 40px' }} className="flex-1 overflow-auto pt-16 lg:pt-0 lg:ml-[260px] ml-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
