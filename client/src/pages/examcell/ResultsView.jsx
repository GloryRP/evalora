import { useState, useEffect } from 'react';
import { Search, Eye, Filter, RefreshCw, BarChart2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

const ResultsView = () => {
  const { currentAcademicYear, currentSemester } = useAcademicYear();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [semester, setSemester] = useState(String(currentSemester));
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [department, setDepartment] = useState('');
  const [publishedStatus, setPublishedStatus] = useState('all'); // all, published, unpublished
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState([]);

  // Modal / Detail state
  const [activeResult, setActiveResult] = useState(null);

  // Update when context changes
  useEffect(() => {
    setAcademicYear(currentAcademicYear);
    setSemester(String(currentSemester));
  }, [currentAcademicYear, currentSemester]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [semester, academicYear, department, publishedStatus]);
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
      
      let query = `?semester=${semester}&academicYear=${academicYear}`;
      if (department) query += `&department=${department}`;
      if (publishedStatus !== 'all') {
        query += `&isPublished=${publishedStatus === 'published'}`;
      }

      const response = await api.get(`/results${query}`);
      if (response.data?.success) {
        setResults(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load computed results');
    } finally {
      setLoading(false);
    }
  };

  // Stats computation
  const totalStudents = results.length;
  const passCount = results.filter(r => r.overallResult === 'PASS').length;
  const failCount = totalStudents - passCount;
  const publishedCount = results.filter(r => r.isPublished).length;
  const pendingCount = totalStudents - publishedCount;
  const classAvg = totalStudents > 0 
    ? (results.reduce((sum, r) => sum + (r.sgpa || 0), 0) / totalStudents).toFixed(2)
    : '0.00';

  // Search filter
  const filteredResults = results.filter(r => 
    r.usn.toLowerCase().includes(search.toLowerCase()) ||
    (r.studentId?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
          Explore Student Results
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Search, filter, and inspect detailed marks cards and GPAs for computed terms.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL PROCESSED', val: totalStudents, bg: 'white', color: 'var(--color-navy)' },
          { label: 'PASSED', val: passCount, bg: '#E6F4EA', color: '#137333' },
          { label: 'FAILED', val: failCount, bg: '#FCE8E6', color: '#C5221F' },
          { label: 'AVG SGPA', val: classAvg, bg: '#FEF7E0', color: '#B06000' },
          { label: 'PUBLISHED', val: publishedCount, bg: '#E8F0FE', color: '#1A73E8' },
          { label: 'PENDING PUBLISH', val: pendingCount, bg: '#F1F3F4', color: '#5F6368' }
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, border: '1px solid #E5E5E5', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666' }}>{c.label}</span>
            <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: c.color }}>{c.val}</h4>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', border: '1px solid #E5E5E5', padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-navy)', fontWeight: '600', fontSize: '0.9rem' }}>
          <Filter size={16} /> Filters
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
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
            style={{ width: '100px', padding: '0.5rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
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

          <select
            value={publishedStatus}
            onChange={(e) => setPublishedStatus(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} color="#999" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search USN or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <button
          onClick={fetchResults}
          style={{ background: 'none', border: '1px solid #CCC', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Results Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><LoadingSkeleton count={4} /></div>
        ) : filteredResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#666' }}>
            <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No student results found matching the filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid #E5E5E5', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>USN</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Sem</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SGPA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>CGPA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Overall Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #E5E5E5' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>{r.usn}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-navy)' }}>{r.studentId?.name || 'Jane Smith'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#555' }}>{r.department}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{r.semester}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700' }}>
                      {r.isProvisional || r.overallResult === 'INCOMPLETE' ? (
                        <div>
                          <span>{r.sgpa !== undefined && r.sgpa !== null ? r.sgpa.toFixed(2) : '-'}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#d97706', fontWeight: 'bold' }}>Provisional</span>
                        </div>
                      ) : (
                        r.sgpa !== undefined && r.sgpa !== null ? r.sgpa.toFixed(2) : '-'
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--color-gold)' }}>
                      {r.isProvisional || r.overallResult === 'INCOMPLETE' ? (
                        <div>
                          <span>{r.cgpa !== undefined && r.cgpa !== null ? r.cgpa.toFixed(2) : '-'}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#d97706', fontWeight: 'bold' }}>Provisional</span>
                        </div>
                      ) : (
                        r.cgpa !== undefined && r.cgpa !== null ? r.cgpa.toFixed(2) : '-'
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Badge variant={r.overallResult === 'PASS' ? 'success' : (r.overallResult === 'INCOMPLETE' ? 'warning' : 'danger')}>
                        {r.overallResult === 'INCOMPLETE' ? 'Result incomplete' : r.overallResult}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Badge variant={r.isPublished ? 'success' : 'info'}>
                        {r.isPublished ? 'Published' : 'Computed'}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setActiveResult(r)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-navy)',
                          color: 'var(--color-navy)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        <Eye size={12} /> View Marks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            maxWidth: '750px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ background: 'var(--color-navy)', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                Detailed Marks Sheet - {activeResult.studentId?.name || 'Student'} ({activeResult.usn})
              </h3>
              <button
                onClick={() => setActiveResult(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#666' }}>Academic Year:</span> <strong>{activeResult.academicYear}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Semester:</span> <strong>{activeResult.semester}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>SGPA:</span> <strong style={{ color: 'var(--color-navy)', fontSize: '0.95rem' }}>{activeResult.sgpa.toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>CGPA:</span> <strong style={{ color: 'var(--color-gold)', fontSize: '0.95rem' }}>{activeResult.cgpa.toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F3F4', borderBottom: '2px solid #DDD', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem' }}>Subject Code</th>
                      <th style={{ padding: '0.6rem' }}>Subject Name</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Credits</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Marks</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Grade</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Grade Points</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResult.subjectResults.map((sub, idx) => {
                      const isInc = sub.isIncomplete || sub.result === 'INCOMPLETE' || sub.grade === 'Incomplete';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #EEE', background: isInc ? '#FFFBEB' : 'transparent' }}>
                          <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{sub.subjectCode}</td>
                          <td style={{ padding: '0.6rem', fontWeight: '600' }}>{sub.subjectName}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>{sub.credits}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            {isInc ? (
                              <span style={{ color: '#d97706', fontStyle: 'italic', fontWeight: '600' }}>Result incomplete</span>
                            ) : (
                              `${sub.marksObtained} / ${sub.maxMarks}`
                            )}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', color: isInc ? '#d97706' : 'var(--color-gold)' }}>
                            {isInc ? 'Incomplete' : sub.grade}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>{isInc ? '-' : sub.gradePoint}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <Badge variant={sub.result === 'PASS' ? 'success' : (isInc ? 'warning' : 'danger')}>
                              {isInc ? 'Result incomplete' : sub.result}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
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
                    fontWeight: '600',
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

export default ResultsView;
