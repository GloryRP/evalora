/**
 * Student Hall Ticket Page
 */
import { useState, useEffect } from 'react';
import { Calendar, User } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { useInstitution } from '../../contexts/InstitutionContext';

const HallTicket = () => {
  const institution = useInstitution();
  const [hallTicket, setHallTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHallTicket();
  }, []);

  const fetchHallTicket = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/hall-ticket');
      if (response.data?.success) {
        setHallTicket(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hall ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  if (!hallTicket) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No hall ticket found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Printable Hall Ticket */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', border: '2px solid var(--color-navy)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '3px solid var(--color-gold)', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--color-navy)', margin: '0 0 0.5rem 0' }}>
            {institution.institutionName}
          </h1>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--color-navy)', margin: '0' }}>
            Examination Hall Ticket
          </h2>
        </div>

        {/* Student Info */}
        <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #E5E5E5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>STUDENT NAME</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>{hallTicket.student.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>USN</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>{hallTicket.student.usn}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>DEPARTMENT</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>{hallTicket.student.department}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>SEMESTER</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>Semester {hallTicket.student.semester}</p>
            </div>
          </div>
        </div>

        {/* Exams Table */}
        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem' }}>SCHEDULED EXAMINATIONS</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-navy)', color: 'white' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Subject Code</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Subject Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Time</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Hall</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Seat No.</th>
            </tr>
          </thead>
          <tbody>
            {hallTicket.exams.map((exam, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #E5E5E5', background: idx % 2 === 0 ? 'white' : 'var(--color-bg)' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{exam.subjectCode}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{exam.subject}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{new Date(exam.date).toLocaleDateString('en-IN')}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{exam.time}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}>{exam.hall}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-gold)' }}>{exam.seatNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Important Notes */}
        <div style={{ background: '#FFF3CD', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #FFC107', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>⚠️ Important Instructions:</p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#856404' }}>
            <li>Arrive 30 minutes before the exam time</li>
            <li>Carry a valid ID card and this hall ticket</li>
            <li>Use only the specified seat number</li>
            <li>Contact exam cell for any discrepancies</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: '0.5rem 0' }}>
            This is an auto-generated hall ticket. For queries, contact the Exam Cell immediately.
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            Document Generated: {new Date().toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#E8F4F8', borderRadius: '6px', borderLeft: '4px solid var(--color-navy)', color: 'var(--color-navy)', fontSize: '0.9rem' }}>
        <p style={{ margin: '0.25rem 0' }}>
          ℹ️ This hall ticket has been sent to your registered email. Please keep a copy for your records.
        </p>
      </div>
    </div>
  );
};

export default HallTicket;
