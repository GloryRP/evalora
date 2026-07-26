import { useState, useEffect } from 'react';
import { Award, BookOpen, GraduationCap, ChevronDown, ChevronUp, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [internalResults, setInternalResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSem, setExpandedSem] = useState({});
  const [activeTab, setActiveTab] = useState('external'); // 'external' (SEE Grade Sheets) or 'internal' (CIE Marks)

  useEffect(() => {
    fetchMyResults();
    fetchInternalResults();
  }, []);

  const fetchMyResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/results/my-results');
      if (response.data?.success) {
        const sortedResults = response.data.data || [];
        setResults(sortedResults);
        
        // Expand the latest semester by default
        if (sortedResults.length > 0) {
          const latestSemId = sortedResults[sortedResults.length - 1]._id;
          setExpandedSem({ [latestSemId]: true });
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load your examination results');
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalResults = async () => {
    try {
      const response = await api.get('/student/results');
      if (response.data?.success) {
        setInternalResults(response.data.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching internal results:', error);
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '';
    const index = filePath.indexOf('/uploads/');
    if (index !== -1) {
      return `http://localhost:5000${filePath.substring(index)}`;
    }
    const backslashIndex = filePath.indexOf('\\uploads\\');
    if (backslashIndex !== -1) {
      return `http://localhost:5000${filePath.substring(backslashIndex).replace(/\\/g, '/')}`;
    }
    return `http://localhost:5000/${filePath}`;
  };

  const toggleExpand = (id) => {
    setExpandedSem(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGradeBadgeStyle = (grade) => {
    const base = {
      padding: '0.25rem 0.6rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      textAlign: 'center',
      display: 'inline-block',
    };

    if (['O', 'A+', 'A'].includes(grade)) {
      return { ...base, background: '#E6F4EA', color: '#137333' };
    }
    if (['B+', 'B', 'C'].includes(grade)) {
      return { ...base, background: '#FEF7E0', color: '#B06000' };
    }
    if (grade === 'P') {
      return { ...base, background: '#E8F0FE', color: '#1A73E8' };
    }
    return { ...base, background: '#FCE8E6', color: '#C5221F' }; // F Grade
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  // Calculate latest CGPA (which is stored in the latest semester's document)
  const latestResult = results[results.length - 1];
  const finalCGPA = latestResult?.cgpa || 0.0;
  const numSemesters = results.length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            My Examination Records
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Access final term SGPA/CGPA cards and individual internal test scores.
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('external')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: activeTab === 'external' ? 'white' : 'transparent',
              color: activeTab === 'external' ? 'var(--color-navy)' : '#6B7280',
              boxShadow: activeTab === 'external' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Final SGPA/CGPA Grade Sheets
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: activeTab === 'internal' ? 'white' : 'transparent',
              color: activeTab === 'internal' ? 'var(--color-navy)' : '#6B7280',
              boxShadow: activeTab === 'internal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Internal Exam Marks (CIE)
          </button>
        </div>
      </div>

      {/* TAB 1: FINAL SEE GRADE CARDS */}
      {activeTab === 'external' && (
        <>
          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px' }}>
              <GraduationCap size={64} className="text-gray-300 mb-4" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                No Semester results computed yet
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '400px' }}>
                Your final semester grade cards (SGPA/CGPA) will appear here once computed and published by the Exam Cell at the end of the term.
              </p>
            </div>
          ) : (
            <>
              {/* Hero CGPA Card */}
              <div style={{
                background: 'white',
                border: '1px solid #E5E5E5',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative gold stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--color-gold)' }} />
                
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Cumulative GPA (CGPA)
                </span>
                <h2 style={{
                  fontSize: '3.5rem',
                  fontWeight: '800',
                  color: 'var(--color-navy)',
                  margin: '0.5rem 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  {finalCGPA.toFixed(2)}
                </h2>
                <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                  Computed across {numSemesters} {numSemesters === 1 ? 'semester' : 'semesters'}
                </span>
              </div>

              {/* SGPA Semester-wise Trend Chart */}
              <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} color="var(--color-gold)" /> Semester GPA Trend
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {results.map((r) => {
                    const barWidth = `${(r.sgpa / 10) * 100}%`;
                    return (
                      <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ width: '60px', fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Sem {r.semester}</span>
                        <div style={{ flex: 1, height: '18px', background: '#F1F3F4', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: barWidth,
                            height: '100%',
                            background: 'var(--color-navy)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease-out',
                          }} />
                        </div>
                        <span style={{ width: '70px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-navy)', textAlign: 'right' }}>
                          {r.sgpa.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collapsible Semester Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {results.map((result) => {
                  const isExpanded = !!expandedSem[result._id];
                  return (
                    <div
                      key={result._id}
                      style={{
                        background: 'white',
                        border: '1px solid #E5E5E5',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => toggleExpand(result._id)}
                        style={{
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: '#F9FAFB',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-navy)' }}>
                            Semester {result.semester}
                          </h3>
                          <span style={{ fontSize: '0.85rem', color: '#666' }}>
                            AY {result.academicYear}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                            SGPA: {result.sgpa.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <Badge variant={result.overallResult === 'PASS' ? 'success' : 'danger'}>
                            {result.overallResult}
                          </Badge>
                          {isExpanded ? <ChevronUp size={18} color="#666" /> : <ChevronDown size={18} color="#666" />}
                        </div>
                      </div>

                      {/* Card Body */}
                      {isExpanded && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #EEE' }}>
                          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#F1F3F4', borderBottom: '2px solid #DDD', textAlign: 'left' }}>
                                  <th style={{ padding: '0.6rem' }}>Subject Code</th>
                                  <th style={{ padding: '0.6rem' }}>Subject Name</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Credits</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Marks</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>%</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Grade</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Grade Points</th>
                                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.subjectResults.map((sub, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #EEE' }}>
                                    <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{sub.subjectCode}</td>
                                    <td style={{ padding: '0.6rem', fontWeight: '600' }}>{sub.subjectName}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.credits}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.marksObtained} / {sub.maxMarks}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.percentage}%</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                      <span style={getGradeBadgeStyle(sub.grade)}>{sub.grade}</span>
                                    </td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.gradePoint}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                      <Badge variant={sub.result === 'PASS' ? 'success' : 'danger'}>
                                        {sub.result}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--color-bg)',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--color-navy)'
                          }}>
                            <span>Total Credits Earned: {result.totalCredits}</span>
                            <span>Total Grade Points: {result.totalGradePoints}</span>
                            <span>SGPA: {result.sgpa.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF7E0', border: '1px solid #FFEBAA', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem', fontSize: '0.8rem', color: '#B06000' }}>
                            <AlertCircle size={16} />
                            <span>Contact the Exam Cell for re-evaluation requests within 7 days of result publication.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* TAB 2: INTERNAL CIE EXAM SCORES */}
      {activeTab === 'internal' && (
        <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--color-gold)" /> Released Internal CIE Test Marks
          </h2>

          {internalResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888', fontSize: '0.9rem' }}>
              No internal test scores released for your class yet. Once your subject teacher evaluates and publishes the booklet scores, they will appear here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#F1F3F4', borderBottom: '2px solid #DDD', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Subject</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Exam Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Scored Marks</th>
                    <th style={{ padding: '0.75rem' }}>Feedback Comments</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Digital Booklet</th>
                  </tr>
                </thead>
                <tbody>
                  {internalResults.map((script) => (
                    <tr key={script.resultId} style={{ borderBottom: '1px solid #EEE' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: '600', display: 'block', color: 'var(--color-navy)' }}>{script.subjectName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>{script.subjectCode}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <Badge variant={script.examDate ? 'secondary' : 'gold'}>
                          {script.examDate || 'Internal Test'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-navy)' }}>
                        {script.marksObtained} / {script.maxMarks || 50}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#555', fontStyle: script.comments ? 'normal' : 'italic' }}>
                        {script.comments || 'No remarks added.'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {script.filePath ? (
                          <a
                            href={getFileUrl(script.filePath)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: '600', textDecoration: 'none' }}
                          >
                            <ExternalLink size={13} /> View Scans
                          </a>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>No file uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default StudentResults;
