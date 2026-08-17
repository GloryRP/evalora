import { useState, useEffect } from 'react';
import { Play, ClipboardCheck, CheckCircle2, XCircle, BarChart3, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

const ComputeResults = () => {
  const { currentAcademicYear, currentSemester } = useAcademicYear();
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [semester, setSemester] = useState(String(currentSemester));
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Data for checklist
  const [exams, setExams] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Agent execution state
  const [computing, setComputing] = useState(false);
  const [summary, setSummary] = useState(null);

  // Update academic year when context changes
  useEffect(() => {
    setAcademicYear(currentAcademicYear);
    setSemester(String(currentSemester));
  }, [currentAcademicYear, currentSemester]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchChecklistData();
  }, [semester, department]);
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/examcell/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchChecklistData = async () => {
    try {
      setLoadingChecklist(true);
      const [examsRes, scriptsRes] = await Promise.all([
        api.get('/examcell/exams'),
        api.get('/examcell/answer-scripts/review')
      ]);

      if (examsRes.data?.success) setExams(examsRes.data.data);
      if (scriptsRes.data?.success) setScripts(scriptsRes.data.data);
    } catch (err) {
      console.error('Error fetching checklist data:', err);
      toast.error('Failed to load validation checklist data');
    } finally {
      setLoadingChecklist(false);
    }
  };

  // Checklist Calculations
  const semNum = parseInt(semester);
  const semExams = exams.filter(e => e.semester === semNum && (!department || e.subjectId?.department === department));
  const semScripts = scripts.filter(s => s.examId?.semester === semNum && (!department || s.studentId?.department === department));
  
  const totalScripts = semScripts.length;
  const evaluatedScripts = semScripts.filter(s => ['evaluated', 'published'].includes(s.status)).length;
  const allEvaluated = totalScripts > 0 && evaluatedScripts === totalScripts;
  const examsScheduled = semExams.length > 0;

  const handleCompute = async () => {
    if (!allEvaluated) {
      toast.error('Cannot compute results. Some answer scripts are still pending evaluation.');
      return;
    }

    try {
      setComputing(true);
      setSummary(null);
      
      const payload = {
        semester: semNum,
        academicYear,
      };
      if (department) payload.department = department;

      const response = await api.post('/results/compute', payload);
      
      if (response.data?.success) {
        toast.success(response.data.message || 'Results computed successfully!');
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Computation error:', error);
      toast.error(error.response?.data?.message || 'GPA Agent execution failed');
    } finally {
      setComputing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
          Compute Term Results
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Verify grading prerequisites, compile student marks, and run the GPA calculation agent.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Form Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={18} color="var(--color-gold)" /> Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.25rem' }}>ACADEMIC YEAR</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.25rem' }}>SEMESTER</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s.toString()}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.25rem' }}>DEPARTMENT (OPTIONAL FILTER)</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  <option value="">-- All Departments --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.departmentName}>{d.departmentName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleCompute}
            disabled={!allEvaluated || computing}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: allEvaluated ? 'var(--color-navy)' : '#CCCCCC',
              color: 'white',
              fontWeight: '700',
              cursor: allEvaluated ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'background 0.2s',
            }}
          >
            <Play size={18} />
            {computing ? 'Running GPA Agent...' : 'Compute Results'}
          </button>

          {computing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', color: 'var(--color-gold)', fontWeight: '600' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--color-gold)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }} />
              <span>GPA Agent analyzing marks...</span>
            </div>
          )}

        </div>

        {/* Right Column: Pre-computation Checklist & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Checklist Card */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardCheck size={18} color="var(--color-gold)" /> Pre-Computation Checklist
            </h3>

            {loadingChecklist ? (
              <LoadingSkeleton count={3} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* 1. Exams Scheduled */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.9rem', color: '#444' }}>Exams Scheduled for Semester {semester}</span>
                  {examsScheduled ? (
                    <span style={{ color: '#2D7A5F', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Yes ({semExams.length} Exams)
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <XCircle size={16} /> No Exams Found
                    </span>
                  )}
                </div>

                {/* 2. Scripts Uploaded */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid #EEE' }}>
                  <span style={{ fontSize: '0.9rem', color: '#444' }}>Scanned Script Booklets Registered</span>
                  {totalScripts > 0 ? (
                    <span style={{ color: '#2D7A5F', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Yes ({totalScripts} scripts)
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <XCircle size={16} /> 0 Scripts Registered
                    </span>
                  )}
                </div>

                {/* 3. Valuation Completed */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid #EEE' }}>
                  <span style={{ fontSize: '0.9rem', color: '#444' }}>Digital Evaluation Completed</span>
                  {allEvaluated ? (
                    <span style={{ color: '#2D7A5F', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Complete ({evaluatedScripts}/{totalScripts} graded)
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                      <AlertCircle size={16} /> {totalScripts - evaluatedScripts} of {totalScripts} booklets pending evaluation
                    </span>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Results Summary Card */}
          {summary && (
            <div style={{ background: '#FFFDF9', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--color-gold)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="var(--color-gold)" /> Results Summary
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E5E5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>STUDENTS PROCESSED</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)' }}>{summary.totalStudents}</h4>
                </div>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E5E5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>PASS / FAIL RATE</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: '700', color: '#2D7A5F' }}>
                    {summary.passCount} Pass / {summary.failCount} Fail
                  </h4>
                </div>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E5E5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>CLASS AVG SGPA</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)' }}>{summary.classAvgSGPA}</h4>
                </div>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E5E5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>HIGHEST / LOWEST</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-gold)' }}>
                    {summary.highestSGPA} / {summary.lowestSGPA}
                  </h4>
                </div>
              </div>

              <div style={{ background: '#E6F4EA', color: '#137333', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Results Computed Successfully. Go to "Publish Results" to release them.
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ComputeResults;
