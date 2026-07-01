/**
 * Hall Allocations Page
 * View student-hall-seat mappings
 */
import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const HallAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedExam !== 'all') {
      fetchAllocations(selectedExam);
    } else {
      fetchAllocations();
    }
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const examsRes = await api.get('/examcell/exams?status=scheduled');
      setExams(examsRes.data.data);
      await fetchAllocations();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async (examId = null) => {
    try {
      const params = examId ? { examId } : {};
      const response = await api.get('/examcell/hall-allocations', { params });
      setAllocations(response.data.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  // Group by exam and hall
  const groupedAllocations = allocations.reduce((acc, alloc) => {
    const examKey = alloc.examId._id;
    const hallKey = alloc.hallId._id;
    if (!acc[examKey]) acc[examKey] = { exam: alloc.examId, halls: {} };
    if (!acc[examKey].halls[hallKey]) acc[examKey].halls[hallKey] = { hall: alloc.hallId, students: [] };
    acc[examKey].halls[hallKey].students.push(alloc);
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
            Hall Allocations
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Student seating arrangements by exam and hall
          </p>
        </div>

        <select 
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          style={{ 
            padding: '0.75rem 1rem', 
            border: '1px solid #E5E5E5', 
            borderRadius: '6px', 
            fontSize: '0.95rem',
            background: 'white'
          }}
        >
          <option value="all">All Exams</option>
          {exams.map(exam => (
            <option key={exam._id} value={exam._id}>
              {exam.subjectId.subjectName} - {new Date(exam.examDate).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Allocations */}
      {Object.keys(groupedAllocations).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Users size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            No hall allocations found. Run the AI pipeline to generate allocations.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.values(groupedAllocations).map(({ exam, halls }) => (
            <div key={exam._id} style={{
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
                marginBottom: '0.5rem'
              }}>
                {exam.subjectId.subjectName}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {new Date(exam.examDate).toLocaleDateString()} • {exam.startTime} - {exam.endTime}
              </p>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {Object.values(halls).map(({ hall, students }) => (
                  <div key={hall._id} style={{
                    padding: '1rem',
                    background: 'var(--color-bg)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)' }}>
                        {hall.hallName}
                      </h3>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--color-text-secondary)',
                        background: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px'
                      }}>
                        {students.length} students
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '6px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Seat</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>USN</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Student Name</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students
                            .sort((a, b) => a.seatNumber - b.seatNumber)
                            .map((alloc, idx) => (
                              <tr key={alloc._id} style={{ 
                                borderBottom: '1px solid #F0F0F0',
                                background: idx % 2 === 0 ? 'white' : '#FAFAF8'
                              }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                                  {alloc.seatNumber}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                  {alloc.studentId.usn}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                  {alloc.studentId.name}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                  {alloc.studentId.department}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
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

export default HallAllocations;
