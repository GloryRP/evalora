/**
 * Invigilator Assignments Page — Group by Date, then Exam
 * Single table header per exam group, shows actual subject names.
 */
import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Calendar, Clock, Landmark, Printer, Loader, Play } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const InvigilatorAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('5');
  const [runningAgent, setRunningAgent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const examsRes = await api.get(`/examcell/exams?semester=${selectedSemester}&status=scheduled`);
      const semesterExams = examsRes.data.data;
      setExams(semesterExams);

      const response = await api.get('/examcell/invigilator-assignments');
      const filteredAssignments = response.data.data.filter(assign =>
        assign.examId && semesterExams.some(e => e._id === (assign.examId._id || assign.examId))
      );
      setAssignments(filteredAssignments);
    } catch (error) {
      console.error('Error fetching invigilation duties:', error);
      toast.error('Failed to load invigilator schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvigilatorAssignment = async () => {
    if (exams.length === 0) {
      toast.error('No scheduled exams found for this semester to assign invigilators!');
      return;
    }
    try {
      setRunningAgent(true);
      const examIds = exams.map(e => e._id);
      const response = await api.post('/examcell/invigilator-assignments/generate', {
        examIds,
        constraints: {}
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invigilator duties');
    } finally {
      setRunningAgent(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group assignments by date, then by exam
  const groupedByDate = useMemo(() => {
    const dateMap = {};

    assignments.forEach(assignment => {
      if (!assignment.examId) return;
      const exam = assignment.examId;
      const examId = exam._id?.toString() || exam?.toString();
      if (!examId) return;

      // Get the date string from exam
      const rawDate = exam.examDate;
      const dateKey = rawDate ? new Date(rawDate).toISOString().split('T')[0] : 'unknown';

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { dateKey, exams: {} };
      }

      if (!dateMap[dateKey].exams[examId]) {
        dateMap[dateKey].exams[examId] = { exam, assignments: [] };
      }

      dateMap[dateKey].exams[examId].assignments.push(assignment);
    });

    // Sort by date
    return Object.values(dateMap).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [assignments]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'unknown') return 'Unknown Date';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
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
      <div className="print:hidden" style={{ marginBottom: '20px' }}>
        {/* ROW 1: Title + Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
            Invigilator Assignments
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}
            >
              <Printer size={14} /> Print Duties
            </button>
            <button
              onClick={handleRunInvigilatorAssignment}
              disabled={runningAgent || exams.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: 'var(--color-gold)', color: 'var(--color-navy)', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700, cursor: runningAgent || exams.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease', opacity: runningAgent || exams.length === 0 ? 0.6 : 1 }}
              onMouseEnter={(e) => { if (!runningAgent && exams.length > 0) e.currentTarget.style.backgroundColor = '#B8911F'; }}
              onMouseLeave={(e) => { if (!runningAgent && exams.length > 0) e.currentTarget.style.backgroundColor = 'var(--color-gold)'; }}
            >
              {runningAgent ? <Loader style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Play size={16} />}
              Generate Invigilator Duties
            </button>
          </div>
        </div>

        {/* ROW 2: Description */}
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
          Faculty invigilation duties and hall supervisors.
        </p>

        {/* ROW 3: Semester Filter */}
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={{ width: '180px', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px', transition: 'border-color 200ms ease' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
      </div>

      {/* Print Header */}
      <div className="hidden print:block" style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid var(--color-navy)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase' }}>
          PES Institute of Technology &amp; Management
        </h2>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5C5C5C', letterSpacing: '0.05em' }}>
          NH-206, SAGAR ROAD, SHIVAMOGGA - 577204
        </p>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>
          Invigilation Duty Allocation Sheet
        </h3>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginTop: '4px' }}>
          Semester {selectedSemester} Exams
        </p>
      </div>

      {/* Main Content */}
      {groupedByDate.length === 0 ? (
        <div className="print:hidden" style={{
          backgroundColor: 'white', borderRadius: '12px',
          padding: '64px 24px', textAlign: 'center',
          border: '1px solid #F0F0F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <ClipboardList size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            No duties assigned
          </h3>
          <p style={{ color: '#5C5C5C', fontSize: '0.875rem', marginBottom: '24px' }}>
            Make sure seating allocations are generated, then run the invigilator agent separately.
          </p>
          <Button onClick={handleRunInvigilatorAssignment} variant="gold">
            <Play size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Generate Invigilator Duties
          </Button>
        </div>
      ) : (
        <div>
          {groupedByDate.map((dateGroup, dateIdx) => {
            const examGroups = Object.values(dateGroup.exams);

            return (
              <div key={dateGroup.dateKey}>
                {/* Date Section Header */}
                <div style={{
                  backgroundColor: 'var(--color-navy)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  marginTop: dateIdx === 0 ? '0' : '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}>
                  <Calendar size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                  {formatDate(dateGroup.dateKey)}
                </div>

                {/* Exam Sub-groups */}
                {examGroups.map(({ exam, assignments: examAssignments }) => {
                  const subjectName = exam.subjectId?.subjectName || 'Unknown Subject';
                  const subjectCode = exam.subjectId?.subjectCode || '';

                  return (
                    <div key={exam._id} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #EEEEEE',
                      marginBottom: '16px',
                      overflow: 'hidden',
                    }}>
                      {/* Exam Sub-group Header */}
                      <div style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #F5F5F5',
                        backgroundColor: '#FAFAFA',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: 'var(--color-navy)',
                        }}>
                          {subjectName}
                        </span>

                        {subjectCode && (
                          <span style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#EEF2FF',
                            color: '#1E40AF',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}>
                            {subjectCode}
                          </span>
                        )}

                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <Clock size={13} />
                          {exam.startTime} – {exam.endTime}
                        </span>

                        {exam.examType && (
                          <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'capitalize',
                          }}>
                            {exam.examType}
                          </span>
                        )}
                      </div>

                      {/* Single table per exam group */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8F9FA' }}>
                              {['Hall', 'Invigilator', 'Employee ID', 'Department', 'Role', 'Duty Slot'].map(col => (
                                <th key={col} style={{
                                  padding: '10px 16px',
                                  textAlign: 'left',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  color: 'var(--color-text-secondary)',
                                  border: 'none',
                                  borderBottom: '1px solid #EEEEEE',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {examAssignments
                              .sort((a, b) => (a.hallId?.hallName || '').localeCompare(b.hallId?.hallName || ''))
                              .map((assignment, rowIdx) => {
                                const isLast = rowIdx === examAssignments.length - 1;
                                const facultyName = assignment.facultyId?.name || '—';
                                const initials = facultyName !== '—' ? facultyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

                                return (
                                  <tr key={assignment._id} style={{ borderBottom: isLast ? 'none' : '1px solid #F8F8F8' }}>
                                    {/* Hall */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-navy)', fontWeight: 500 }}>
                                        <Landmark size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                                        {assignment.hallId?.hallName || '—'}
                                      </div>
                                    </td>

                                    {/* Invigilator */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                          width: '28px', height: '28px',
                                          borderRadius: '50%',
                                          backgroundColor: 'var(--color-navy)',
                                          color: 'white',
                                          fontSize: '0.72rem', fontWeight: 700,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          flexShrink: 0,
                                        }}>
                                          {initials}
                                        </div>
                                        <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{facultyName}</span>
                                      </div>
                                    </td>

                                    {/* Employee ID */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontFamily: 'monospace', color: '#5B21B6' }}>
                                      {assignment.facultyId?.employeeId || '—'}
                                    </td>

                                    {/* Department */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                      {assignment.facultyId?.department || '—'}
                                    </td>

                                    {/* Role */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                                      <span style={{
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: '#EFF6FF',
                                        color: '#1E40AF',
                                        textTransform: 'capitalize',
                                      }}>
                                        {assignment.role}
                                      </span>
                                    </td>

                                    {/* Duty Slot */}
                                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={12} style={{ color: '#9CA3AF' }} />
                                        {assignment.startTime || '—'} – {assignment.endTime || '—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvigilatorAssignments;
