import { useState, useEffect } from 'react';
import { Send, Eye, CheckCircle2, AlertTriangle, FileText, CheckSquare, Square } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const PublishResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [semester, setSemester] = useState('5');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(null);

  // Modal / Detail state
  const [activeResult, setActiveResult] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [semester, academicYear, department]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/examcell/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      setPublishedCount(null);
      
      let query = `?semester=${semester}&academicYear=${academicYear}`;
      if (department) query += `&department=${department}`;

      const response = await api.get(`/results${query}`);
      if (response.data?.success) {
        setResults(response.data.data);
        // Reset selections
        setSelectedIds({});
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results for publishing');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const readyToPublish = results.filter(r => !r.isPublished);
  const alreadyPublished = results.filter(r => r.isPublished);
  const failedCount = results.filter(r => r.overallResult === 'FAIL').length;

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAll = () => {
    const allChecked = readyToPublish.every(r => selectedIds[r._id]);
    const nextSelect = {};
    if (!allChecked) {
      readyToPublish.forEach(r => {
        nextSelect[r._id] = true;
      });
    }
    setSelectedIds(nextSelect);
  };

  // Get failed subjects for a student
  const getFailedSubjects = (result) => {
    const failed = result.subjectResults
      .filter(s => s.grade === 'F' || !s.isPassed)
      .map(s => s.subjectCode);
    return failed.length > 0 ? failed.join(', ') : 'None';
  };

  // Publish All
  const handlePublishAll = async () => {
    if (readyToPublish.length === 0) {
      toast.error('No results are currently pending publication.');
      return;
    }

    if (!confirm(`Publish results for all ${readyToPublish.length} students in Semester ${semester}? Students will receive email and in-app grade cards instantly.`)) {
      return;
    }

    try {
      setPublishing(true);
      const payload = {
        semester: parseInt(semester),
        academicYear,
      };
      if (department) payload.department = department;

      const response = await api.post('/results/publish', payload);
      if (response.data?.success) {
        toast.success(`Successfully published results for ${response.data.count} students!`);
        setPublishedCount(response.data.count);
        fetchResults();
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  // Publish Selected
  const handlePublishSelected = async () => {
    const targetIds = Object.keys(selectedIds).filter(id => selectedIds[id]);
    if (targetIds.length === 0) {
      toast.error('Please select at least one student result to publish.');
      return;
    }

    if (!confirm(`Publish results for the ${targetIds.length} selected students?`)) {
      return;
    }

    try {
      setPublishing(true);
      let successCount = 0;

      for (const id of targetIds) {
        try {
          const res = await api.post(`/results/publish/${id}`);
          if (res.data?.success) {
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to publish single result ID ${id}:`, err);
        }
      }

      toast.success(`Successfully published results for ${successCount} selected students!`);
      setPublishedCount(successCount);
      fetchResults();
    } catch (error) {
      console.error(error);
      toast.error('Error publishing selected results');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', margin: '0 0 0.5rem 0' }}>
          Publish Results
        </h1>
        <div style={{ width: '80px', height: '4px', background: 'var(--color-gold)', borderRadius: '2px', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Review results before publishing to students. Once published, students are notified instantly.
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', border: '1px solid #E5E5E5', padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
        >
          {[1,2,3,4,5,6,7,8].map(s => (
            <option key={s} value={s.toString()}>Semester {s}</option>
          ))}
        </select>

        <input
          type="text"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          placeholder="Academic Year"
          style={{ width: '120px', padding: '0.5rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d._id} value={d.departmentName}>{d.departmentName}</option>
          ))}
        </select>

        <button
          onClick={fetchResults}
          style={{ background: 'none', border: '1px solid #CCC', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refilter
        </button>
      </div>

      {/* Success Banner */}
      {publishedCount !== null && (
        <div style={{ background: '#E6F4EA', color: '#137333', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> Results published for {publishedCount} students. Email and in-app notifications sent successfully.
        </div>
      )}

      {/* Summary Stats & Warning */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--color-navy)' }}>
            Publishing Audit Metrics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#555' }}>Students Ready to Publish:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{readyToPublish.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEE', paddingTop: '0.5rem' }}>
              <span style={{ color: '#555' }}>Students Already Published:</span>
              <strong style={{ color: '#2D7A5F' }}>{alreadyPublished.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEE', paddingTop: '0.5rem' }}>
              <span style={{ color: '#555' }}>Students with FAIL status:</span>
              <strong style={{ color: failedCount > 0 ? '#ef4444' : '#2D7A5F' }}>{failedCount}</strong>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        {failedCount > 0 && (
          <div style={{ background: '#FFF3CD', border: '1px solid #FFEBAA', color: '#856404', borderRadius: '10px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'start' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '700' }}>Review Warning</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                ⚠️ {failedCount} students have failed one or more subjects. Ensure marks entry audits and grade allocations are fully correct before releasing.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Results Preview Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: '#F8F9FA', borderBottom: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-navy)' }}>
            Results Publication Queue
          </h3>
          {readyToPublish.length > 0 && (
            <button
              onClick={handleToggleAll}
              style={{ background: 'none', border: '1px solid #CCC', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {readyToPublish.every(r => selectedIds[r._id]) ? 'Deselect All' : 'Select All Pending'}
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem' }}><LoadingSkeleton count={3} /></div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#666' }}>
            <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No results computed. Go to "Compute Results" first.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F1F3F4', borderBottom: '2px solid #E5E5E5', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '50px', textAlign: 'center' }}>Select</th>
                  <th style={{ padding: '0.75rem 1rem' }}>USN</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SGPA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>CGPA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subjects Failed</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isSelectable = !r.isPublished;
                  const isChecked = !!selectedIds[r._id];
                  const failedSubjects = getFailedSubjects(r);
                  
                  return (
                    <tr key={r._id} style={{ borderBottom: '1px solid #E5E5E5', background: r.isPublished ? '#FAFAFA' : 'white' }}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {isSelectable ? (
                          <button
                            onClick={() => handleToggleSelect(r._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {isChecked ? <CheckSquare size={18} color="var(--color-navy)" /> : <Square size={18} color="#999" />}
                          </button>
                        ) : (
                          <CheckCircle2 size={16} color="#2D7A5F" style={{ margin: '0 auto' }} />
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>{r.usn}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-navy)' }}>{r.studentId?.name || 'Jane Smith'}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700' }}>{r.sgpa.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--color-gold)' }}>{r.cgpa.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <Badge variant={r.overallResult === 'PASS' ? 'success' : 'danger'}>
                          {r.overallResult}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: failedSubjects !== 'None' ? '#ef4444' : '#666', fontWeight: failedSubjects !== 'None' ? '600' : '400' }}>
                        {failedSubjects}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setActiveResult(r)}
                          style={{
                            background: 'none',
                            border: '1px solid #CCC',
                            color: '#555',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Buttons bar */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          onClick={handlePublishSelected}
          disabled={publishing || Object.values(selectedIds).filter(Boolean).length === 0}
          style={{
            border: '2px solid var(--color-navy)',
            background: 'none',
            color: 'var(--color-navy)',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            fontWeight: '700',
            cursor: Object.values(selectedIds).filter(Boolean).length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem'
          }}
        >
          Publish Selected
        </button>

        <button
          onClick={handlePublishAll}
          disabled={publishing || readyToPublish.length === 0}
          style={{
            background: readyToPublish.length > 0 ? 'var(--color-navy)' : '#CCCCCC',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '6px',
            fontWeight: '700',
            cursor: readyToPublish.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <Send size={16} /> Publish All Results
        </button>
      </div>

      {/* Detail Modal */}
      {activeResult && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ background: 'var(--color-navy)', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                Subject Breakdown: {activeResult.studentId?.name || 'Student'}
              </h3>
              <button onClick={() => setActiveResult(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F3F4', borderBottom: '2px solid #DDD', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem' }}>Subject Code</th>
                      <th style={{ padding: '0.6rem' }}>Subject</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Credits</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Marks</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Grade</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Points</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResult.subjectResults.map((sub, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{sub.subjectCode}</td>
                        <td style={{ padding: '0.6rem', fontWeight: '600' }}>{sub.subjectName}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.credits}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.marksObtained} / {sub.maxMarks}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-gold)' }}>{sub.grade}</td>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setActiveResult(null)}
                  style={{
                    background: 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublishResults;
