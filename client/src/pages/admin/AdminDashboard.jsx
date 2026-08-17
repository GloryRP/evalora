/**
 * Admin Dashboard - Revamped with live stats, charts, and premium design
 * Features: Removed subjects count card and exam scheduling information per request, adjusted stats layout to 3 columns
 */
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import {
  GraduationCap, Users, Building2, BookOpen,
  TrendingUp, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Animated count display
const StatCard = ({ icon: Icon, label, value, link, navigate }) => (
  <div
    onClick={() => link && navigate(link)}
    style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: '16px', cursor: link ? 'pointer' : 'default' }}
    className={link ? 'hover:-translate-y-0.5 hover:shadow-md transition-all' : ''}
  >
    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color="var(--color-navy)" />
    </div>
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-navy)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
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
      link: '/admin/students',
    },
    {
      icon: Users,
      label: 'Total Faculty',
      value: stats?.facultyCount,
      link: '/admin/faculty',
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats?.departmentCount,
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
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Administrator
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E5E5', backgroundColor: 'white', color: 'var(--color-navy)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            className="hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
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
                  <Bar dataKey="count" fill="var(--color-navy)" radius={[6, 6, 0, 0]} activeBar={{ fill: '#2A4A70' }} />
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
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6" style={{ alignSelf: 'stretch' }}>
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

        {/* ── Bottom Section: Recent Activity + System Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-5">Recent Activity</h2>
            <div className="space-y-3">
              <div className="text-center py-8 text-[#5C5C5C]">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm">System is ready</p>
                <p className="text-xs text-gray-400 mt-1">Activity logs will appear here</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-5">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Database</p>
                  <p className="text-xs text-emerald-600">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">AI Service</p>
                  <p className="text-xs text-emerald-600">Running</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Email Service</p>
                  <p className="text-xs text-emerald-600">Configured</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
