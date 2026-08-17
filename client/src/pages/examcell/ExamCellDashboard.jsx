/**
 * ExamCell Dashboard — Revamped
 * Overview of exam automation system with stats, upcoming activities, and agent logs
 */
import { useState, useEffect } from 'react';
import { FileText, Play, Clock, Activity, Cpu, ArrowUpRight, ShieldCheck, MapPin, CalendarDays, Zap } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Link } from 'react-router-dom';

const ExamCellDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [examsRes, hallsRes, runsRes] = await Promise.all([
        api.get('/examcell/exams'),
        api.get('/examcell/halls'),
        api.get('/examcell/agents/runs'),
      ]);

      setStats({
        totalExams: examsRes.data.count,
        scheduledExams: examsRes.data.data.filter(e => e.status === 'scheduled').length,
        totalHalls: hallsRes.data.count,
        totalRuns: runsRes.data.count,
      });

      setRecentRuns(runsRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Exams', value: stats?.totalExams || 0, icon: FileText, link: '/examcell/exams' },
    { label: 'Scheduled', value: stats?.scheduledExams || 0, icon: Clock, link: '/examcell/timetable' },
    { label: 'Agent Runs', value: stats?.totalRuns || 0, icon: Play, link: '/examcell/agent-logs' },
  ];

  const getAgentLabelAndIcon = (type) => {
    switch (type) {
      case 'Invigilator': return { label: 'Invigilator Assignment', icon: <ShieldCheck size={14} /> };
      case 'Hall_allocation': return { label: 'Hall Allocation', icon: <MapPin size={14} /> };
      case 'Scheduling': return { label: 'Exam Scheduling', icon: <CalendarDays size={14} /> };
      case 'Orchestrator': return { label: 'Full Pipeline', icon: <Zap size={14} /> };
      default: return { label: type, icon: <Cpu size={14} /> };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#ECFDF5', color: '#065F46', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 };
      case 'failed': return { backgroundColor: '#FEF2F2', color: '#991B1B', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 };
      case 'running': return { backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 };
      default: return { backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
          Exam Cell Dashboard
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#5C5C5C', margin: 0 }}>
          Orchestrate automated exams, classroom seating arrangements, and invigilation pipelines.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} to={stat.link} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '20px 24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  border: '1px solid #F0F0F0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Left side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: '2.2rem',
                    fontWeight: 700,
                    color: 'var(--color-navy)',
                    lineHeight: 1,
                    fontFamily: 'var(--font-display)'
                  }}>
                    {stat.value}
                  </div>
                </div>

                {/* Right side icon */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-navy)'
                }}>
                  <Icon size={22} />
                </div>

                <ArrowUpRight style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  color: '#CCCCCC',
                  fontSize: '0.75rem'
                }} size={14} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Two-Column Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT: Recent Agent Runs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <Cpu size={18} style={{ color: 'var(--color-gold)' }} />
              Recent Agent Runs
            </h2>
            <Link to="/examcell/agent-logs" style={{
              fontSize: '0.8rem',
              color: 'var(--color-navy)',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              View All Logs
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#5C5C5C', fontSize: '0.875rem' }}>
              No agent execution records found. Start the AI solver to view progress.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F8F9FA', borderRadius: '6px' }}>
                  <tr>
                    {['Agent Type', 'Status', 'Triggered By', 'Date', 'Exec Time'].map((col) => (
                      <th key={col} style={{
                        padding: '10px 14px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        textAlign: 'left'
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, idx) => {
                    const isLast = idx === recentRuns.length - 1;
                    const { label, icon } = getAgentLabelAndIcon(run.agentType);
                    
                    return (
                      <tr key={run._id}>
                        <td style={{
                          padding: '12px 14px',
                          fontSize: '0.875rem',
                          borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--color-text)' }}>
                            <span style={{ color: '#9CA3AF' }}>{icon}</span>
                            {label}
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                          verticalAlign: 'middle'
                        }}>
                          <span style={getStatusBadgeStyle(run.status)}>
                            {run.status}
                          </span>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontSize: '0.875rem',
                          color: '#5C5C5C',
                          borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                          verticalAlign: 'middle'
                        }}>
                          {run.triggeredBy}
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ fontSize: '0.825rem', color: 'var(--color-text)', fontWeight: 500 }}>
                            {new Date(run.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                            {run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(2)}s` : 'In Progress'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Quick Operations */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-navy)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 20px 0'
          }}>
            <Activity size={18} style={{ color: 'var(--color-gold)' }} />
            Quick Operations
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              {
                title: 'Exams Scheduling',
                desc: 'Configure start date, duration, and generate the exam timetable.',
              },
              {
                title: 'Seating Allotments',
                desc: 'Generate anti-malpractice seating arrangements on physical benches.',
              },
              {
                title: 'Invigilator Duties',
                desc: 'Assign faculty supervisors to populated halls without scheduling clashes.',
              }
            ].map((op, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '14px 0',
                borderBottom: idx === 2 ? 'none' : '1px solid #F5F5F5'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-navy)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--color-navy)',
                    margin: '0 0 4px 0'
                  }}>
                    {op.title}
                  </h4>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {op.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/examcell/run-agents" style={{ textDecoration: 'none' }}>
            <button
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-navy-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-navy)'}
              style={{
                width: '100%',
                marginTop: '20px',
                backgroundColor: 'var(--color-navy)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background-color 150ms ease'
              }}
            >
              Launch AI Orchestrator
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamCellDashboard;
