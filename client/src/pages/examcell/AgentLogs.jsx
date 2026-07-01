/**
 * Agent Logs Page
 * View AI agent execution history with detailed results
 */
import { useState, useEffect } from 'react';
import { FileText, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const AgentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examcell/agents/runs');
      setLogs(response.data.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#2D7A5F';
      case 'running': return '#C9A227';
      case 'failed': return '#B3413E';
      default: return '#5C5C5C';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#2D7A5F" />;
      case 'running': return <Clock size={20} color="#C9A227" />;
      case 'failed': return <XCircle size={20} color="#B3413E" />;
      default: return <Clock size={20} color="#5C5C5C" />;
    }
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton count={5} />
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
          Agent Execution Logs
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          History of AI agent runs with detailed results
        </p>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <FileText size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            No agent logs found. Run the AI pipeline to see execution history.
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E5E5'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Agent Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Triggered By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Started At</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Duration</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log._id} style={{ 
                    borderBottom: '1px solid #F0F0F0',
                    background: idx % 2 === 0 ? 'transparent' : '#FAFAF8'
                  }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: '500', textTransform: 'capitalize' }}>
                      {log.agentType}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(log.status)}
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: `${getStatusColor(log.status)}20`,
                          color: getStatusColor(log.status),
                          textTransform: 'capitalize'
                        }}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {log.triggeredBy}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {log.executionTimeMs ? `${(log.executionTimeMs / 1000).toFixed(2)}s` : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => viewDetails(log)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--color-navy)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 150ms'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--color-navy-light)'}
                        onMouseLeave={(e) => e.target.style.background = 'var(--color-navy)'}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                  Agent Run Details
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusIcon(selectedLog.status)}
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: `${getStatusColor(selectedLog.status)}20`,
                    color: getStatusColor(selectedLog.status),
                    textTransform: 'capitalize'
                  }}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--color-text-secondary)" />
              </button>
            </div>

            {/* Metadata */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Agent Type</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)', textTransform: 'capitalize' }}>{selectedLog.agentType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Triggered By</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)' }}>{selectedLog.triggeredBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Started At</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)' }}>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Duration</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)' }}>
                    {selectedLog.executionTimeMs ? `${(selectedLog.executionTimeMs / 1000).toFixed(2)}s` : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Input Data */}
            {selectedLog.inputData && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.75rem' }}>Input Data</h3>
                <pre style={{
                  padding: '1rem',
                  background: '#1E1E1E',
                  color: '#D4D4D4',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(selectedLog.inputData, null, 2)}
                </pre>
              </div>
            )}

            {/* Output Data */}
            {selectedLog.outputData && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.75rem' }}>Output Data</h3>
                <pre style={{
                  padding: '1rem',
                  background: '#1E1E1E',
                  color: '#D4D4D4',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(selectedLog.outputData, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Message */}
            {selectedLog.errorMessage && (
              <div style={{
                padding: '1rem',
                background: '#B3413E20',
                border: '1px solid #B3413E',
                borderRadius: '6px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#B3413E', marginBottom: '0.5rem' }}>Error</h3>
                <p style={{ color: '#B3413E', fontSize: '0.9rem', margin: 0 }}>{selectedLog.errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentLogs;
