/**
 * Student Timetable Page
 */
import { useState, useEffect } from 'react';
import { Calendar, Printer } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';

const StudentTimetable = () => {
  const [exams, setExams] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/timetable');
      if (response.data?.success) {
        setStudent(response.data.data.student);
        setExams(response.data.data.exams);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedExams = exams.reduce((acc, exam) => {
    const date = new Date(exam.examDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(exam);
    return acc;
  }, {});

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton rows={5} columns={3} /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
          My Exam Timetable
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {student?.department} • Semester {student?.semester}
        </p>
      </div>

      {/* Timetable */}
      {Object.keys(groupedExams).length === 0 ? (
        <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Calendar size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>No scheduled exams yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(groupedExams).sort().map(([date, dateExams]) => (
            <div key={date} style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E5E5' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--color-gold)' }}>
                {date}
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {dateExams
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map((exam) => (
                    <div key={exam._id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '6px', borderLeft: '4px solid var(--color-gold)' }}>
                      <div style={{ minWidth: '120px', textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '6px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                          {exam.startTime || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          to {exam.endTime || 'N/A'}
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                          {exam.subjectId?.subjectName || 'N/A'}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                          <span>{exam.subjectId?.subjectCode || 'N/A'}</span>
                          <span>•</span>
                          <span>Semester {exam.semester}</span>
                        </div>
                      </div>

                      <span style={{ padding: '0.5rem 1rem', background: '#2D7A5F20', color: '#2D7A5F', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize' }}>
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

export default StudentTimetable;
