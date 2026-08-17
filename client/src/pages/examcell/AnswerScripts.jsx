/**
 * Exam Cell Answer Scripts & Marks Dashboard
 */
import { useState, useEffect } from 'react';
import { Upload, UserCheck, CheckCircle, Send, AlertTriangle, Play, BarChart2, CheckSquare, Layers } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

const AnswerScripts = () => {
  const { currentAcademicYear } = useAcademicYear();
  const [activeTab, setActiveTab] = useState('upload');
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states (Single Upload)
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [mockFileName, setMockFileName] = useState('');
  const [isMockUpload, setIsMockUpload] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [bulkExam, setBulkExam] = useState('');
  const [bulkUSNs, setBulkUSNs] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single', 'bulk', 'ai'

  // AI-Assisted Bulk Upload state
  const [aiExam, setAiExam] = useState('');
  const [aiFiles, setAiFiles] = useState([]);
  const [aiUploading, setAiUploading] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  // Evaluator assignment state
  const [assigningId, setAssigningId] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState({});

  // Auto Bundle Distribution state
  const [distributeExam, setDistributeExam] = useState('');
  const [bundleSize, setBundleSize] = useState('10');
  const [distributing, setDistributing] = useState(false);
  const [distributeResult, setDistributeResult] = useState(null);

  // Manual Assignment state (NEW)
  const [manualExam, setManualExam] = useState('');
  const [manualFaculty, setManualFaculty] = useState('');
  const [assignmentType, setAssignmentType] = useState('all'); // 'all' or 'specific'
  const [specificUSN, setSpecificUSN] = useState('');
  const [manualAssigning, setManualAssigning] = useState(false);

  // Publish state
  const [publishSemester, setPublishSemester] = useState('5');
  const [publishing, setPublishing] = useState(false);
  const [showPublishPreview, setShowPublishPreview] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Evaluation Agent states
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStats, setAgentStats] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [studentsRes, examsRes, facultyRes, scriptsRes] = await Promise.all([
        api.get('/examcell/students'),
        api.get('/examcell/exams'),
        api.get('/examcell/faculty'),
        api.get('/examcell/answer-scripts/review'),
      ]);

      if (studentsRes.data?.success) setStudents(studentsRes.data.data);
      if (examsRes.data?.success) setExams(examsRes.data.data);
      if (facultyRes.data?.success) setFaculty(facultyRes.data.data);
      if (scriptsRes.data?.success) setScripts(scriptsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshScripts = async () => {
    try {
      const response = await api.get('/examcell/answer-scripts/review');
      if (response.data?.success) {
        setScripts(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing scripts:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedExam) {
      toast.error('Please select student and exam');
      return;
    }

    try {
      setUploading(true);
      const payload = {
        studentUSN: selectedStudent,
        examId: selectedExam,
      };

      let response;
      if (!isMockUpload && selectedFile) {
        const formData = new FormData();
        formData.append('studentUSN', selectedStudent);
        formData.append('examId', selectedExam);
        formData.append('file', selectedFile);
        
        response = await api.post('/examcell/answer-scripts/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        payload.mockFileName = mockFileName || `Scanned_Script_${selectedStudent}.pdf`;
        response = await api.post('/examcell/answer-scripts/upload', payload);
      }

      if (response.data?.success) {
        toast.success('Answer script registered successfully!');
        setSelectedStudent('');
        setSelectedExam('');
        setSelectedFile(null);
        setMockFileName('');
        refreshScripts();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to register script');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkExam || !bulkUSNs.trim()) {
      toast.error('Please select exam and provide student USNs');
      return;
    }

    try {
      setBulkUploading(true);
      const response = await api.post('/examcell/answer-scripts/bulk-upload', {
        examId: bulkExam,
        studentUSNs: bulkUSNs,
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        if (response.data.skipped?.length > 0) {
          toast.warning(`Skipped unknown USNs: ${response.data.skipped.join(', ')}`, { duration: 6000 });
        }
        setBulkUSNs('');
        setBulkExam('');
        refreshScripts();
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to bulk upload answer scripts');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleAiBulkUpload = async (e) => {
    e.preventDefault();
    if (!aiExam || aiFiles.length === 0) {
      toast.error('Please select an exam and choose booklets to upload');
      return;
    }

    try {
      setAiUploading(true);
      setAiResults(null);
      const formData = new FormData();
      formData.append('examId', aiExam);
      for (const file of aiFiles) {
        formData.append('files', file);
      }

      const response = await api.post('/examcell/answer-scripts/bulk-upload-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        setAiResults(response.data);
        setAiFiles([]);
        setAiExam('');
        refreshScripts();
      }
    } catch (error) {
      console.error('AI upload error:', error);
      toast.error(error.response?.data?.message || 'AI Batch registration failed');
    } finally {
      setAiUploading(false);
    }
  };

  const handleAssignEvaluator = async (scriptId) => {
    const facultyId = selectedFaculty[scriptId];
    if (!facultyId) {
      toast.error('Please select a faculty evaluator');
      return;
    }

    try {
      setAssigningId(scriptId);
      const response = await api.post('/examcell/answer-scripts/assign-evaluator', {
        scriptId,
        facultyEmployeeId: facultyId,
      });

      if (response.data?.success) {
        toast.success('Evaluator assigned successfully!');
        refreshScripts();
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign evaluator');
    } finally {
      setAssigningId(null);
    }
  };

  const handleBundleDistribute = async (e) => {
    e.preventDefault();
    if (!distributeExam) {
      toast.error('Please select an exam to distribute scripts');
      return;
    }

    try {
      setDistributing(true);
      setDistributeResult(null);
      const response = await api.post('/examcell/answer-scripts/bundle-distribute', {
        examId: distributeExam,
        bundleSize: parseInt(bundleSize),
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        setDistributeResult(response.data);
        refreshScripts();
      }
    } catch (error) {
      console.error('Bundle distribution error:', error);
      toast.error(error.response?.data?.message || 'Bundle distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  const handleManualAssignment = async (e) => {
    e.preventDefault();
    if (!manualExam || !manualFaculty) {
      toast.error('Please select exam and evaluator');
      return;
    }

    if (assignmentType === 'specific' && !specificUSN.trim()) {
      toast.error('Please enter student USN');
      return;
    }

    try {
      setManualAssigning(true);
      const response = await api.patch('/examcell/answer-scripts/manual-assign-evaluator', {
        examId: manualExam,
        facultyId: manualFaculty,
        assignAll: assignmentType === 'all',
        usn: assignmentType === 'specific' ? specificUSN.trim() : undefined
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Evaluator assigned successfully');
        setManualExam('');
        setManualFaculty('');
        setSpecificUSN('');
        setAssignmentType('all');
        refreshScripts();
      }
    } catch (error) {
      console.error('Manual assignment error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign evaluator');
    } finally {
      setManualAssigning(false);
    }
  };

  const handlePublishResults = async () => {
    if (!publishSemester) {
      toast.error('Please select semester to publish');
      return;
    }

    if (!confirm(`Are you sure you want to publish Semester ${publishSemester} results?`)) {
      return;
    }

    try {
      setPublishing(true);
      const response = await api.post('/examcell/answer-scripts/publish', {
        semester: parseInt(publishSemester),
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Results published and notifications sent!');
        refreshScripts();
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish results. Make sure evaluated papers exist.');
    } finally {
      setPublishing(false);
    }
  };

  const runEvaluationAgent = async () => {
    try {
      setAgentRunning(true);
      const response = await api.post('/examcell/agents/run-evaluation');
      if (response.data?.success) {
        setAgentStats(response.data.data);
        toast.success('AI Evaluation Agent run successfully!');
      }
    } catch (error) {
      console.error('Agent error:', error);
      toast.error('Evaluation agent failed to run');
    } finally {
      setAgentRunning(false);
    }
  };

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-5xl mx-auto"><LoadingSkeleton count={5} /></div>;
  }

  const scriptsCount = scripts.length;
  const evaluatedCount = scripts.filter(s => ['evaluated', 'published'].includes(s.status)).length;
  const pendingCount = scriptsCount - evaluatedCount;

  return (
    <div style={{ minHeight: 'calc(100vh - 280px)' }}>
      
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        {/* ROW 1: Title */}
        <div style={{ marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
            Answer Scripts & Marks Dashboard
          </h1>
        </div>

        {/* ROW 2: Description */}
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
          Register student answer books, distribute scripts in bundles to faculty evaluators, run AI checks, and publish sem results.
        </p>

        {/* ROW 3: Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #EEEEEE', marginBottom: '28px' }}>
          {[
            { id: 'upload', label: 'Upload Scripts', icon: Upload },
            { id: 'assign', label: 'Evaluator Assignments', icon: UserCheck },
            { id: 'status', label: 'Evaluation Status (AI)', icon: BarChart2 },
            { id: 'publish', label: 'Publish Results', icon: Send }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: isActive ? '2px solid var(--color-navy)' : '2px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-navy)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content area */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        
        {/* TAB 1: UPLOAD SCRIPTS */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: '680px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} style={{ color: 'var(--color-gold)' }} /> AI USN Scanned Auto-Allocation
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '680px' }}>
                Upload your scanned candidate booklets here. The system will automatically scan each booklet, extract the student USN using the AI agent, register the records in the database, and distribute the answer scripts directly to the eligible faculty evaluator.
              </p>
            </div>
            
            <form onSubmit={handleAiBulkUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                  Exam / Subject
                </label>
                <select
                  value={aiExam}
                  onChange={(e) => setAiExam(e.target.value)}
                  style={{ width: '100%', maxWidth: '560px', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.subjectId?.subjectName} ({e.subjectId?.subjectCode}) - Sem {e.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                  Upload Answer Booklet PDF Scans
                </label>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => setAiFiles(Array.from(e.target.files))}
                    style={{ 
                      width: '100%',
                      maxWidth: '560px',
                      border: '2px dashed #D0D0D0',
                      borderRadius: '8px',
                      padding: '28px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#FAFAFA',
                      transition: 'border-color 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = 'var(--color-gold)';
                      e.target.style.backgroundColor = '#FFFDF5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#D0D0D0';
                      e.target.style.backgroundColor = '#FAFAFA';
                    }}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0px', maxWidth: '560px' }}>
                  Choose multiple PDF scanned scripts at once. The AI agent scans each file header/name (e.g. <code>1PE21CS001_ML.pdf</code>), extracts the USN, and logs the records automatically.
                </p>
              </div>

              {aiFiles.length > 0 && (
                <div style={{ backgroundColor: '#F5F5F5', borderRadius: '8px', padding: '16px', border: '1px solid #E5E5E5', maxWidth: '560px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>Selected Scans ({aiFiles.length}):</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '16px', fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                    {aiFiles.slice(0, 5).map((f, i) => <li key={i}>{f.name}</li>)}
                    {aiFiles.length > 5 && <li>...and {aiFiles.length - 5} more files</li>}
                  </ul>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={aiUploading} 
                style={{ 
                  backgroundColor: 'var(--color-navy)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  padding: '12px 28px', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginTop: '4px',
                  maxWidth: '560px'
                }}
                onMouseEnter={(e) => !aiUploading && (e.currentTarget.style.backgroundColor = 'var(--color-navy-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-navy)')}
              >
                <Play size={14} /> {aiUploading ? 'Running AI USN Extractor...' : 'Run Scans & Auto-Register'}
              </Button>
            </form>

              {/* AI Results Feedback */}
              {aiResults && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <CheckCircle size={15} /> {aiResults.message}
                  </h3>

                  {/* Successfully processed */}
                  {aiResults.processed?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Successfully Matched & Registered:</p>
                      <div className="max-h-36 overflow-y-auto text-xs border border-emerald-100 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-emerald-50/50">
                            <tr className="text-[9px] font-bold text-emerald-800 text-left uppercase">
                              <th className="p-2">Student Name</th>
                              <th className="p-2">USN</th>
                              <th className="p-2">Assigned Evaluator</th>
                              <th className="p-2">File Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiResults.processed.map((item, idx) => (
                              <tr key={idx} className="border-t border-emerald-50">
                                <td className="p-2 font-medium text-gray-700">{item.studentName}</td>
                                <td className="p-2 font-mono font-bold text-[#1E3A5F]">{item.usn}</td>
                                <td className="p-2 font-semibold text-emerald-700">{item.assignedTo || 'Unassigned'}</td>
                                <td className="p-2 text-gray-400 font-mono text-[10px]">{item.fileName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Failed / Skipped files */}
                  {aiResults.failed?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Extraction Warnings / Fails:</p>
                      <div className="max-h-36 overflow-y-auto text-xs border border-amber-100 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-amber-50/50">
                            <tr className="text-[9px] font-bold text-amber-800 text-left uppercase">
                              <th className="p-2">File Name</th>
                              <th className="p-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiResults.failed.map((item, idx) => (
                              <tr key={idx} className="border-t border-amber-50">
                                <td className="p-2 font-mono text-gray-700 text-[10px]">{item.fileName}</td>
                                <td className="p-2 font-semibold text-amber-700">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}

        {/* TAB 2: EVALUATOR ASSIGNMENTS */}
        {activeTab === 'assign' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* SECTION 1: Auto Bundle Distribution */}
            <div style={{ backgroundColor: '#F9F9F9', borderRadius: '10px', border: '1px solid #E5E5E5', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Layers size={18} style={{ color: 'var(--color-gold)' }} /> Bulk Bundle Auto-Distribution
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Automatically allocate unassigned answer scripts in bundles to eligible faculty members. Internals will strictly match department course instructors, whereas external SEE centralized subjects can be round-robin pooled across related departments.
              </p>
              
              <form onSubmit={handleBundleDistribute} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                    Exam / Subject
                  </label>
                  <select
                    value={distributeExam}
                    onChange={(e) => setDistributeExam(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)', backgroundColor: 'white' }}
                    required
                  >
                    <option value="">-- Choose Exam --</option>
                    {exams.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.subjectId?.subjectName} ({e.subjectId?.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                    Bundle Size
                  </label>
                  <select
                    value={bundleSize}
                    onChange={(e) => setBundleSize(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)', backgroundColor: 'white' }}
                  >
                    <option value="5">5 Papers</option>
                    <option value="10">10 Papers</option>
                    <option value="15">15 Papers</option>
                    <option value="20">20 Papers</option>
                  </select>
                </div>

                <Button type="submit" disabled={distributing} style={{ backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', padding: '12px 24px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                  {distributing ? 'Distributing...' : 'Run Auto Bundle Allocator'}
                </Button>
              </form>

              {/* Distribution result summary */}
              {distributeResult && (
                <div style={{ backgroundColor: 'white', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckCircle size={14} /> Allocation complete! Distributed {distributeResult.distributedCount} papers.
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.875rem', border: '1px solid #F0F0F0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9F9F9', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#999', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Faculty Instructor</th>
                          <th style={{ padding: '10px' }}>Department</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Bundle Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distributeResult.summary?.map((item, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #F0F0F0' }}>
                            <td style={{ padding: '10px', fontWeight: 600, color: '#333' }}>{item.facultyName} ({item.employeeId})</td>
                            <td style={{ padding: '10px', color: '#666' }}>CSE/ECE/Related</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--color-navy)' }}>{item.bundleSize} papers</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Manual Evaluator Assignment (NEW) */}
            <div style={{ backgroundColor: '#F9F9F9', borderRadius: '10px', border: '1px solid #E5E5E5', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>
                Manual Evaluator Assignment
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Assign a specific faculty member to evaluate scripts for a particular exam. This overrides auto-allocation for selected scripts.
              </p>

              <form onSubmit={handleManualAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Exam/Subject */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                      Exam / Subject
                    </label>
                    <select
                      value={manualExam}
                      onChange={(e) => setManualExam(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)', backgroundColor: 'white' }}
                      required
                    >
                      <option value="">-- Select Exam --</option>
                      {exams.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.subjectId?.subjectName} ({e.subjectId?.subjectCode}) - Sem {e.semester}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Evaluator (Faculty) */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                      Evaluator (Faculty)
                    </label>
                    <select
                      value={manualFaculty}
                      onChange={(e) => setManualFaculty(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)', backgroundColor: 'white' }}
                      required
                    >
                      <option value="">-- Select Faculty --</option>
                      {faculty.map((f) => (
                        <option key={f._id} value={f.employeeId}>
                          {f.name} ({f.employeeId} - {f.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assignment Type */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                    Assignment Type
                  </label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="all"
                        checked={assignmentType === 'all'}
                        onChange={(e) => setAssignmentType(e.target.value)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>All Scripts for this Exam</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="specific"
                        checked={assignmentType === 'specific'}
                        onChange={(e) => setAssignmentType(e.target.value)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Specific Student USN</span>
                    </label>
                  </div>
                </div>

                {/* Student USN (conditional) */}
                {assignmentType === 'specific' && (
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                      Student USN
                    </label>
                    <input
                      type="text"
                      value={specificUSN}
                      onChange={(e) => setSpecificUSN(e.target.value)}
                      placeholder="e.g. 4PM23CS001"
                      style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', fontSize: '0.95rem', border: '1.5px solid #E0E0E0', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}
                      required={assignmentType === 'specific'}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={manualAssigning}
                  style={{ 
                    backgroundColor: 'var(--color-navy)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '12px 28px', 
                    fontSize: '0.95rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  {manualAssigning ? 'Assigning...' : 'Assign Evaluator'}
                </Button>
              </form>
            </div>

            {/* SECTION 3: Individual Script Allocations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F0F0F0', paddingBottom: '12px' }}>
                <UserCheck size={20} style={{ color: 'var(--color-gold)' }} /> Individual Script Allocations
              </h2>

              {scripts.length === 0 ? (
                <div className="text-center py-12 text-[#5C5C5C]">
                  <AlertTriangle size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No answer booklets registered to allocate.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500">
                        <th className="p-3">Student Candidate</th>
                        <th className="p-3">Exam / Subject</th>
                        <th className="p-3">Evaluator Assigned</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scripts.map((script) => (
                        <tr key={script._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-3">
                            <div className="font-bold text-gray-850">{script.studentId?.name || 'N/A'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{script.studentId?.usn || 'N/A'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-gray-800">{script.examId?.subjectId?.subjectName || 'N/A'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{script.examId?.subjectId?.subjectCode || 'N/A'}</div>
                          </td>
                          <td className="p-3">
                            {script.evaluatorId ? (
                              <span className="font-semibold text-[#1E3A5F]">{script.evaluatorId.name}</span>
                            ) : (
                              <select
                                value={selectedFaculty[script._id] || ''}
                                onChange={(e) => setSelectedFaculty({ ...selectedFaculty, [script._id]: e.target.value })}
                                className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#C9A227]"
                              >
                                <option value="">-- Choose Evaluator --</option>
                                {faculty.map((f) => (
                                  <option key={f._id} value={f.employeeId}>{f.name} ({f.department})</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={
                              script.status === 'published' ? 'gold' :
                              script.status === 'evaluated' ? 'emerald' :
                              script.status === 'assigned' ? 'navy' : 'secondary'
                            }>
                              {script.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {!script.evaluatorId ? (
                              <button
                                onClick={() => handleAssignEvaluator(script._id)}
                                disabled={assigningId === script._id}
                                className="px-3 py-1 bg-[#1E3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#152a46] transition disabled:opacity-50"
                              >
                                {assigningId === script._id ? 'Assigning...' : 'Assign'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                {script.status === 'assigned' ? 'Awaiting evaluation' : 'Valuation complete'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EVALUATION STATUS & AI AGENT */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                  <BarChart2 size={20} className="text-[#C9A227]" /> Valuation Completion Metrics
                </h2>
                <p className="text-[#5C5C5C] text-xs mt-0.5">
                  Execute evaluation pipeline analyzer to compile subject statistics and audit grading benchmarks.
                </p>
              </div>

              <Button onClick={runEvaluationAgent} disabled={agentRunning} className="flex items-center gap-2 text-xs">
                <Play size={14} /> {agentRunning ? 'Analyzing...' : 'Run Evaluation Agent'}
              </Button>
            </div>

            {/* Quick overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">TOTAL SCRIPTS</span>
                <h3 className="text-2xl font-bold text-[#1E3A5F] mt-1">{scriptsCount}</h3>
              </div>
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">EVALUATED</span>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{evaluatedCount}</h3>
              </div>
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">PENDING VALUATION</span>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</h3>
              </div>
            </div>

            {/* Detailed Stats from Agent */}
            {agentStats ? (
              <div className="border-t border-gray-100 pt-6 space-y-6 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-[#1E3A5F] uppercase tracking-wide">
                  Evaluation Analytics Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-600">Valuation Completion Rate</span>
                        <span className="text-[#C9A227]">{agentStats.evaluatedScripts > 0 ? Math.round((agentStats.evaluatedScripts / agentStats.totalScripts) * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-150">
                        <div className="h-full bg-[#C9A227] rounded-full transition-all duration-500" style={{
                          width: `${agentStats.totalScripts > 0 ? (agentStats.evaluatedScripts / agentStats.totalScripts) * 100 : 0}%`
                        }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Score</span>
                        <h4 className="text-lg font-bold text-[#1E3A5F] mt-1">{agentStats.averageMarks} / 100</h4>
                      </div>
                      <div className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pass Percentage</span>
                        <h4 className="text-lg font-bold text-emerald-700 mt-1">{agentStats.passRate}%</h4>
                      </div>
                    </div>
                  </div>

                  {/* Agent Run Log */}
                  <div className="bg-[#1E1E1E] text-[#00FF00] font-mono rounded-2xl p-4 text-[11px] leading-relaxed shadow-inner">
                    <div className="border-b border-[#333] pb-2 mb-2 text-[#888] font-bold text-[10px]">
                      AGENT CONSOLE LOGS
                    </div>
                    <div>[INFO] Initializing Evaluation Analysis pipeline...</div>
                    <div>[INFO] Scanning Mongoose collection AnswerScript...</div>
                    <div>[SUCCESS] Found {agentStats.totalScripts} student records.</div>
                    <div>[SUCCESS] Evaluated scripts total: {agentStats.evaluatedScripts}.</div>
                    <div>[PROCESS] Aggregating course grade points...</div>
                    <div className="text-amber-400">[METRIC] Average subject marks score: {agentStats.averageMarks}</div>
                    <div className="text-amber-400">[METRIC] Aggregate pass rate: {agentStats.passRate}%</div>
                    <div className="text-[#00FF00] font-bold">[STATUS] {agentStats.agentRun?.logs || 'Successfully finished valuation check.'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 rounded-2xl bg-gray-50/50">
                <p className="text-xs font-semibold">Run the evaluation agent to generate statistics and audit metrics.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PUBLISH RESULTS */}
        {activeTab === 'publish' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* ── SECTION 1: CONFIGURE ── */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #F0F0F0',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Send size={20} style={{ color: 'var(--color-gold)' }} />
                Publish Semester Results
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '20px',
                lineHeight: 1.5
              }}>
                Publishing releases result cards to student portals and sends personalized email grade sheets automatically.
              </p>

              {/* Three filter fields */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                {/* Semester */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Semester
                  </label>
                  <select
                    value={publishSemester}
                    onChange={(e) => setPublishSemester(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1.5px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: 'white',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 200ms ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-gold)'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem.toString()}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={currentAcademicYear}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1.5px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#F9FAFB',
                      outline: 'none',
                      fontFamily: 'var(--font-body)'
                    }}
                  />
                </div>

                {/* Department */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Department
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1.5px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: 'white',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 200ms ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-gold)'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                  >
                    <option value="all">All Departments</option>
                    <option value="cse">Computer Science</option>
                    <option value="ece">Electronics</option>
                    <option value="ds">Data Science</option>
                  </select>
                </div>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setShowPublishPreview(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-navy)',
                  border: '1.5px solid var(--color-navy)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FF';
                  e.currentTarget.style.borderColor = '#2A4A70';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--color-navy)';
                }}
              >
                Preview what will be published →
              </button>
            </div>

            {/* ── SECTION 2: PREVIEW (Conditional) ── */}
            {showPublishPreview && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '3px solid var(--color-navy)',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--color-navy)',
                    marginBottom: '16px'
                  }}>
                    Publication Preview
                  </h3>

                  {/* Summary Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    {[
                      { label: 'Students to Notify', value: 156, color: '#2563EB' },
                      { label: 'Already Published', value: 12, color: '#059669' },
                      { label: 'Pass', value: 140, color: '#059669' },
                      { label: 'Fail', value: 16, color: '#DC2626' }
                    ].map((stat, i) => (
                      <div key={i} style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #EEEEEE',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <p style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '6px'
                        }}>
                          {stat.label}
                        </p>
                        <p style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: stat.color
                        }}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Warning if failures */}
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    fontSize: '0.875rem',
                    color: '#991B1B',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>⚠</span>
                    <span>16 students have failed one or more subjects. Please verify results before publishing.</span>
                  </div>

                  {/* Results Table */}
                  <div style={{
                    border: '1px solid #EEEEEE',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem'
                    }}>
                      <thead style={{ backgroundColor: 'var(--color-navy)', position: 'sticky', top: 0 }}>
                        <tr>
                          {['USN', 'Name', 'Department', 'Semester', 'SGPA', 'Result', 'Status'].map(h => (
                            <th key={h} style={{
                              padding: '12px',
                              textAlign: 'left',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: 'white',
                              borderRight: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { usn: '1SD21CS001', name: 'Alice Smith', dept: 'CSE', sem: 4, sgpa: 8.5, result: 'PASS', status: 'Will Publish' },
                          { usn: '1SD21CS002', name: 'Bob Johnson', dept: 'CSE', sem: 4, sgpa: 7.2, result: 'PASS', status: 'Already Published' },
                          { usn: '1SD21CS003', name: 'Charlie Brown', dept: 'CSE', sem: 4, sgpa: 4.2, result: 'FAIL', status: 'Will Publish' },
                          { usn: '1SD21CS004', name: 'Diana Prince', dept: 'CSE', sem: 4, sgpa: 9.1, result: 'PASS', status: 'Will Publish' },
                          { usn: '1SD21CS005', name: 'Eve Wilson', dept: 'CSE', sem: 4, sgpa: 6.8, result: 'PASS', status: 'Will Publish' }
                        ].map((row, i) => (
                          <tr key={i} style={{
                            borderBottom: '1px solid #F5F5F5',
                            backgroundColor: i % 2 === 0 ? 'transparent' : '#F9FAFB'
                          }}>
                            <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-navy)' }}>{row.usn}</span></td>
                            <td style={{ padding: '10px 12px' }}>{row.name}</td>
                            <td style={{ padding: '10px 12px' }}>{row.dept}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.sem}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-navy)' }}>{row.sgpa}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: row.result === 'PASS' ? '#059669' : '#DC2626' }}>{row.result}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: row.status === 'Will Publish' ? '#DBEAFE' : '#DCFCE7',
                                color: row.status === 'Will Publish' ? '#1E40AF' : '#065F46'
                              }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Publish Action */}
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: publishing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    opacity: publishing ? 0.6 : 1,
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!publishing) e.currentTarget.style.backgroundColor = '#2A4A70';
                  }}
                  onMouseLeave={(e) => {
                    if (!publishing) e.currentTarget.style.backgroundColor = 'var(--color-navy)';
                  }}
                >
                  <Send size={18} />
                  {publishing ? 'Publishing...' : 'Publish All Results'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIRMATION MODAL ── */}
        {showPublishConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
              width: '100%',
              maxWidth: '450px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: '12px'
              }}>
                Confirm Publication
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text)',
                marginBottom: '16px',
                lineHeight: 1.6
              }}>
                You are about to publish results for <strong>156 students</strong> in <strong>Semester 4</strong>.
              </p>
              <div style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #EEEEEE',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6
              }}>
                <p style={{ marginBottom: '6px', fontWeight: 600, color: 'var(--color-text)' }}>This will:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
                  <li>✓ Release results to student portals</li>
                  <li>✓ Send email grade sheets to all students</li>
                  <li>✓ Notify HOD with department summary</li>
                </ul>
              </div>
              <p style={{
                fontSize: '0.8rem',
                color: '#DC2626',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                ⚠ This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'white',
                    color: 'var(--color-navy)',
                    border: '1.5px solid var(--color-navy)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handlePublishResults();
                    setShowPublishConfirm(false);
                  }}
                  disabled={publishing}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: publishing ? 'not-allowed' : 'pointer',
                    opacity: publishing ? 0.6 : 1,
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!publishing) e.currentTarget.style.backgroundColor = '#2A4A70';
                  }}
                  onMouseLeave={(e) => {
                    if (!publishing) e.currentTarget.style.backgroundColor = 'var(--color-navy)';
                  }}
                >
                  {publishing ? 'Publishing...' : 'Confirm & Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AnswerScripts;
