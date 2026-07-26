/**
 * Faculty My Duties Page
 */
import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';

const MyDuties = () => {
  const [duties, setDuties] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterByRole, setFilterByRole] = useState('all');

  useEffect(() => {
    fetchDuties();
  }, []);

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faculty/duties');
      if (response.data?.success) {
        setFaculty(response.data.data.faculty);
        setDuties(response.data.data.duties);
      }
    } catch (error) {
      console.error('Error fetching duties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDuties = filterByRole === 'all'
    ? duties
    : duties.filter((duty) => duty.role === filterByRole);

  const roles = ['all', ...new Set(duties.map((d) => d.role))];

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
          My Invigilation Duties
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Total Duties: {filteredDuties.length}
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Filter size={18} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Role:</span>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setFilterByRole(role)}
              style={{
                padding: '0.5rem 1rem',
                border: filterByRole === role ? '2px solid var(--color-gold)' : '1px solid #E5E5E5',
                background: filterByRole === role ? '#C9A22720' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: filterByRole === role ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                textTransform: 'capitalize',
              }}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Duties Table */}
      {filteredDuties.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Calendar size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            {filterByRole === 'all' ? 'No duties assigned' : `No ${filterByRole} duties`}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E5E5' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-navy)', color: 'white' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Day</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Subject</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Hall</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Building</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredDuties.map((duty, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E5E5', background: idx % 2 === 0 ? 'white' : 'var(--color-bg)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(duty.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{duty.day}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>{duty.subject}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{duty.time}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{duty.hall}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{duty.building}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <span style={{ padding: '0.35rem 0.75rem', background: '#2D7A5F20', color: '#2D7A5F', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize', display: 'inline-block' }}>
                      {duty.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#E8F4F8', borderRadius: '6px', borderLeft: '4px solid var(--color-navy)', color: 'var(--color-navy)', fontSize: '0.9rem' }}>
        <p style={{ margin: '0.25rem 0' }}>
          ℹ️ You have been notified via email for each duty assigned. Please report 30 minutes before exam time.
        </p>
      </div>
    </div>
  );
};

export default MyDuties;
