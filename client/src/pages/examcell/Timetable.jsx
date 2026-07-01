/**
 * Timetable Page
 * View scheduled exams in calendar format
 */
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const Timetable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ semester: 'all' });

  useEffect(() => {
    fetchTimetable();
  }, [filter]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const params = filter.semester !== 'all' ? { semester: filter.semester } : {};
      const response = await api.get('/examcell/timetable', { params });
      setExams(response.data.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group exams by date
  const groupedExams = exams.reduce((acc, exam) => {
    const date = new Date(exam.examDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(exam);
    return acc;
  }, {});

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--color-navy)',
            marginBottom: '0.5rem'
          }}>
            Exam Timetable
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Scheduled exams by date
          </p>
        </div>

        <select 
          value={filter.semester}
          onChange={(e) => setFilter({ semester: e.target.value })}
          style={{ 
            padding: '0.75rem 1rem', 
            border: '1px solid #E5E5E5', 
            borderRadius: '6px', 
            fontSize: '0.95rem',
            background: 'white'
          }}
        >
          <option value="all">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
      </div>

      {/* Timetable */}
      {Object.keys(groupedExams).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Calendar size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            No scheduled exams found. Run the AI pipeline to generate a timetable.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(groupedExams).sort().map(([date, dateExams]) => (
            <div key={date} style={{
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
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-gold)'
              }}>
                {date}
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {dateExams
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(exam => (
                    <div key={exam._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '1rem',
                      background: 'var(--color-bg)',
                      borderRadius: '6px',
                      borderLeft: '4px solid var(--color-gold)'
                    }}>
                      <div style={{ 
                        minWidth: '120px',
                        textAlign: 'center',
                        padding: '0.75rem',
                        background: 'white',
                        borderRadius: '6px'
                      }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                          {exam.startTime}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          to {exam.endTime}
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                          {exam.subjectId.subjectName}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                          <span>{exam.subjectId.subjectCode}</span>
                          <span>•</span>
                          <span>Semester {exam.semester}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize' }}>{exam.examType}</span>
                        </div>
                      </div>

                      <span style={{
                        padding: '0.5rem 1rem',
                        background: '#2D7A5F20',
                        color: '#2D7A5F',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {exam.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timetable;
