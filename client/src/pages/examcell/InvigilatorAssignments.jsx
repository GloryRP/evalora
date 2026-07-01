/**
 * Invigilator Assignments Page
 * View faculty invigilation duties
 */
import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const InvigilatorAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedExam !== 'all') {
      fetchAssignments(selectedExam);
    } else {
      fetchAssignments();
    }
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const examsRes = await api.get('/examcell/exams?status=scheduled');
      setExams(examsRes.data.data);
      await fetchAssignments();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (examId = null) => {
    try {
      const params = examId ? { examId } : {};
      const response = await api.get('/examcell/invigilator-assignments', { params });
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Group by exam
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const examKey = assignment.examId._id;
    if (!acc[examKey]) acc[examKey] = { exam: assignment.examId, assignments: [] };
    acc[examKey].assignments.push(assignment);
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
            Invigilator Assignments
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Faculty invigilation duties by exam
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

      {/* Assignments */}
      {Object.keys(groupedAssignments).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <ClipboardList size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            No invigilator assignments found. Run the AI pipeline to generate assignments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.values(groupedAssignments).map(({ exam, assignments: examAssignments }) => (
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

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Hall</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Faculty</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Employee ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Department</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Role</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examAssignments
                      .sort((a, b) => a.hallId.hallName.localeCompare(b.hallId.hallName))
                      .map((assignment, idx) => (
                        <tr key={assignment._id} style={{ 
                          borderBottom: '1px solid #F0F0F0',
                          background: idx % 2 === 0 ? 'transparent' : '#FAFAF8'
                        }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                            {assignment.hallId.hallName}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                            {assignment.facultyId.name}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {assignment.facultyId.employeeId}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {assignment.facultyId.department}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              background: assignment.role === 'chief' ? '#C9A22720' : '#1E3A5F20',
                              color: assignment.role === 'chief' ? '#C9A227' : '#1E3A5F',
                              textTransform: 'capitalize'
                            }}>
                              {assignment.role}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {assignment.startTime} - {assignment.endTime}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvigilatorAssignments;
