/**
 * Faculty My Scripts (Evaluations) Page
 */
import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Award, ExternalLink, CheckSquare, Search, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [publishingId, setPublishingId] = useState(null);

  // Modal / Evaluation entry state
  const [activeScript, setActiveScript] = useState(null);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [paperLoading, setPaperLoading] = useState(false);

  // Forms
  const [marks, setMarks] = useState(''); // Overall marks fallback
  const [questionMarksInputs, setQuestionMarksInputs] = useState({}); // { 'Q1': 15, 'Q2': 18 }
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faculty/evaluations');
      if (response.data?.success) {
        setEvaluations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load assigned scripts');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishClass = async (examId) => {
    try {
      setPublishingId(examId);
      const response = await api.put(`/faculty/evaluations/publish-class/${examId}`);
      if (response.data?.success) {
        toast.success(response.data.message || 'Results published to class successfully!');
        fetchEvaluations();
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish class results');
    } finally {
      setPublishingId(null);
    }
  };

  // Group evaluations by exam
  const examGroups = useMemo(() => {
    const groups = {};
    evaluations.forEach(ev => {
      const examId = ev.examId;
      if (!groups[examId]) {
        groups[examId] = {
          examId,
          subjectName: ev.subjectName,
          subjectCode: ev.subjectCode,
          examType: ev.examType || 'internal1',
          total: 0,
          evaluated: 0,
          published: 0
        };
      }
      groups[examId].total += 1;
      if (ev.status === 'evaluated') groups[examId].evaluated += 1;
      if (ev.status === 'published') {
        groups[examId].evaluated += 1;
        groups[examId].published += 1;
      }
    });
    return Object.values(groups);
  }, [evaluations]);

  const handleOpenEvaluate = async (script) => {
    setActiveScript(script);
    setComments(script.comments || '');
    setQuestionPaper(null);
    setQuestionMarksInputs({});
    setMarks('');

    // Fetch Question Paper for this exam
    try {
      setPaperLoading(true);
      const response = await api.get(`/examcell/question-papers/exam/${script.examId?._id || script.examId}`);
      if (response.data?.success && response.data.data) {
        const paper = response.data.data;
        setQuestionPaper(paper);
        
        // Pre-fill inputs if already evaluated
        const initialInputs = {};
        if (script.status === 'evaluated' && script.questionMarks) {
          script.questionMarks.forEach(qm => {
            initialInputs[qm.questionNumber] = qm.marksObtained;
          });
        } else {
          const items = paper.slots && paper.slots.length > 0 ? paper.slots : paper.questions;
          items.forEach(item => {
            initialInputs[item.questionNumber] = '';
            if (item.or) {
              initialInputs[item.or.questionNumber] = '';
            }
          });
        }
        setQuestionMarksInputs(initialInputs);
      }
    } catch (error) {
      // Question paper not configured for this exam - fallback to single marks entry
      setMarks(script.marksObtained !== null ? script.marksObtained.toString() : '');
    } finally {
      setPaperLoading(false);
    }
  };

  const handleQuestionMarkChange = (qNum, value, maxVal) => {
    const parsedVal = parseFloat(value);
    if (parsedVal > maxVal) {
      toast.error(`Marks cannot exceed the maximum value of ${maxVal}`);
      return;
    }
    setQuestionMarksInputs(prev => ({
      ...prev,
      [qNum]: value,
    }));
  };

  // Calculate dynamic running sum of question marks (slot-aware, taking max of OR choices)
  const getRunningTotalSum = () => {
    if (!questionPaper) return 0;
    const items = questionPaper.slots && questionPaper.slots.length > 0 ? questionPaper.slots : questionPaper.questions;
    let sum = 0;
    items.forEach(item => {
      if (item.or) {
        const m1 = parseFloat(questionMarksInputs[item.questionNumber]) || 0;
        const m2 = parseFloat(questionMarksInputs[item.or.questionNumber]) || 0;
        sum += Math.max(m1, m2);
      } else {
        const m = parseFloat(questionMarksInputs[item.questionNumber]) || 0;
        sum += m;
      }
    });
    return sum;
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!activeScript) return;

    let payload = {
      comments,
    };

    if (questionPaper) {
      const items = questionPaper.slots && questionPaper.slots.length > 0 ? questionPaper.slots : questionPaper.questions;
      const qMarksArray = [];

      // Validate and collect marks
      for (const item of items) {
        if (item.or) {
          const v1 = questionMarksInputs[item.questionNumber];
          const v2 = questionMarksInputs[item.or.questionNumber];
          if ((v1 === undefined || v1 === '') && (v2 === undefined || v2 === '')) {
            toast.error(`Please enter marks for either ${item.questionNumber} or alternative ${item.or.questionNumber}`);
            return;
          }
          qMarksArray.push({
            questionNumber: item.questionNumber,
            marksObtained: parseFloat(v1) || 0
          });
          qMarksArray.push({
            questionNumber: item.or.questionNumber,
            marksObtained: parseFloat(v2) || 0
          });
        } else {
          const v = questionMarksInputs[item.questionNumber];
          if (v === undefined || v === '') {
            toast.error(`Please enter marks for question ${item.questionNumber}`);
            return;
          }
          qMarksArray.push({
            questionNumber: item.questionNumber,
            marksObtained: parseFloat(v) || 0
          });
        }
      }

      payload.questionMarks = qMarksArray;
      payload.marksObtained = getRunningTotalSum();
    } else {
      const parsedMarks = parseFloat(marks);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > activeScript.maxMarks) {
        toast.error(`Please enter valid marks between 0 and ${activeScript.maxMarks}`);
        return;
      }
      payload.marksObtained = parsedMarks;
    }

    try {
      setSubmitting(true);
      const scriptId = activeScript.scriptId || activeScript._id;
      const response = await api.put(`/faculty/evaluations/${scriptId}`, payload);

      if (response.data?.success) {
        toast.success('Evaluation marks submitted successfully!');
        setActiveScript(null);
        fetchEvaluations();
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '';
    const token = sessionStorage.getItem('token') || '';
    // Cloudinary URLs (raw uploads) require authentication — proxy through backend
    if (filePath.startsWith('http://res.cloudinary.com') || filePath.startsWith('https://res.cloudinary.com')) {
      return `http://localhost:5000/api/v1/file-proxy?url=${encodeURIComponent(filePath)}&token=${token}`;
    }
    // Local /uploads/ path
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

  const filteredEvaluations = evaluations.filter(ev => {
    const matchesSearch = 
      ev.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.studentUSN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExam = selectedExamId === 'all' || ev.examId === selectedExamId;
    return matchesSearch && matchesExam;
  });

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
            My Answer Scripts Evaluations
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Select assigned scanned booklets, fill in marking breakdowns, and publish scores to the class for internals.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search student, code, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.6rem 0.6rem 2.2rem',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontSize: '0.9rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
        </div>
      </div>

      {/* Course Batches Overview */}
      {examGroups.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
            Course Exam Batches
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* 'All' Toggle Card */}
            <div
              onClick={() => setSelectedExamId('all')}
              style={{
                background: selectedExamId === 'all' ? '#EFF6FF' : 'white',
                border: selectedExamId === 'all' ? '2px solid #3B82F6' : '1px solid #E5E5E5',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.9rem',
                color: selectedExamId === 'all' ? '#1E40AF' : '#4B5563',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              Show All Batches ({evaluations.length} scripts)
            </div>

            {/* Individual Batch Cards */}
            {examGroups.map((group) => {
              const isSelected = selectedExamId === group.examId;
              const pct = group.total > 0 ? Math.round((group.evaluated / group.total) * 100) : 0;
              const isFullyEvaluated = group.evaluated === group.total;
              const isPublished = group.published === group.total && group.total > 0;
              const isInternal = group.examType === 'internal1' || group.examType === 'internal2';

              return (
                <div
                  key={group.examId}
                  onClick={() => setSelectedExamId(group.examId)}
                  style={{
                    background: isSelected ? '#FDFDFD' : 'white',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid #E5E5E5',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                        {group.subjectCode}
                      </span>
                      <Badge variant={isInternal ? 'secondary' : 'gold'}>
                        {group.examType}
                      </Badge>
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-navy)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {group.subjectName}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ spaceY: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5C5C5C', marginBottom: '0.2rem' }}>
                      <span>Grading Progress</span>
                      <strong>{group.evaluated} / {group.total}</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isFullyEvaluated ? '#10B981' : '#3B82F6', borderRadius: '3px' }}></div>
                    </div>
                  </div>

                  {/* Action or Release Status */}
                  <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '0.25rem' }}>
                    {isPublished ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.8rem', fontWeight: '600' }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></span>
                        Released to Class
                      </div>
                    ) : isFullyEvaluated ? (
                      isInternal ? (
                        <button
                          onClick={() => handlePublishClass(group.examId)}
                          disabled={publishingId === group.examId}
                          style={{
                            width: '100%',
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {publishingId === group.examId ? 'Publishing...' : 'Release Scores to Class'}
                        </button>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', italic: 'true', fontWeight: '500' }}>
                          Awaiting Exam Cell Release
                        </div>
                      )
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '500' }}>
                        Grading in progress...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of Evaluations */}
      {filteredEvaluations.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '4rem 1rem', textAlign: 'center', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <ClipboardList size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            No answer scripts match filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredEvaluations.map((ev) => (
            <div
              key={ev.scriptId}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #E5E5E5',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                      {ev.subjectCode}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-navy)', marginTop: '0.2rem' }}>
                      {ev.subjectName}
                    </h3>
                  </div>
                  <Badge variant={
                    ev.status === 'published' ? 'gold' :
                    ev.status === 'evaluated' ? 'success' : 'secondary'
                  }>
                    {ev.status}
                  </Badge>
                </div>

                <div style={{ background: 'var(--color-bg)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Student:</span>
                    <strong style={{ color: 'var(--color-text)' }}>{ev.studentName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>USN:</span>
                    <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{ev.studentUSN}</strong>
                  </div>
                </div>

                {ev.marksObtained !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Award size={18} color="var(--color-navy)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Marks Given:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-navy)' }}>{ev.marksObtained} / {ev.maxMarks}</strong>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={getFileUrl(ev.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  <ExternalLink size={14} /> View booklet PDF
                </a>

                {ev.status === 'published' ? (
                  <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Published</span>
                ) : (
                  <button
                    onClick={() => handleOpenEvaluate(ev)}
                    style={{
                      background: 'var(--color-navy)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'background 0.2s',
                    }}
                  >
                    {ev.status === 'evaluated' ? 'Edit Marks' : 'Evaluate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Split-Screen Modal */}
      {activeScript && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1100px',
            height: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{ background: 'var(--color-navy)', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', shrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={18} color="var(--color-gold)" /> Digital Valuation Console
              </h3>
              <button
                onClick={() => setActiveScript(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.8 }}
              >
                &times;
              </button>
            </div>

            {/* Split Screen Columns */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              
              {/* Left Side: PDF Viewer */}
              <div style={{ flex: 1.2, borderRight: '1px solid #E5E5E5', background: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
                <iframe
                  src={getFileUrl(activeScript.filePath)}
                  title="Answer Booklet Scans"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Right Side: Evaluation Marks Form */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {paperLoading ? (
                  <div><LoadingSkeleton count={4} /></div>
                ) : (
                  <form onSubmit={handleSubmitEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#666' }}>
                        Candidate USN: <strong style={{ color: 'var(--color-navy)' }}>{activeScript.studentUSN}</strong>
                      </p>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '750', color: 'var(--color-navy)' }}>
                        {activeScript.studentName}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                        {activeScript.subjectName} ({activeScript.subjectCode})
                      </p>
                    </div>

                    {/* Render Question Breakdown OR Fallback Overall Marks */}
                    {questionPaper ? (
                      <div style={{ border: '1px solid #E5E5E5', borderRadius: '8px', padding: '1rem', background: '#F9F9F9' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Question-by-Question Marking Scheme
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {(questionPaper.slots && questionPaper.slots.length > 0 ? questionPaper.slots : questionPaper.questions).map((q, idx) => (
                            <div key={idx} style={{ padding: q.or ? '0.75rem' : '0', background: q.or ? '#FFFBEB' : 'transparent', border: q.or ? '1px dashed #FDE68A' : 'none', borderRadius: q.or ? '8px' : '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                  {q.questionNumber} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#666' }}>({q.text || 'Question'})</span>
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={q.maxMarks.toString()}
                                    value={questionMarksInputs[q.questionNumber] || ''}
                                    onChange={(e) => handleQuestionMarkChange(q.questionNumber, e.target.value, q.maxMarks)}
                                    placeholder={`Max ${q.maxMarks}`}
                                    style={{ width: '80px', padding: '0.4rem', border: '1px solid #CCC', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center', background: 'white' }}
                                    required={!q.or}
                                  />
                                  <span style={{ fontSize: '0.8rem', color: '#666' }}>/ {q.maxMarks}</span>
                                </div>
                              </div>

                              {q.or && (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#F59E0B', color: 'white', px: '1.5', py: '0.5', borderRadius: '4px', textTransform: 'uppercase', padding: '1px 4px' }}>OR Choice Alternative</span>
                                    <div style={{ flex: 1, borderBottom: '1px dotted #FCD34D' }}></div>
                                  </div>
                                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#B45309' }}>
                                      {q.or.questionNumber} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#92400E' }}>({q.or.text || 'Alternative'})</span>
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max={q.or.maxMarks.toString()}
                                        value={questionMarksInputs[q.or.questionNumber] || ''}
                                        onChange={(e) => handleQuestionMarkChange(q.or.questionNumber, e.target.value, q.or.maxMarks)}
                                        placeholder={`Max ${q.or.maxMarks}`}
                                        style={{ width: '80px', padding: '0.4rem', border: '1px solid #CCC', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center', background: 'white' }}
                                      />
                                      <span style={{ fontSize: '0.8rem', color: '#92400E' }}>/ {q.or.maxMarks}</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid #E5E5E5', marginTop: '1.25rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                          <span style={{ color: 'var(--color-navy)' }}>Total Calculated Score:</span>
                          <span style={{ fontSize: '1.1rem', color: 'var(--color-navy)' }}>{getRunningTotalSum()} / {questionPaper.maxMarks}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                          <AlertCircle size={16} color="#EA580C" />
                          <span style={{ fontSize: '0.8rem', color: '#9A3412', lineHeight: '1.4' }}>
                            No question paper configured. Falling back to overall score entry.
                          </span>
                        </div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.25rem' }}>
                          MARKS OBTAINED (Max {activeScript.maxMarks})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={activeScript.maxMarks.toString()}
                          value={marks}
                          onChange={(e) => setMarks(e.target.value)}
                          placeholder="e.g. 78.5"
                          style={{ width: '100%', padding: '0.6rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.95rem' }}
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.25rem' }}>
                        EVALUATION COMMENTS / REMARKS
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Feedback for student (optional)..."
                        rows="3"
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #CCC', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                      <Button type="button" variant="outline" onClick={() => setActiveScript(null)} style={{ border: '1px solid #CCC', color: '#555' }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Evaluation'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Evaluations;
