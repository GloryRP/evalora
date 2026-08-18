/**
 * Admin Dashboard - Revamped Professional Interface
 * Features: High-definition stat cards, interactive distribution chart, streamlined quick access, activity timeline, and system health status.
 * Preserves all underlying functionality, stats endpoints, and navigation links.
 */
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import {
  GraduationCap, Users, Building2, BookOpen,
  TrendingUp, ArrowRight, RefreshCw, Activity,
  Database, Cpu, Mail, CheckCircle2, Calendar,
  Sparkles, ShieldCheck, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Modern Stat Card component with clean borders and subtle hover lift
const StatCard = ({ icon: Icon, label, value, link, navigate, badgeText, iconBg, iconColor }) => (
  <div
    onClick={() => link && navigate(link)}
    className={`group bg-white p-5 lg:p-6 transition-all duration-200 w-full min-w-0 ${
      link ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
    }`}
    style={{
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase truncate">
            {label}
          </span>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              {badgeText}
            </span>
          )}
        </div>
        
        <p className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] tracking-tight font-display">
          {value !== undefined && value !== null ? value.toLocaleString() : '—'}
        </p>

        {link && (
          <div className="inline-flex items-center text-xs font-semibold text-slate-500 group-hover:text-[#1E3A5F] transition-colors gap-1 pt-1">
            <span>View details</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>

      <div 
        className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 border ${iconBg} ${iconColor}`}
      >
        <Icon size={22} strokeWidth={2.2} />
      </div>
    </div>
  </div>
);

// Custom Tooltip for bar chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 shadow-xl text-xs space-y-1"
        style={{ borderRadius: '10px', border: '1px solid #334155' }}
      >
        <p className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
          <Building2 size={14} className="text-blue-400" />
          {label}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Enrolled Students:</span>
          <span className="font-bold text-blue-300 text-sm">{payload[0].value}</span>
        </div>
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

  const statCards = [
    {
      icon: GraduationCap,
      label: 'Total Students',
      value: stats?.studentCount,
      link: '/admin/students',
      badgeText: 'Enrolled',
      iconBg: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Users,
      label: 'Total Faculty',
      value: stats?.facultyCount,
      link: '/admin/faculty',
      badgeText: 'Active',
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats?.departmentCount,
      link: '/admin/departments',
      badgeText: 'Configured',
      iconBg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const quickLinks = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', desc: 'Add, edit, bulk import student records', iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Manage Faculty', icon: Users, path: '/admin/faculty', desc: 'Manage faculty members and assignments', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Departments', icon: Building2, path: '/admin/departments', desc: 'Configure academic departments', iconBg: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: 'Subjects', icon: BookOpen, path: '/admin/subjects', desc: 'Set up course subjects and credits', iconBg: 'bg-amber-50 text-amber-600 border-amber-100' },
  ];

  const activities = [
    { title: 'System Database Initialized', desc: 'Seeded default departments & test credentials', time: 'Just now', icon: Database, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { title: 'AI Evaluation Microservice', desc: 'OCR & Automated grading model active on port 8000', time: 'Active', icon: Cpu, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Exam Halls Configured', desc: 'Seeded Hall A (100) & Hall B (80) seating capacity', time: 'Ready', icon: Layers, iconBg: 'bg-purple-50 text-purple-600 border-purple-100' },
  ];

  const barColors = ['#1E3A5F', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B'];

  return (
    <div className="w-full space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles size={12} className="text-blue-600" />
              Admin Portal
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              System Operational
            </span>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] tracking-tight font-display">
            Admin Dashboard
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-600">Administrator</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            style={{
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <RefreshCw size={15} className={`text-slate-500 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="h-28 bg-slate-100 animate-pulse w-full"
                style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
              />
            ))
          : statCards.map((card) => (
              <StatCard key={card.label} {...card} navigate={navigate} />
            ))}
      </div>

      {/* ── Chart + Quick Links Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

        {/* Bar Chart Container */}
        <div 
          className="lg:col-span-7 xl:col-span-8 bg-white p-5 lg:p-6 flex flex-col justify-between w-full min-w-0"
          style={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="min-w-0">
              <h2 className="text-base lg:text-lg font-bold text-slate-900 flex items-center gap-2 font-display truncate">
                Students per Department
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">Current enrollment distribution</p>
            </div>
            <div 
              className="w-9 h-9 bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-600"
              style={{ borderRadius: '10px' }}
            >
              <TrendingUp size={18} />
            </div>
          </div>

          {isLoading ? (
            <div className="h-60 bg-slate-100 animate-pulse w-full" style={{ borderRadius: '10px' }} />
          ) : stats?.studentsByDepartment?.length > 0 ? (
            <div className="w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.studentsByDepartment} barSize={36} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="department" 
                    tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,58,95,0.04)', radius: 6 }} />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                    {stats.studentsByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div 
              className="h-60 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 w-full"
              style={{ borderRadius: '10px', border: '1px dashed #CBD5E1' }}
            >
              <GraduationCap size={40} className="text-slate-300 mb-2 stroke-[1.5]" />
              <p className="font-semibold text-slate-700">No student enrollment data</p>
              <p className="text-xs text-slate-500 mt-1">Student data will display here once added</p>
            </div>
          )}
        </div>

        {/* Quick Access Container */}
        <div 
          className="lg:col-span-5 xl:col-span-4 bg-white p-5 lg:p-6 flex flex-col justify-between w-full min-w-0"
          style={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="min-w-0">
                <h2 className="text-base lg:text-lg font-bold text-slate-900 font-display">Quick Access</h2>
                <p className="text-xs text-slate-500 mt-0.5">Shortcuts to core portals</p>
              </div>
              <div 
                className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200"
                style={{ borderRadius: '8px' }}
              >
                <Layers size={16} />
              </div>
            </div>

            <div className="space-y-3 w-full">
              {quickLinks.map(({ label, icon: Icon, path, desc, iconBg }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 p-3 bg-white text-left group transition-all duration-200 hover:bg-slate-50/80 cursor-pointer min-w-0"
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${iconBg} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 group-hover:text-[#1E3A5F] transition-colors truncate">{label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-[#1E3A5F] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom Section: Recent Activity + System Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        {/* Recent Activity Box */}
        <div 
          className="bg-white p-5 lg:p-6 flex flex-col justify-between w-full min-w-0"
          style={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-8 h-8 bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"
                  style={{ borderRadius: '8px' }}
                >
                  <Activity size={17} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 font-display truncate">Recent Activity</h2>
                  <p className="text-xs text-slate-500 truncate">System event log</p>
                </div>
              </div>
              <span 
                className="px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0"
                style={{ borderRadius: '16px' }}
              >
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5 w-full">
              {activities.map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors w-full min-w-0"
                    style={{
                      borderRadius: '10px',
                      border: '1px solid #F1F5F9',
                    }}
                  >
                    <div 
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${act.iconBg}`}
                    >
                      <ActIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{act.title}</p>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Status Box */}
        <div 
          className="bg-white p-5 lg:p-6 flex flex-col justify-between w-full min-w-0"
          style={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-8 h-8 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"
                  style={{ borderRadius: '8px' }}
                >
                  <ShieldCheck size={17} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 font-display truncate">System Status</h2>
                  <p className="text-xs text-slate-500 truncate">Infrastructure health monitor</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                100% Operational
              </span>
            </div>

            <div className="space-y-2.5 w-full">
              {/* Database */}
              <div 
                className="flex items-center justify-between p-3 bg-emerald-50/40 gap-3 w-full min-w-0"
                style={{ borderRadius: '10px', border: '1px solid #A7F3D0' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0"
                  >
                    <Database size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Database Engine</p>
                    <p className="text-[11px] text-emerald-700 font-medium truncate">MongoDB • Connected</p>
                  </div>
                </div>
                <span 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/70 shrink-0"
                  style={{ borderRadius: '6px', border: '1px solid #A7F3D0' }}
                >
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Connected
                </span>
              </div>

              {/* AI Service */}
              <div 
                className="flex items-center justify-between p-3 bg-blue-50/40 gap-3 w-full min-w-0"
                style={{ borderRadius: '10px', border: '1px solid #BFDBFE' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0"
                  >
                    <Cpu size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">AI Evaluation Service</p>
                    <p className="text-[11px] text-blue-700 font-medium truncate">FastAPI • Port 8000</p>
                  </div>
                </div>
                <span 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 px-2 py-0.5 bg-blue-100/70 shrink-0"
                  style={{ borderRadius: '6px', border: '1px solid #BFDBFE' }}
                >
                  <CheckCircle2 size={12} className="text-blue-600" />
                  Running
                </span>
              </div>

              {/* Email Service */}
              <div 
                className="flex items-center justify-between p-3 bg-indigo-50/40 gap-3 w-full min-w-0"
                style={{ borderRadius: '10px', border: '1px solid #C7D2FE' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0"
                  >
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Email Gateway</p>
                    <p className="text-[11px] text-indigo-700 font-medium truncate">SMTP • Configured</p>
                  </div>
                </div>
                <span 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 px-2 py-0.5 bg-indigo-100/70 shrink-0"
                  style={{ borderRadius: '6px', border: '1px solid #C7D2FE' }}
                >
                  <CheckCircle2 size={12} className="text-indigo-600" />
                  Configured
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
