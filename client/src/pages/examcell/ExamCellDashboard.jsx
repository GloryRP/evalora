/**
 * ExamCell Dashboard
 * Overview of exam automation system with stats and recent activity
 */
import { useState, useEffect } from 'react';
import { FileText, Building2, Users, Play, TrendingUp, Clock } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

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
    { label: 'Total Exams', value: stats?.totalExams || 0, icon: FileText, color: '#1E3A5F' },
    { label: 'Scheduled', value: stats?.scheduledExams || 0, icon: Clock, color: '#2D7A5F' },
    { label: 'Halls Available', value: stats?.totalHalls || 0, icon: Building2, color: '#C9A227' },
    { label: 'Agent Runs', value: stats?.totalRuns || 0, icon: Play, color: '#5C5C5C' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#2D7A5F';
      case 'running': return '#C9A227';
      case 'failed': return '#B3413E';
      default: return '#5C5C5C';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'var(--color-navy)',
          marginBottom: '0.5rem'
        }}>
          Exam Cell Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Manage exams, halls, and AI-powered automation
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #E5E5E5',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                background: `${stat.color}15`,
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={24} color={stat.color} />
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '700', 
                  color: 'var(--color-text)',
                  marginBottom: '0.25rem'
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Agent Runs */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E5E5'
      }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--color-navy)',
          marginBottom: '1rem'
        }}>
          Recent Agent Runs
        </h2>
        
        {recentRuns.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No agent runs yet. Start by running the AI pipeline.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triggered By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run, idx) => (
                  <tr key={run._id} style={{ 
                    borderBottom: '1px solid #F0F0F0',
                    background: idx % 2 === 0 ? 'transparent' : '#FAFAF8'
                  }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                      {run.agentType}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: `${getStatusColor(run.status)}20`,
                        color: getStatusColor(run.status)
                      }}>
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {run.triggeredBy}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(2)}s` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCellDashboard;
