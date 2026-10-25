/**
 * Admin Dashboard - Premium Interface
 * Visual redesign: gradient stat cards, richer chart section, polished status cards.
 * All underlying functionality, stats endpoints, and navigation links preserved.
 */
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import {
  GraduationCap, Users, Building2, BookOpen,
  TrendingUp, ArrowRight, RefreshCw, Activity,
  Database, Cpu, Mail, CheckCircle2, Calendar,
  Sparkles, ShieldCheck, Layers, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// ── Premium Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, link, navigate, badgeText, accentColor, accentLight, iconGradient }) => (
  <div
    onClick={() => link && navigate(link)}
    style={{
      background: 'white',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      cursor: link ? 'pointer' : 'default',
      transition: 'transform 200ms ease, box-shadow 200ms ease',
      position: 'relative',
    }}
    onMouseEnter={e => { if (link) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
  >
    {/* Coloured top accent strip */}
    <div style={{ height: '4px', background: iconGradient }} />

    <div style={{ padding: '22px 24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94A3B8' }}>
              {label}
            </span>
            {badgeText && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 9px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 700, background: accentLight, color: accentColor, border: `1px solid ${accentColor}33` }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, animation: 'pulse 2s ease infinite' }} />
                {badgeText}
              </span>
            )}
          </div>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1E3A5F', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {value !== undefined && value !== null ? value.toLocaleString() : '—'}
          </p>
          {link && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: accentColor }}>
              <span>View details</span>
              <ChevronRight size={13} />
            </div>
          )}
        </div>

        {/* Icon badge */}
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: iconGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${accentColor}33` }}>
          <Icon size={24} strokeWidth={2} style={{ color: 'white' }} />
        </div>
      </div>
    </div>
  </div>
);

// ── Custom Bar Chart Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0F172A', color: 'white', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: '1px solid #1E293B', fontSize: '0.8125rem' }}>
        <p style={{ fontWeight: 700, color: '#CBD5E1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={13} style={{ color: '#60A5FA' }} /> {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60A5FA' }} />
          <span style={{ color: '#94A3B8', fontWeight: 500 }}>Students:</span>
          <span style={{ fontWeight: 800, color: '#93C5FD', fontSize: '1rem' }}>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────
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
      accentColor: '#2563EB',
      accentLight: '#EFF6FF',
      iconGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    },
    {
      icon: Users,
      label: 'Total Faculty',
      value: stats?.facultyCount,
      link: '/admin/faculty',
      badgeText: 'Active',
      accentColor: '#059669',
      accentLight: '#ECFDF5',
      iconGradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats?.departmentCount,
      link: '/admin/departments',
      badgeText: 'Configured',
      accentColor: '#7C3AED',
      accentLight: '#F5F3FF',
      iconGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    },
  ];

  const quickLinks = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', desc: 'Add, edit, bulk import student records', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', light: '#EFF6FF', color: '#1D4ED8' },
    { label: 'Manage Faculty', icon: Users, path: '/admin/faculty', desc: 'Manage faculty members and assignments', gradient: 'linear-gradient(135deg,#10B981,#047857)', light: '#ECFDF5', color: '#047857' },
    { label: 'Departments', icon: Building2, path: '/admin/departments', desc: 'Configure academic departments', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', light: '#F5F3FF', color: '#6D28D9' },
    { label: 'Subjects', icon: BookOpen, path: '/admin/subjects', desc: 'Set up course subjects and credits', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', light: '#FFFBEB', color: '#B45309' },
  ];

  const activities = [
    { title: 'System Database Initialized', desc: 'Seeded default departments & test credentials', time: 'Just now', icon: Database, gradient: 'linear-gradient(135deg,#10B981,#047857)', color: '#059669' },
    { title: 'AI Evaluation Microservice', desc: 'OCR & Automated grading model active on port 8000', time: 'Active', icon: Cpu, gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#2563EB' },
    { title: 'Exam Halls Configured', desc: 'Seeded Hall A (100) & Hall B (80) seating capacity', time: 'Ready', icon: Layers, gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: '#7C3AED' },
  ];

  const barColors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#1E3A5F'];

  const systemServices = [
    { label: 'Database Engine', sub: 'MongoDB • Connected', icon: Database, status: 'Connected', gradient: 'linear-gradient(135deg,#10B981,#047857)', bg: '#F0FDF4', border: '#BBF7D0', statusBg: '#DCFCE7', statusColor: '#065F46' },
    { label: 'AI Evaluation Service', sub: 'FastAPI • Port 8000', icon: Cpu, status: 'Running', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', bg: '#EFF6FF', border: '#BFDBFE', statusBg: '#DBEAFE', statusColor: '#1E40AF' },
    { label: 'Email Gateway', sub: 'SMTP • Configured', icon: Mail, status: 'Configured', gradient: 'linear-gradient(135deg,#6366F1,#4338CA)', bg: '#EEF2FF', border: '#C7D2FE', statusBg: '#E0E7FF', statusColor: '#3730A3' },
  ];

  return (
    <div style={{ width: '100%' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              <Sparkles size={11} /> Admin Portal
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', animation: 'ping 1.5s ease infinite' }} />
              System Operational
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1E3A5F', margin: '0 0 6px', letterSpacing: '-0.025em' }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span style={{ color: '#CBD5E1' }}>·</span>
            <span style={{ fontWeight: 600, color: '#475569' }}>Administrator</span>
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', color: '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: isFetching ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 150ms', opacity: isFetching ? 0.7 : 1 }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <RefreshCw size={15} style={{ color: isFetching ? '#3B82F6' : '#94A3B8', animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: '140px', borderRadius: '20px', background: '#F1F5F9', animation: 'pulse 2s ease infinite', border: '1px solid #E2E8F0' }} />
            ))
          : statCards.map(card => (
              <StatCard key={card.label} {...card} navigate={navigate} />
            ))}
      </div>

      {/* ── Chart + Quick Links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

        {/* Bar Chart Card */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '28px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E3A5F', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Students per Department</h2>
              <p style={{ fontSize: '0.78125rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>Current enrollment distribution</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              <TrendingUp size={18} style={{ color: 'white' }} />
            </div>
          </div>

          {isLoading ? (
            <div style={{ height: '240px', borderRadius: '12px', background: '#F1F5F9', animation: 'pulse 2s ease infinite' }} />
          ) : stats?.studentsByDepartment?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.studentsByDepartment} barSize={38} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  {barColors.map((c, i) => (
                    <linearGradient key={i} id={`bar${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,58,95,0.04)', radius: 8 }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stats.studentsByDepartment.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#bar${index % barColors.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
              <GraduationCap size={42} style={{ color: '#CBD5E1', marginBottom: '10px' }} />
              <p style={{ fontWeight: 700, color: '#64748B', margin: '0 0 4px' }}>No enrollment data yet</p>
              <p style={{ fontSize: '0.78125rem', color: '#94A3B8', margin: 0 }}>Student data will appear here once added</p>
            </div>
          )}
        </div>

        {/* Quick Access Card */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E3A5F', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Quick Access</h2>
              <p style={{ fontSize: '0.78125rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>Shortcuts to core portals</p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
              <Layers size={16} style={{ color: '#64748B' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickLinks.map(({ label, icon: Icon, path, desc, gradient, light, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'white', border: '1.5px solid #F1F5F9', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms', boxSizing: 'border-box' }}
                onMouseEnter={e => { e.currentTarget.style.background = light; e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${color}30` }}>
                  <Icon size={18} strokeWidth={2.2} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: '#CBD5E1', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity + System Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Activity */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#4338CA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(99,102,241,0.3)' }}>
                <Activity size={17} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E3A5F', margin: '0 0 2px', letterSpacing: '-0.01em' }}>Recent Activity</h2>
                <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>System event log</p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s ease infinite' }} />
              Live Feed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((act, idx) => {
              const ActIcon = act.icon;
              return (
                <div
                  key={idx}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9', transition: 'background 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: act.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${act.color}33` }}>
                    <ActIcon size={16} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</p>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8', flexShrink: 0 }}>{act.time}</span>
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#10B981,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(16,185,129,0.3)' }}>
                <ShieldCheck size={17} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E3A5F', margin: '0 0 2px', letterSpacing: '-0.01em' }}>System Status</h2>
                <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>Infrastructure health monitor</p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, background: '#DCFCE7', color: '#065F46', border: '1px solid #A7F3D0' }}>
              <CheckCircle2 size={11} />
              100% Operational
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {systemServices.map(({ label, sub, icon: SvcIcon, status, gradient, bg, border, statusBg, statusColor }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', background: bg, borderRadius: '14px', border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(0,0,0,0.12)' }}>
                    <SvcIcon size={17} style={{ color: 'white' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
                    <p style={{ fontSize: '0.6875rem', color: statusColor, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>
                  </div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, background: statusBg, color: statusColor, border: `1px solid ${border}`, flexShrink: 0 }}>
                  <CheckCircle2 size={11} />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
