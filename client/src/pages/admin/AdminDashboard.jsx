/**
 * Admin Dashboard - Revamped with live stats, charts, and premium design
 * Features: Removed subjects count card and exam scheduling information per request, adjusted stats layout to 3 columns
 */
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import {
  GraduationCap, Users, Building2, BookOpen,
  TrendingUp, ArrowRight, LayoutDashboard, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Greeting based on time
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Animated count display
const StatCard = ({ icon: Icon, label, value, color, gradient, link, navigate }) => (
  <div
    onClick={() => link && navigate(link)}
    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${link ? 'cursor-pointer' : ''}`}
    style={{ background: gradient }}
  >
    {/* Background decoration */}
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
    <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-10 bg-white" />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Icon size={24} className="text-white" />
        </div>
        {link && (
          <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
            <ArrowRight size={16} className="text-white" />
          </div>
        )}
      </div>
      <p className="text-white/70 text-sm font-medium mb-1">{label}</p>
      <p className="text-4xl font-bold text-white">
        {value !== undefined ? value.toLocaleString() : '—'}
      </p>
    </div>
  </div>
);

// Custom tooltip for bar chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E3A5F] text-white px-4 py-2.5 rounded-xl shadow-xl text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-200 mt-0.5">{payload[0].value} students</p>
      </div>
    );
  }
  return null;
};

const BAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: statsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
      return response.data.data;
    },
    staleTime: 30000,
  });

  const stats = statsData;

  // Stat cards showing Students, Faculty, and Departments (Subjects count removed per user request)
  const statCards = [
    {
      icon: GraduationCap,
      label: 'Total Students',
      value: stats?.studentCount,
      gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)',
      link: '/admin/students',
    },
    {
      icon: Users,
      label: 'Total Faculty',
      value: stats?.facultyCount,
      gradient: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
      link: '/admin/faculty',
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats?.departmentCount,
      gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
      link: '/admin/departments',
    },
  ];

  const quickLinks = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', desc: 'Add, edit, bulk import student records' },
    { label: 'Manage Faculty', icon: Users, path: '/admin/faculty', desc: 'Manage faculty members and assignments' },
    { label: 'Departments', icon: Building2, path: '/admin/departments', desc: 'Configure academic departments' },
    { label: 'Subjects', icon: BookOpen, path: '/admin/subjects', desc: 'Set up course subjects and credits' },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Hero Header ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #162D4A 50%, #0F1E30 100%)' }}
        >
          {/* Decorations */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #C9A227, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)', transform: 'translate(-20%, 30%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <LayoutDashboard size={18} className="text-[#C9A227]" />
                </div>
                <span className="text-blue-300 text-sm font-medium">Admin Dashboard</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
              </h1>
              <p className="text-blue-200 text-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white font-medium transition disabled:opacity-50"
              >
                <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                Refresh
              </button>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-xs text-blue-300">Username</p>
                  <p className="text-sm font-semibold">{user?.username}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-xs text-blue-300">Role</p>
                  <p className="text-sm font-semibold">Administrator</p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-xs text-blue-300">Access</p>
                  <p className="text-sm font-semibold text-[#C9A227]">Full</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── (Changed to 3 cols grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
              ))
            : statCards.map((card) => (
                <StatCard key={card.label} {...card} navigate={navigate} />
              ))}
        </div>

        {/* ── Chart + Quick Links ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Students per Department</h2>
                <p className="text-sm text-[#5C5C5C] mt-0.5">Current enrollment distribution</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp size={18} className="text-[#1E3A5F]" />
              </div>
            </div>

            {isLoading ? (
              <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
            ) : stats?.studentsByDepartment?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.studentsByDepartment} barSize={36} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#5C5C5C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5C5C5C' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,58,95,0.05)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.studentsByDepartment.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-[#5C5C5C]">
                <GraduationCap size={40} className="text-gray-300 mb-3" />
                <p className="font-medium">No student data yet</p>
                <p className="text-sm text-gray-400 mt-1">Add students to see the chart</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-5">Quick Access</h2>
            <div className="space-y-3">
              {quickLinks.map(({ label, icon: Icon, path, desc }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#1E3A5F]/30 hover:bg-blue-50/40 text-left group transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1E3A5F] transition">
                    <Icon size={18} className="text-[#1E3A5F] group-hover:text-white transition" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
                    <p className="text-xs text-[#5C5C5C] truncate">{desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-[#1E3A5F] transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
