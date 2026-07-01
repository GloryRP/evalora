/**
 * AdminLayout Component
 * Dark navy sidebar with gold accents for active items
 */
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Badge from '../components/ui/Badge';

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
  ];

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <GraduationCap size={32} className="text-[#C9A227]" />
          <div>
            <h1 className="text-xl font-display font-bold text-white">Vidyā</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 mx-4 mt-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
        <p className="text-xs text-gray-400 truncate">{user?.username}</p>
        <Badge variant="gold" className="mt-2">
          {user?.role?.toUpperCase()}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 mt-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#C9A227]/10 text-[#C9A227] border-l-4 border-[#C9A227] font-medium'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-900/20 text-red-300 rounded-lg hover:bg-red-900/30 transition font-medium"
        >
          <LogOut size={20} />
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
          <GraduationCap size={24} className="text-[#C9A227]" />
          <span className="text-white font-display font-bold">Vidyā</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2 hover:bg-white/10 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-72 bg-[#1E3A5F] shadow-2xl flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#1E3A5F] shadow-2xl flex flex-col z-50">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
